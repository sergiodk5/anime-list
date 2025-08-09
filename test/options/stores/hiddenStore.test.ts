import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnimeService } from "@/commons/services/AnimeService";
import { useHiddenStore } from "@/options/stores/hiddenStore";

// Mock the AnimeService
vi.mock("@/commons/services/AnimeService");

describe("useHiddenStore", () => {
    const sampleHiddenAnimeIds = ["anime-1", "anime-2"];

    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();

        // Mock the AnimeService constructor and methods
        const mockGetAllAnime = vi.fn().mockResolvedValue({
            currentlyWatching: [],
            planToWatch: [],
            hiddenAnime: sampleHiddenAnimeIds,
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
            const store = useHiddenStore();

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
            const store = useHiddenStore();

            await store.init();

            expect(store.items).toHaveLength(2);
            expect(store.items[0]).toEqual({
                animeId: "anime-1",
                animeTitle: "anime-1",
                animeSlug: "anime-1",
            });
            expect(store.items[1]).toEqual({
                animeId: "anime-2",
                animeTitle: "anime-2",
                animeSlug: "anime-2",
            });
            expect(store.itemsMap).toEqual({
                "anime-1": {
                    animeId: "anime-1",
                    animeTitle: "anime-1",
                    animeSlug: "anime-1",
                },
                "anime-2": {
                    animeId: "anime-2",
                    animeTitle: "anime-2",
                    animeSlug: "anime-2",
                },
            });
            expect(store.count).toBe(2);
            expect(store.isInitialized).toBe(true);
            expect(store.isLoading).toBe(false);
            expect(store.hasError).toBe(false);
        });

        it("should be idempotent - multiple calls should not re-fetch", async () => {
            const store = useHiddenStore();

            await store.init();
            await store.init();
            await store.init();

            // Check that service was called only once
            const AnimeServiceMock = vi.mocked(AnimeService);
            const mockInstance = AnimeServiceMock.mock.results[0].value;
            expect(mockInstance.getAllAnime).toHaveBeenCalledTimes(1);
            expect(store.isInitialized).toBe(true);
        });

        it("should handle empty hidden anime list", async () => {
            const mockGetAllAnime = vi.fn().mockResolvedValue({
                currentlyWatching: [],
                planToWatch: [],
                hiddenAnime: [],
                totalCount: 0,
            });

            vi.mocked(AnimeService).mockImplementation(
                () =>
                    ({
                        getAllAnime: mockGetAllAnime,
                    }) as any,
            );

            const store = useHiddenStore();
            await store.init();

            expect(store.items).toEqual([]);
            expect(store.itemsMap).toEqual({});
            expect(store.count).toBe(0);
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

            const store = useHiddenStore();
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
            const store = useHiddenStore();
            await store.init();
        });

        it("should return correct count", () => {
            const store = useHiddenStore();
            expect(store.count).toBe(2);
        });

        it("should return items sorted by title", () => {
            const store = useHiddenStore();
            const sorted = store.sortedByTitle;

            // Since we use ID as title, they should be sorted by ID
            expect(sorted[0].animeId).toBe("anime-1");
            expect(sorted[1].animeId).toBe("anime-2");
        });

        it("should return anime by ID", () => {
            const store = useHiddenStore();
            const byId = store.byId;

            expect(byId("anime-1")).toEqual({
                animeId: "anime-1",
                animeTitle: "anime-1",
                animeSlug: "anime-1",
            });
            expect(byId("anime-2")).toEqual({
                animeId: "anime-2",
                animeTitle: "anime-2",
                animeSlug: "anime-2",
            });
            expect(byId("non-existent")).toBeUndefined();
        });

        it("should check if anime is hidden", () => {
            const store = useHiddenStore();
            const isHidden = store.isHidden;

            expect(isHidden("anime-1")).toBe(true);
            expect(isHidden("anime-2")).toBe(true);
            expect(isHidden("non-existent")).toBe(false);
        });
    });

    describe("sorting with different IDs", () => {
        it("should sort anime IDs alphabetically", async () => {
            const testHiddenIds = ["z-anime", "a-anime", "m-anime"];

            const mockGetAllAnime = vi.fn().mockResolvedValue({
                currentlyWatching: [],
                planToWatch: [],
                hiddenAnime: testHiddenIds,
                totalCount: 3,
            });

            vi.mocked(AnimeService).mockImplementation(
                () =>
                    ({
                        getAllAnime: mockGetAllAnime,
                    }) as any,
            );

            const store = useHiddenStore();
            await store.init();

            const sorted = store.sortedByTitle;
            expect(sorted[0].animeId).toBe("a-anime");
            expect(sorted[1].animeId).toBe("m-anime");
            expect(sorted[2].animeId).toBe("z-anime");
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

            const store = useHiddenStore();
            const initPromise = store.init();

            // Check loading state while pending
            expect(store.isLoading).toBe(true);

            // Resolve the promise
            resolvePromise!({
                currentlyWatching: [],
                planToWatch: [],
                hiddenAnime: sampleHiddenAnimeIds,
                totalCount: 2,
            });

            await initPromise;

            expect(store.isLoading).toBe(false);
            expect(store.isInitialized).toBe(true);
        });
    });
});
