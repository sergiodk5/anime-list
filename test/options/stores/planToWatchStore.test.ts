import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanToWatch } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import { usePlanToWatchStore } from "@/options/stores/planToWatchStore";

// Mock the AnimeService
vi.mock("@/commons/services/AnimeService");

describe("usePlanToWatchStore", () => {
    const samplePlanToWatchAnime: PlanToWatch[] = [
        {
            animeId: "anime-1",
            animeTitle: "One Piece",
            animeSlug: "one-piece",
            addedAt: "2025-01-01T00:00:00.000Z",
        },
        {
            animeId: "anime-2",
            animeTitle: "Naruto",
            animeSlug: "naruto",
            addedAt: "2025-01-02T00:00:00.000Z",
        },
    ];

    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();

        // Mock the AnimeService constructor and methods
        const mockGetAllAnime = vi.fn().mockResolvedValue({
            currentlyWatching: [],
            planToWatch: samplePlanToWatchAnime,
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
            const store = usePlanToWatchStore();

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
            const store = usePlanToWatchStore();

            await store.init();

            expect(store.items).toEqual(samplePlanToWatchAnime);
            expect(store.itemsMap).toEqual({
                "anime-1": samplePlanToWatchAnime[0],
                "anime-2": samplePlanToWatchAnime[1],
            });
            expect(store.count).toBe(2);
            expect(store.isInitialized).toBe(true);
            expect(store.isLoading).toBe(false);
            expect(store.hasError).toBe(false);
        });

        it("should be idempotent - multiple calls should not re-fetch", async () => {
            const store = usePlanToWatchStore();

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

            const mockGetAllAnime = vi.fn().mockRejectedValue(new Error(errorMessage));
            vi.mocked(AnimeService).mockImplementation(
                () =>
                    ({
                        getAllAnime: mockGetAllAnime,
                    }) as any,
            );

            const store = usePlanToWatchStore();
            await store.init();

            expect(store.items).toEqual([]);
            expect(store.itemsMap).toEqual({});
            expect(store.count).toBe(0);
            expect(store.hasError).toBe(true);
            expect(store.error).toBe(errorMessage);
            expect(store.isLoading).toBe(false);
            expect(store.isInitialized).toBe(false);
        });
    });

    describe("getters", () => {
        beforeEach(async () => {
            const store = usePlanToWatchStore();
            await store.init();
        });

        it("should return correct count", () => {
            const store = usePlanToWatchStore();
            expect(store.count).toBe(2);
        });

        it("should return items sorted by title", () => {
            const store = usePlanToWatchStore();
            const sorted = store.sortedByTitle;

            expect(sorted[0].animeTitle).toBe("Naruto");
            expect(sorted[1].animeTitle).toBe("One Piece");
        });

        it("should return items sorted by date added (newest first)", () => {
            const store = usePlanToWatchStore();
            const sorted = store.sortedByDateAdded;

            // Should be newest first (2025-01-02 before 2025-01-01)
            expect(sorted[0].animeTitle).toBe("Naruto");
            expect(sorted[1].animeTitle).toBe("One Piece");
        });

        it("should return anime by ID", () => {
            const store = usePlanToWatchStore();
            const byId = store.byId;

            expect(byId("anime-1")).toEqual(samplePlanToWatchAnime[0]);
            expect(byId("anime-2")).toEqual(samplePlanToWatchAnime[1]);
            expect(byId("non-existent")).toBeUndefined();
        });
    });

    describe("date sorting", () => {
        it("should sort by date correctly with different dates", async () => {
            const dateTestData = [
                {
                    animeId: "anime-old",
                    animeTitle: "Old Anime",
                    animeSlug: "old-anime",
                    addedAt: "2024-12-01T00:00:00.000Z",
                },
                {
                    animeId: "anime-newest",
                    animeTitle: "Newest Anime",
                    animeSlug: "newest-anime",
                    addedAt: "2025-01-15T00:00:00.000Z",
                },
                {
                    animeId: "anime-middle",
                    animeTitle: "Middle Anime",
                    animeSlug: "middle-anime",
                    addedAt: "2025-01-10T00:00:00.000Z",
                },
            ];

            const mockGetAllAnime = vi.fn().mockResolvedValue({
                currentlyWatching: [],
                planToWatch: dateTestData,
                hiddenAnime: [],
                totalCount: 3,
            });

            vi.mocked(AnimeService).mockImplementation(
                () =>
                    ({
                        getAllAnime: mockGetAllAnime,
                    }) as any,
            );

            const store = usePlanToWatchStore();
            await store.init();

            const sorted = store.sortedByDateAdded;
            expect(sorted[0].animeTitle).toBe("Newest Anime");
            expect(sorted[1].animeTitle).toBe("Middle Anime");
            expect(sorted[2].animeTitle).toBe("Old Anime");
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

            const store = usePlanToWatchStore();
            const initPromise = store.init();

            // Check loading state while pending
            expect(store.isLoading).toBe(true);

            // Resolve the promise
            resolvePromise!({
                currentlyWatching: [],
                planToWatch: samplePlanToWatchAnime,
                hiddenAnime: [],
                totalCount: 2,
            });

            await initPromise;

            expect(store.isLoading).toBe(false);
            expect(store.isInitialized).toBe(true);
        });
    });
});
