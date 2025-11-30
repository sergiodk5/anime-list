// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStorageCache } from "@/options/composables/useStorageCache";

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Helper to import the module after setting up localStorage
const importModule = async () => {
    // Clear the module cache
    vi.resetModules();
    return import("@/options/composables/useStorageCache");
};

describe("useStorageCache", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("serializer error handling", () => {
        it("should handle invalid JSON in stats cache", async () => {
            // Set invalid JSON in localStorage before module loads
            localStorageMock.setItem("anime-list-stats-cache", "invalid-json-{{{");

            const module = await importModule();
            const { cachedStats } = module.useStorageCache();

            // Should fall back to default values
            expect(cachedStats.value.watching).toBe(0);
            expect(cachedStats.value.planned).toBe(0);
        });

        it("should handle invalid JSON in progress cache", async () => {
            localStorageMock.setItem("anime-list-progress-cache", "not-valid-json");

            const module = await importModule();
            const { cachedProgress } = module.useStorageCache();

            // Should fall back to empty object
            expect(Object.keys(cachedProgress.value).length).toBe(0);
        });
    });

    describe("initialization", () => {
        it("should initialize with default values", () => {
            const { cachedStats } = useStorageCache();

            expect(cachedStats.value.watching).toBe(0);
            expect(cachedStats.value.planned).toBe(0);
            expect(cachedStats.value.hidden).toBe(0);
            expect(cachedStats.value.totalEpisodes).toBe(0);
            expect(cachedStats.value.averageProgress).toBe(0);
            expect(cachedStats.value.lastUpdated).toBe(0);
        });

        it("should have hasCache return false when no cache exists", () => {
            const { hasCache } = useStorageCache();
            expect(hasCache.value).toBe(false);
        });

        it("should have isStale return true initially", () => {
            const { isStale } = useStorageCache();
            expect(isStale.value).toBe(true);
        });
    });

    describe("updateStatsCache", () => {
        it("should update cached stats with new values", () => {
            const { cachedStats, updateStatsCache } = useStorageCache();

            updateStatsCache({
                watching: 5,
                planned: 10,
                hidden: 2,
                totalEpisodes: 150,
                averageProgress: 75,
            });

            expect(cachedStats.value.watching).toBe(5);
            expect(cachedStats.value.planned).toBe(10);
            expect(cachedStats.value.hidden).toBe(2);
            expect(cachedStats.value.totalEpisodes).toBe(150);
            expect(cachedStats.value.averageProgress).toBe(75);
        });

        it("should set lastUpdated timestamp", () => {
            vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));
            const { cachedStats, updateStatsCache } = useStorageCache();

            updateStatsCache({
                watching: 1,
                planned: 1,
                hidden: 1,
                totalEpisodes: 10,
                averageProgress: 50,
            });

            expect(cachedStats.value.lastUpdated).toBe(Date.now());
        });

        it("should set hasCache to true after update", () => {
            const { hasCache, updateStatsCache } = useStorageCache();

            updateStatsCache({
                watching: 1,
                planned: 0,
                hidden: 0,
                totalEpisodes: 0,
                averageProgress: 0,
            });

            expect(hasCache.value).toBe(true);
        });
    });

    describe("updateProgressCache", () => {
        it("should update cached progress with episode data", () => {
            const { cachedProgress, updateProgressCache } = useStorageCache();

            updateProgressCache([
                {
                    animeId: "anime-1",
                    animeTitle: "Test Anime 1",
                    animeSlug: "test-anime-1",
                    currentEpisode: 5,
                    episodeId: "ep-5",
                    lastWatched: "2024-01-01T00:00:00Z",
                    totalEpisodes: 12,
                },
                {
                    animeId: "anime-2",
                    animeTitle: "Test Anime 2",
                    animeSlug: "test-anime-2",
                    currentEpisode: 10,
                    episodeId: "ep-10",
                    lastWatched: "2024-01-02T00:00:00Z",
                },
            ]);

            expect(cachedProgress.value["anime-1"]).toEqual({
                currentEpisode: 5,
                totalEpisodes: 12,
                lastWatched: "2024-01-01T00:00:00Z",
            });

            expect(cachedProgress.value["anime-2"]).toEqual({
                currentEpisode: 10,
                totalEpisodes: undefined,
                lastWatched: "2024-01-02T00:00:00Z",
            });
        });

        it("should handle empty progress array", () => {
            const { cachedProgress, updateProgressCache } = useStorageCache();
            updateProgressCache([]);
            expect(Object.keys(cachedProgress.value).length).toBe(0);
        });
    });

    describe("getCachedEpisode", () => {
        it("should return episode number from cache", () => {
            const { getCachedEpisode, updateProgressCache } = useStorageCache();

            updateProgressCache([
                {
                    animeId: "anime-test",
                    animeTitle: "Test",
                    animeSlug: "test",
                    currentEpisode: 7,
                    episodeId: "ep-7",
                    lastWatched: "2024-01-01T00:00:00Z",
                },
            ]);

            expect(getCachedEpisode("anime-test")).toBe(7);
        });

        it("should return 0 for unknown anime", () => {
            const { getCachedEpisode } = useStorageCache();
            expect(getCachedEpisode("unknown-anime")).toBe(0);
        });
    });

    describe("isStale", () => {
        it("should return false for recently updated cache", () => {
            vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));
            const { isStale, updateStatsCache } = useStorageCache();

            updateStatsCache({
                watching: 1,
                planned: 0,
                hidden: 0,
                totalEpisodes: 0,
                averageProgress: 0,
            });

            expect(isStale.value).toBe(false);
        });

        it("should return true for cache older than 5 minutes", () => {
            vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));
            const { isStale, updateStatsCache } = useStorageCache();

            updateStatsCache({
                watching: 1,
                planned: 0,
                hidden: 0,
                totalEpisodes: 0,
                averageProgress: 0,
            });

            // Advance time by 6 minutes
            vi.setSystemTime(new Date(2024, 0, 1, 12, 6, 0));

            expect(isStale.value).toBe(true);
        });
    });

    describe("cacheAge", () => {
        it("should return Infinity when no cache exists", () => {
            const { cacheAge } = useStorageCache();
            expect(cacheAge.value).toBe(Infinity);
        });

        it("should return age in minutes", () => {
            vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));
            const { cacheAge, updateStatsCache } = useStorageCache();

            updateStatsCache({
                watching: 1,
                planned: 0,
                hidden: 0,
                totalEpisodes: 0,
                averageProgress: 0,
            });

            // Advance time by 3 minutes
            vi.setSystemTime(new Date(2024, 0, 1, 12, 3, 0));

            expect(cacheAge.value).toBe(3);
        });
    });

    describe("clearCache", () => {
        it("should reset stats cache to defaults", () => {
            const { cachedStats, updateStatsCache, clearCache } = useStorageCache();

            updateStatsCache({
                watching: 10,
                planned: 5,
                hidden: 3,
                totalEpisodes: 100,
                averageProgress: 80,
            });

            clearCache();

            expect(cachedStats.value.watching).toBe(0);
            expect(cachedStats.value.planned).toBe(0);
            expect(cachedStats.value.hidden).toBe(0);
            expect(cachedStats.value.totalEpisodes).toBe(0);
            expect(cachedStats.value.averageProgress).toBe(0);
            expect(cachedStats.value.lastUpdated).toBe(0);
        });

        it("should reset progress cache to empty", () => {
            const { cachedProgress, updateProgressCache, clearCache } = useStorageCache();

            updateProgressCache([
                {
                    animeId: "anime-1",
                    animeTitle: "Test",
                    animeSlug: "test",
                    currentEpisode: 5,
                    episodeId: "ep-5",
                    lastWatched: "2024-01-01T00:00:00Z",
                },
            ]);

            clearCache();

            expect(Object.keys(cachedProgress.value).length).toBe(0);
        });

        it("should set hasCache back to false", () => {
            const { hasCache, updateStatsCache, clearCache } = useStorageCache();

            updateStatsCache({
                watching: 1,
                planned: 0,
                hidden: 0,
                totalEpisodes: 0,
                averageProgress: 0,
            });

            clearCache();

            expect(hasCache.value).toBe(false);
        });
    });
});
