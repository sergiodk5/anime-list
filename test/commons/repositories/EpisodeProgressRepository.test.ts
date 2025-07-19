import { StorageAdapter } from "@/commons/adapters/StorageAdapter";
import type { EpisodeProgress } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { EpisodeProgressRepository } from "@/commons/repositories/EpisodeProgressRepository";
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

describe("EpisodeProgressRepository", () => {
    let repository: EpisodeProgressRepository;
    let mockProgress: EpisodeProgress;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers(); // Clean up any time mocking from previous tests
        repository = new EpisodeProgressRepository();
        mockProgress = {
            animeId: "123",
            animeTitle: "Test Anime",
            animeSlug: "test-anime",
            currentEpisode: 5,
            episodeId: "ep-5",
            lastWatched: "2025-07-19T10:00:00.000Z",
            totalEpisodes: 24,
        };
    });

    describe("create", () => {
        it("should create a new episode progress record", async () => {
            const existingProgress = { "456": { ...mockProgress, animeId: "456" } };
            mockStorageAdapter.get.mockResolvedValue(existingProgress);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.create(mockProgress);

            expect(mockStorageAdapter.get).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS);
            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, {
                "456": { ...mockProgress, animeId: "456" },
                "123": mockProgress,
            });
        });

        it("should handle empty storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.create(mockProgress);

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, { "123": mockProgress });
        });
    });

    describe("findById", () => {
        it("should find episode progress by anime ID", async () => {
            const progressData = { "123": mockProgress };
            mockStorageAdapter.get.mockResolvedValue(progressData);

            const result = await repository.findById("123");

            expect(result).toEqual(mockProgress);
            expect(mockStorageAdapter.get).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS);
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
        it("should return all episode progress records", async () => {
            const progressData = {
                "123": mockProgress,
                "456": { ...mockProgress, animeId: "456", animeTitle: "Another Anime" },
            };
            mockStorageAdapter.get.mockResolvedValue(progressData);

            const result = await repository.findAll();

            expect(result).toHaveLength(2);
            expect(result).toEqual(Object.values(progressData));
        });

        it("should return empty array for empty storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);

            const result = await repository.findAll();

            expect(result).toEqual([]);
        });
    });

    describe("update", () => {
        it("should update existing episode progress", async () => {
            const progressData = { "123": mockProgress };
            mockStorageAdapter.get.mockResolvedValue(progressData);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            const updateData = { currentEpisode: 6, lastWatched: "2025-07-19T11:00:00.000Z" };
            await repository.update("123", updateData);

            const expectedUpdated = { ...mockProgress, ...updateData };
            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, {
                "123": expectedUpdated,
            });
        });

        it("should not update non-existent anime", async () => {
            mockStorageAdapter.get.mockResolvedValue({});

            await repository.update("999", { currentEpisode: 10 });

            expect(mockStorageAdapter.set).not.toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("should delete episode progress by anime ID", async () => {
            const progressData = { "123": mockProgress, "456": { ...mockProgress, animeId: "456" } };
            mockStorageAdapter.get.mockResolvedValue(progressData);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.delete("123");

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, {
                "456": { ...mockProgress, animeId: "456" },
            });
        });
    });

    describe("exists", () => {
        it("should return true for existing anime", async () => {
            const progressData = { "123": mockProgress };
            mockStorageAdapter.get.mockResolvedValue(progressData);

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
        it("should clear all episode progress", async () => {
            mockStorageAdapter.remove.mockResolvedValue(undefined);

            await repository.clear();

            expect(mockStorageAdapter.remove).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS);
        });
    });

    describe("count", () => {
        it("should return count of tracked anime", async () => {
            const progressData = { "123": mockProgress, "456": { ...mockProgress, animeId: "456" } };
            mockStorageAdapter.get.mockResolvedValue(progressData);

            const result = await repository.count();

            expect(result).toBe(2);
        });

        it("should return 0 for empty storage", async () => {
            mockStorageAdapter.get.mockResolvedValue(null);

            const result = await repository.count();

            expect(result).toBe(0);
        });
    });

    describe("updateEpisode", () => {
        it("should update episode number for tracked anime", async () => {
            const progressData = { "123": mockProgress };
            mockStorageAdapter.get.mockResolvedValue(progressData);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            // Mock Date.now for consistent timestamp
            const mockDate = new Date("2025-07-19T12:00:00.000Z");
            vi.setSystemTime(mockDate);

            await repository.updateEpisode("123", 7);

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, {
                "123": {
                    ...mockProgress,
                    currentEpisode: 7,
                    lastWatched: mockDate.toISOString(),
                },
            });

            vi.restoreAllMocks();
        });

        it("should not update episode for non-existent anime", async () => {
            mockStorageAdapter.get.mockResolvedValue({});

            await repository.updateEpisode("999", 10);

            expect(mockStorageAdapter.set).not.toHaveBeenCalled();
        });
    });

    describe("getRecentlyWatched", () => {
        it("should return recently watched anime sorted by lastWatched", async () => {
            const progress1 = { ...mockProgress, animeId: "1", lastWatched: "2025-07-19T10:00:00.000Z" };
            const progress2 = { ...mockProgress, animeId: "2", lastWatched: "2025-07-19T12:00:00.000Z" };
            const progress3 = { ...mockProgress, animeId: "3", lastWatched: "2025-07-19T11:00:00.000Z" };

            const progressData = { "1": progress1, "2": progress2, "3": progress3 };
            mockStorageAdapter.get.mockResolvedValue(progressData);

            const result = await repository.getRecentlyWatched(2);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(progress2); // Most recent
            expect(result[1]).toEqual(progress3); // Second most recent
        });

        it("should default to limit of 5", async () => {
            const progressData = Array.from({ length: 10 }, (_, i) => ({
                ...mockProgress,
                animeId: i.toString(),
                lastWatched: new Date(2025, 6, 19, 10, i).toISOString(),
            })).reduce(
                (acc, progress) => {
                    acc[progress.animeId] = progress;
                    return acc;
                },
                {} as Record<string, EpisodeProgress>,
            );

            mockStorageAdapter.get.mockResolvedValue(progressData);

            const result = await repository.getRecentlyWatched();

            expect(result).toHaveLength(5);
        });
    });

    describe("compatibility methods", () => {
        it("should support save method as alias for create", async () => {
            mockStorageAdapter.get.mockResolvedValue({});
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.save(mockProgress);

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, { "123": mockProgress });
        });

        it("should support getAll method", async () => {
            const progressData = { "123": mockProgress };
            mockStorageAdapter.get.mockResolvedValue(progressData);

            const result = await repository.getAll();

            expect(result).toEqual(progressData);
        });

        it("should support getAllAsArrayCompat method", async () => {
            const progressData = { "123": mockProgress };
            mockStorageAdapter.get.mockResolvedValue(progressData);

            const result = await repository.getAllAsArrayCompat();

            expect(result).toEqual([mockProgress]);
        });

        it("should support isTracked method", async () => {
            const progressData = { "123": mockProgress };
            mockStorageAdapter.get.mockResolvedValue(progressData);

            const result = await repository.isTracked("123");

            expect(result).toBe(true);
        });

        it("should support remove method", async () => {
            const progressData = { "123": mockProgress };
            mockStorageAdapter.get.mockResolvedValue(progressData);
            mockStorageAdapter.set.mockResolvedValue(undefined);

            await repository.remove("123");

            expect(mockStorageAdapter.set).toHaveBeenCalledWith(StorageKeys.EPISODE_PROGRESS, {});
        });

        it("should support getByAnimeId method", async () => {
            const progressData = { "123": mockProgress };
            mockStorageAdapter.get.mockResolvedValue(progressData);

            const result = await repository.getByAnimeId("123");

            expect(result).toEqual(mockProgress);
        });
    });
});
