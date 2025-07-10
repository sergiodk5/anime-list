import type { EpisodeProgress } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { EpisodeProgressUtil } from "@/commons/utils/episodeProgressUtil";
import { RecordStorageUtil } from "@/commons/utils/storageUtil";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the storage utility
vi.mock("@/commons/utils/storageUtil");
const mockRecordStorageUtil = vi.mocked(RecordStorageUtil);

describe("EpisodeProgressUtil", () => {
    const mockProgress: EpisodeProgress = {
        animeId: "123",
        animeTitle: "Test Anime",
        animeSlug: "test-anime-123",
        currentEpisode: 5,
        episodeId: "ep-5",
        lastWatched: "2025-07-10T12:00:00.000Z",
        totalEpisodes: 12,
    };

    const mockProgressRecord = {
        "123": mockProgress,
        "456": { ...mockProgress, animeId: "456", animeTitle: "Another Anime" },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getAll", () => {
        it("should return all episode progress records", async () => {
            mockRecordStorageUtil.getAll.mockResolvedValue(mockProgressRecord);

            const result = await EpisodeProgressUtil.getAll();

            expect(mockRecordStorageUtil.getAll).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS);
            expect(result).toEqual(mockProgressRecord);
        });
    });

    describe("getAllAsArray", () => {
        it("should return all episode progress as array", async () => {
            mockRecordStorageUtil.getAllAsArray.mockResolvedValue(Object.values(mockProgressRecord));

            const result = await EpisodeProgressUtil.getAllAsArray();

            expect(mockRecordStorageUtil.getAllAsArray).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS);
            expect(result).toEqual(Object.values(mockProgressRecord));
        });
    });

    describe("getByAnimeId", () => {
        it("should return progress for specific anime", async () => {
            mockRecordStorageUtil.getById.mockResolvedValue(mockProgress);

            const result = await EpisodeProgressUtil.getByAnimeId("123");

            expect(mockRecordStorageUtil.getById).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, "123");
            expect(result).toEqual(mockProgress);
        });

        it("should return null if anime not found", async () => {
            mockRecordStorageUtil.getById.mockResolvedValue(null);

            const result = await EpisodeProgressUtil.getByAnimeId("999");

            expect(result).toBeNull();
        });
    });

    describe("save", () => {
        it("should save episode progress", async () => {
            mockRecordStorageUtil.save.mockResolvedValue(undefined);

            await EpisodeProgressUtil.save(mockProgress);

            expect(mockRecordStorageUtil.save).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, "123", mockProgress);
        });
    });

    describe("remove", () => {
        it("should remove episode progress by anime ID", async () => {
            mockRecordStorageUtil.delete.mockResolvedValue(undefined);

            await EpisodeProgressUtil.remove("123");

            expect(mockRecordStorageUtil.delete).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, "123");
        });
    });

    describe("isTracked", () => {
        it("should return true if anime is tracked", async () => {
            mockRecordStorageUtil.exists.mockResolvedValue(true);

            const result = await EpisodeProgressUtil.isTracked("123");

            expect(mockRecordStorageUtil.exists).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, "123");
            expect(result).toBe(true);
        });

        it("should return false if anime is not tracked", async () => {
            mockRecordStorageUtil.exists.mockResolvedValue(false);

            const result = await EpisodeProgressUtil.isTracked("999");

            expect(result).toBe(false);
        });
    });

    describe("updateEpisode", () => {
        it("should update episode number for existing progress", async () => {
            const existingProgress = { ...mockProgress, currentEpisode: 3 };
            mockRecordStorageUtil.getById.mockResolvedValue(existingProgress);
            mockRecordStorageUtil.save.mockResolvedValue(undefined);

            await EpisodeProgressUtil.updateEpisode("123", 7);

            expect(mockRecordStorageUtil.getById).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, "123");
            expect(mockRecordStorageUtil.save).toHaveBeenCalledWith(
                StorageKeys.EPISODE_PROGRESS,
                "123",
                expect.objectContaining({
                    ...existingProgress,
                    currentEpisode: 7,
                    lastWatched: expect.any(String),
                }),
            );
        });

        it("should not update if progress does not exist", async () => {
            mockRecordStorageUtil.getById.mockResolvedValue(null);

            await EpisodeProgressUtil.updateEpisode("999", 7);

            expect(mockRecordStorageUtil.save).not.toHaveBeenCalled();
        });
    });

    describe("clear", () => {
        it("should clear all episode progress", async () => {
            mockRecordStorageUtil.clear.mockResolvedValue(undefined);

            await EpisodeProgressUtil.clear();

            expect(mockRecordStorageUtil.clear).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS);
        });
    });

    describe("getRecentlyWatched", () => {
        it("should return recently watched anime sorted by lastWatched", async () => {
            const progressList = [
                { ...mockProgress, lastWatched: "2025-07-09T12:00:00.000Z" },
                { ...mockProgress, animeId: "456", lastWatched: "2025-07-10T12:00:00.000Z" },
                { ...mockProgress, animeId: "789", lastWatched: "2025-07-08T12:00:00.000Z" },
            ];

            mockRecordStorageUtil.getAllAsArray.mockResolvedValue(progressList);

            const result = await EpisodeProgressUtil.getRecentlyWatched(2);

            expect(result).toHaveLength(2);
            expect(result[0].animeId).toBe("456"); // Most recent
            expect(result[1].animeId).toBe("123"); // Second most recent
        });

        it("should return all if no limit specified", async () => {
            const progressList = [mockProgress];
            mockRecordStorageUtil.getAllAsArray.mockResolvedValue(progressList);

            const result = await EpisodeProgressUtil.getRecentlyWatched();

            expect(result).toEqual(progressList);
        });
    });

    describe("getByEpisodeRange", () => {
        it("should return anime within episode range", async () => {
            const progressList = [
                { ...mockProgress, currentEpisode: 3 },
                { ...mockProgress, animeId: "456", currentEpisode: 8 },
                { ...mockProgress, animeId: "789", currentEpisode: 15 },
            ];

            mockRecordStorageUtil.getAllAsArray.mockResolvedValue(progressList);

            const result = await EpisodeProgressUtil.getByEpisodeRange(5, 10);

            expect(result).toHaveLength(1);
            expect(result[0].animeId).toBe("456");
        });
    });
});
