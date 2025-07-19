import { StorageAdapter } from "@/commons/adapters/StorageAdapter";
import type { PlanToWatch } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { PlanToWatchRepository } from "@/commons/repositories/PlanToWatchRepository";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the StorageAdapter
vi.mock("@/commons/adapters/StorageAdapter", () => ({
    StorageAdapter: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
    },
}));

type MockStorageAdapter = {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
};

const mockStorageAdapter = StorageAdapter as unknown as MockStorageAdapter;

describe("PlanToWatchRepository", () => {
    let repository: PlanToWatchRepository;
    let mockPlan: PlanToWatch;

    beforeEach(() => {
        vi.clearAllMocks();
        repository = new PlanToWatchRepository();
        mockPlan = {
            animeId: "123",
            animeTitle: "Test Anime",
            animeSlug: "test-anime",
            addedAt: "2025-07-19T10:00:00.000Z",
        };
    });

    describe("create", () => {
        it("should create a new plan to watch record", async () => {
            const existingPlans = { "456": { ...mockPlan, animeId: "456" } };
            mockStorageAdapter.get.mockResolvedValue(existingPlans);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.create(mockPlan);

            expect(mockStorageAdapter.get).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH);
            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH, {
                "456": { ...mockPlan, animeId: "456" },
                "123": mockPlan,
            });
        });

        it("should handle empty storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.create(mockPlan);

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH, { "123": mockPlan });
        });
    });

    describe("findById", () => {
        it("should find plan to watch by anime ID", async () => {
            const planData = { "123": mockPlan };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.findById("123");

            expect(result).toEqual(mockPlan);
        });

        it("should return null for non-existent anime", async () => {
            mockStorageAdapter.get.mockResolvedValue({});

            const result = await repository.findById("999");

            expect(result).toBeNull();
        });

        it("should handle null storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);

            const result = await repository.findById("123");

            expect(result).toBeNull();
        });
    });

    describe("findAll", () => {
        it("should return all plan to watch records", async () => {
            const planData = {
                "123": mockPlan,
                "456": { ...mockPlan, animeId: "456", animeTitle: "Another Anime" },
            };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.findAll();

            expect(result).toHaveLength(2);
            expect(result).toEqual(Object.values(planData));
        });

        it("should return empty array for empty storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);

            const result = await repository.findAll();

            expect(result).toEqual([]);
        });
    });

    describe("update", () => {
        it("should update existing plan to watch", async () => {
            const planData = { "123": mockPlan };
            mockStorageAdapter.get.mockResolvedValue(planData);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            const updateData = { addedAt: "2025-07-19T11:00:00.000Z" };
            await repository.update("123", updateData);

            const expectedUpdated = { ...mockPlan, ...updateData };
            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH, { "123": expectedUpdated });
        });

        it("should not update non-existent anime", async () => {
            mockStorageAdapter.get.mockResolvedValue({});

            await repository.update("999", { addedAt: "2025-07-19T11:00:00.000Z" });

            expect(mockStorageAdapter.set).not.toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("should delete plan to watch by anime ID", async () => {
            const planData = { "123": mockPlan, "456": { ...mockPlan, animeId: "456" } };
            mockStorageAdapter.get.mockResolvedValue(planData);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.delete("123");

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH, {
                "456": { ...mockPlan, animeId: "456" },
            });
        });
    });

    describe("exists", () => {
        it("should return true for existing anime", async () => {
            const planData = { "123": mockPlan };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.exists("123");

            expect(result).toBe(true);
        });

        it("should return false for non-existent anime", async () => {
            mockStorageAdapter.get.mockResolvedValue({});

            const result = await repository.exists("999");

            expect(result).toBe(false);
        });
    });

    describe("clear", () => {
        it("should clear all plan to watch records", async () => {
            mockStorageAdapter.remove.mockResolvedValue(undefined);

            await repository.clear();

            expect(mockStorageAdapter.remove).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH);
        });
    });

    describe("count", () => {
        it("should return count of planned anime", async () => {
            const planData = { "123": mockPlan, "456": { ...mockPlan, animeId: "456" } };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.count();

            expect(result).toBe(2);
        });

        it("should return 0 for empty storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);

            const result = await repository.count();

            expect(result).toBe(0);
        });
    });

    describe("add", () => {
        it("should add anime to plan to watch", async () => {
            mockStorageAdapter.get.mockResolvedValue({});
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.add(mockPlan);

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH, { "123": mockPlan });
        });
    });

    describe("getRecentlyAdded", () => {
        it("should return recently added planned anime sorted by addedAt", async () => {
            const plan1 = { ...mockPlan, animeId: "1", addedAt: "2025-07-19T10:00:00.000Z" };
            const plan2 = { ...mockPlan, animeId: "2", addedAt: "2025-07-19T12:00:00.000Z" };
            const plan3 = { ...mockPlan, animeId: "3", addedAt: "2025-07-19T11:00:00.000Z" };

            const planData = { "1": plan1, "2": plan2, "3": plan3 };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.getRecentlyAdded(2);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(plan2); // Most recent
            expect(result[1]).toEqual(plan3); // Second most recent
        });

        it("should default to limit of 5", async () => {
            const planData = Array.from({ length: 10 }, (_, i) => ({
                ...mockPlan,
                animeId: i.toString(),
                addedAt: new Date(2025, 6, 19, 10, i).toISOString(),
            })).reduce(
                (acc, plan) => {
                    acc[plan.animeId] = plan;
                    return acc;
                },
                {} as Record<string, PlanToWatch>,
            );

            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.getRecentlyAdded();

            expect(result).toHaveLength(5);
        });
    });

    describe("searchByTitle", () => {
        it("should search planned anime by title", async () => {
            const plan1 = { ...mockPlan, animeId: "1", animeTitle: "Attack on Titan" };
            const plan2 = { ...mockPlan, animeId: "2", animeTitle: "My Hero Academia" };
            const plan3 = { ...mockPlan, animeId: "3", animeTitle: "Attack on Titan Season 2" };

            const planData = { "1": plan1, "2": plan2, "3": plan3 };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.searchByTitle("Attack");

            expect(result).toHaveLength(2);
            expect(result).toContain(plan1);
            expect(result).toContain(plan3);
            expect(result).not.toContain(plan2);
        });

        it("should search case-insensitively", async () => {
            const planData = { "123": { ...mockPlan, animeTitle: "Attack on Titan" } };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.searchByTitle("attack");

            expect(result).toHaveLength(1);
            expect(result[0].animeTitle).toBe("Attack on Titan");
        });
    });

    describe("compatibility methods", () => {
        it("should support isPlanned method", async () => {
            const planData = { "123": mockPlan };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.isPlanned("123");

            expect(result).toBe(true);
        });

        it("should support remove method", async () => {
            const planData = { "123": mockPlan };
            mockStorageAdapter.get.mockResolvedValue(planData);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.remove("123");

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.PLAN_TO_WATCH, {});
        });

        it("should support getByAnimeId method", async () => {
            const planData = { "123": mockPlan };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.getByAnimeId("123");

            expect(result).toEqual(mockPlan);
        });

        it("should support getAll method", async () => {
            const planData = { "123": mockPlan };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.getAll();

            expect(result).toEqual(planData);
        });

        it("should support getAllAsArrayCompat method", async () => {
            const planData = { "123": mockPlan };
            mockStorageAdapter.get.mockResolvedValue(planData);

            const result = await repository.getAllAsArrayCompat();

            expect(result).toEqual([mockPlan]);
        });
    });
});
