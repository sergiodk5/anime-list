import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EpisodeProgress } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import { useWatchingStore } from "@/options/stores/watchingStore";

// Mock the AnimeService
vi.mock("@/commons/services/AnimeService");

describe("useWatchingStore", () => {
    const sampleWatchingAnime: EpisodeProgress[] = [
        {
            animeId: "anime-1",
            animeTitle: "Attack on Titan",
            animeSlug: "attack-on-titan",
            currentEpisode: 5,
            episodeId: "ep-5",
            lastWatched: "2025-01-01T00:00:00.000Z",
            totalEpisodes: 25,
        },
        {
            animeId: "anime-2",
            animeTitle: "Demon Slayer",
            animeSlug: "demon-slayer",
            currentEpisode: 12,
            episodeId: "ep-12",
            lastWatched: "2025-01-02T00:00:00.000Z",
            totalEpisodes: 26,
        },
    ];

    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();

        // Mock the AnimeService constructor and methods
        const mockGetAllAnime = vi.fn().mockResolvedValue({
            currentlyWatching: sampleWatchingAnime,
            planToWatch: [],
            hiddenAnime: [],
            totalCount: 2,
        });

        vi.mocked(AnimeService).mockImplementation(
            () =>
                ({
                    getAllAnime: mockGetAllAnime,
                }) as any,
        );
    });

    describe("initial state", () => {
        it("should have correct initial state", () => {
            const store = useWatchingStore();

            expect(store.items).toEqual([]);
            expect(store.itemsMap).toEqual({});
            expect(store.count).toBe(0);
            expect(store.isLoading).toBe(false);
            expect(store.hasError).toBe(false);
            expect(store.isInitialized).toBe(false);
            expect(store.error).toBeNull();
        });
    });

    describe("initialization", () => {
        it("should initialize with anime service data", async () => {
            const store = useWatchingStore();

            await store.init();

            expect(store.items).toEqual(sampleWatchingAnime);
            expect(store.itemsMap).toEqual({
                "anime-1": sampleWatchingAnime[0],
                "anime-2": sampleWatchingAnime[1],
            });
            expect(store.count).toBe(2);
            expect(store.isInitialized).toBe(true);
            expect(store.isLoading).toBe(false);
            expect(store.hasError).toBe(false);
        });

        it("should be idempotent - multiple calls should not re-fetch", async () => {
            const store = useWatchingStore();

            await store.init();
            await store.init();
            await store.init();

            // Check that service was called only once
            const AnimeServiceMock = vi.mocked(AnimeService);
            const mockInstance = AnimeServiceMock.mock.results[0].value;
            expect(mockInstance.getAllAnime).toHaveBeenCalledTimes(1);
            expect(store.isInitialized).toBe(true);
        });

        it("should handle service errors gracefully", async () => {
            const errorMessage = "Service error";

            // Mock AnimeService to throw error
            const mockGetAllAnime = vi.fn().mockRejectedValue(new Error(errorMessage));
            vi.mocked(AnimeService).mockImplementation(
                () =>
                    ({
                        getAllAnime: mockGetAllAnime,
                    }) as any,
            );

            const store = useWatchingStore();
            await store.init();

            expect(store.items).toEqual([]);
            expect(store.itemsMap).toEqual({});
            expect(store.count).toBe(0);
            expect(store.hasError).toBe(true);
            expect(store.error).toBe(errorMessage);
            expect(store.isLoading).toBe(false);
            expect(store.isInitialized).toBe(false);
        });

        it("should handle non-Error objects in catch block", async () => {
            const mockGetAllAnime = vi.fn().mockRejectedValue("String error");
            vi.mocked(AnimeService).mockImplementation(
                () =>
                    ({
                        getAllAnime: mockGetAllAnime,
                    }) as any,
            );

            const store = useWatchingStore();
            await store.init();

            expect(store.error).toBe("String error");
            expect(store.hasError).toBe(true);
        });
    });

    describe("getters", () => {
        beforeEach(async () => {
            const store = useWatchingStore();
            await store.init();
        });

        it("should return correct count", () => {
            const store = useWatchingStore();
            expect(store.count).toBe(2);
        });

        it("should return items sorted by title", () => {
            const store = useWatchingStore();
            const sorted = store.sortedByTitle;

            expect(sorted[0].animeTitle).toBe("Attack on Titan");
            expect(sorted[1].animeTitle).toBe("Demon Slayer");
        });

        it("should return anime by ID", () => {
            const store = useWatchingStore();
            const byId = store.byId;

            expect(byId("anime-1")).toEqual(sampleWatchingAnime[0]);
            expect(byId("anime-2")).toEqual(sampleWatchingAnime[1]);
            expect(byId("non-existent")).toBeUndefined();
        });

        it("should handle case-insensitive sorting", async () => {
            // Create a fresh pinia instance for this test
            const pinia = createPinia();
            setActivePinia(pinia);

            const caseTestData = [
                { ...sampleWatchingAnime[0], animeTitle: "zombie Land Saga" },
                { ...sampleWatchingAnime[1], animeTitle: "Attack on Titan" },
            ];

            const mockGetAllAnime = vi.fn().mockResolvedValue({
                currentlyWatching: caseTestData,
                planToWatch: [],
                hiddenAnime: [],
                totalCount: 2,
            });

            vi.mocked(AnimeService).mockImplementation(
                () =>
                    ({
                        getAllAnime: mockGetAllAnime,
                    }) as any,
            );

            // Use a new store instance for this test
            const newStore = useWatchingStore();
            await newStore.init();

            const sorted = newStore.sortedByTitle;
            expect(sorted).toHaveLength(2);
            expect(sorted[0].animeTitle).toBe("Attack on Titan");
            expect(sorted[1].animeTitle).toBe("zombie Land Saga");
        });
    });

    describe("loading states", () => {
        it("should set loading state during initialization", async () => {
            // Create a promise that we can resolve manually
            let resolvePromise: (value: any) => void;
            const pendingPromise = new Promise((resolve) => {
                resolvePromise = resolve;
            });

            const mockGetAllAnime = vi.fn().mockReturnValue(pendingPromise);
            vi.mocked(AnimeService).mockImplementation(
                () =>
                    ({
                        getAllAnime: mockGetAllAnime,
                    }) as any,
            );

            const store = useWatchingStore();
            const initPromise = store.init();

            // Check loading state while pending
            expect(store.isLoading).toBe(true);

            // Resolve the promise
            resolvePromise!({
                currentlyWatching: sampleWatchingAnime,
                planToWatch: [],
                hiddenAnime: [],
                totalCount: 2,
            });

            await initPromise;

            expect(store.isLoading).toBe(false);
            expect(store.isInitialized).toBe(true);
        });
    });
});
