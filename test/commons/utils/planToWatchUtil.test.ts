import type { PlanToWatch } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { PlanToWatchUtil } from "@/commons/utils/planToWatchUtil";
import { RecordStorageUtil } from "@/commons/utils/storageUtil";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the storage utility
vi.mock("@/commons/utils/storageUtil");
const mockRecordStorageUtil = vi.mocked(RecordStorageUtil);

describe("PlanToWatchUtil", () => {
    const mockPlan: PlanToWatch = {
        animeId: "123",
        animeTitle: "Test Anime",
        animeSlug: "test-anime-123",
        addedAt: "2025-07-10T10:00:00.000Z",
    };

    const mockPlanRecord = {
        "123": mockPlan,
        "456": { ...mockPlan, animeId: "456", animeTitle: "Another Anime" },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getAll", () => {
        it("should return all plan to watch records", async () => {
            mockRecordStorageUtil.getAll.mockResolvedValue(mockPlanRecord);

            const result = await PlanToWatchUtil.getAll();

            expect(mockRecordStorageUtil.getAll).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH);
            expect(result).toEqual(mockPlanRecord);
        });
    });

    describe("getAllAsArray", () => {
        it("should return all plans as array", async () => {
            mockRecordStorageUtil.getAllAsArray.mockResolvedValue(Object.values(mockPlanRecord));

            const result = await PlanToWatchUtil.getAllAsArray();

            expect(mockRecordStorageUtil.getAllAsArray).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH);
            expect(result).toEqual(Object.values(mockPlanRecord));
        });
    });

    describe("getByAnimeId", () => {
        it("should return plan for specific anime", async () => {
            mockRecordStorageUtil.getById.mockResolvedValue(mockPlan);

            const result = await PlanToWatchUtil.getByAnimeId("123");

            expect(mockRecordStorageUtil.getById).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH, "123");
            expect(result).toEqual(mockPlan);
        });

        it("should return null if plan not found", async () => {
            mockRecordStorageUtil.getById.mockResolvedValue(null);

            const result = await PlanToWatchUtil.getByAnimeId("999");

            expect(result).toBeNull();
        });
    });

    describe("add", () => {
        it("should add plan to watch", async () => {
            mockRecordStorageUtil.save.mockResolvedValue(undefined);

            await PlanToWatchUtil.add(mockPlan);

            expect(mockRecordStorageUtil.save).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH, "123", mockPlan);
        });
    });

    describe("remove", () => {
        it("should remove plan by anime ID", async () => {
            mockRecordStorageUtil.delete.mockResolvedValue(undefined);

            await PlanToWatchUtil.remove("123");

            expect(mockRecordStorageUtil.delete).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH, "123");
        });
    });

    describe("isPlanned", () => {
        it("should return true if anime is planned", async () => {
            mockRecordStorageUtil.exists.mockResolvedValue(true);

            const result = await PlanToWatchUtil.isPlanned("123");

            expect(mockRecordStorageUtil.exists).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH, "123");
            expect(result).toBe(true);
        });

        it("should return false if anime is not planned", async () => {
            mockRecordStorageUtil.exists.mockResolvedValue(false);

            const result = await PlanToWatchUtil.isPlanned("999");

            expect(result).toBe(false);
        });
    });

    describe("clear", () => {
        it("should clear all plans", async () => {
            mockRecordStorageUtil.clear.mockResolvedValue(undefined);

            await PlanToWatchUtil.clear();

            expect(mockRecordStorageUtil.clear).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH);
        });
    });

    describe("getRecentlyAdded", () => {
        it("should return recently added plans sorted by addedAt", async () => {
            const planList = [
                { ...mockPlan, addedAt: "2025-07-09T10:00:00.000Z" },
                { ...mockPlan, animeId: "456", addedAt: "2025-07-10T10:00:00.000Z" },
                { ...mockPlan, animeId: "789", addedAt: "2025-07-08T10:00:00.000Z" },
            ];

            mockRecordStorageUtil.getAllAsArray.mockResolvedValue(planList);

            const result = await PlanToWatchUtil.getRecentlyAdded(2);

            expect(result).toHaveLength(2);
            expect(result[0].animeId).toBe("456"); // Most recent
            expect(result[1].animeId).toBe("123"); // Second most recent
        });

        it("should return all if no limit specified", async () => {
            const planList = [mockPlan];
            mockRecordStorageUtil.getAllAsArray.mockResolvedValue(planList);

            const result = await PlanToWatchUtil.getRecentlyAdded();

            expect(result).toEqual(planList);
        });
    });

    describe("getByDateRange", () => {
        it("should return plans within date range", async () => {
            const planList = [
                { ...mockPlan, addedAt: "2025-07-05T10:00:00.000Z" },
                { ...mockPlan, animeId: "456", addedAt: "2025-07-10T10:00:00.000Z" },
                { ...mockPlan, animeId: "789", addedAt: "2025-07-15T10:00:00.000Z" },
            ];

            mockRecordStorageUtil.getAllAsArray.mockResolvedValue(planList);

            const startDate = new Date("2025-07-08");
            const endDate = new Date("2025-07-12");
            const result = await PlanToWatchUtil.getByDateRange(startDate, endDate);

            expect(result).toHaveLength(1);
            expect(result[0].animeId).toBe("456");
        });
    });

    describe("searchByTitle", () => {
        it("should search plans by title case-insensitive", async () => {
            const planList = [
                { ...mockPlan, animeTitle: "Attack on Titan" },
                { ...mockPlan, animeId: "456", animeTitle: "My Hero Academia" },
                { ...mockPlan, animeId: "789", animeTitle: "One Piece" },
            ];

            mockRecordStorageUtil.getAllAsArray.mockResolvedValue(planList);

            const result = await PlanToWatchUtil.searchByTitle("attack");

            expect(result).toHaveLength(1);
            expect(result[0].animeTitle).toBe("Attack on Titan");
        });

        it("should return empty array if no matches", async () => {
            const planList = [mockPlan];
            mockRecordStorageUtil.getAllAsArray.mockResolvedValue(planList);

            const result = await PlanToWatchUtil.searchByTitle("nonexistent");

            expect(result).toHaveLength(0);
        });
    });
});
