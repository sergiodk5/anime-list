import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AnimeData } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import { useHiddenStore } from "@/options/stores/hiddenStore";
vi.mock("vue-toastification", () => ({
    useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

// Mock the AnimeService
vi.mock("@/commons/services/AnimeService");

describe("useHiddenStore - Actions", () => {
    let store: ReturnType<typeof useHiddenStore>;
    let mockGetAllAnime: any;
    let mockHideAnime: any;
    let mockUnhideAnime: any;
    let mockClearAllHidden: any;

    const sampleAnime: AnimeData = {
        animeId: "anime-1",
        animeTitle: "Attack on Titan",
        animeSlug: "attack-on-titan",
    };

    beforeEach(() => {
        // Create a fresh Pinia instance for each test
        const pinia = createPinia();
        setActivePinia(pinia);

        // Reset mocks
        vi.clearAllMocks();

        // Setup default mocks
        mockGetAllAnime = vi.fn().mockResolvedValue({
            currentlyWatching: [],
            planToWatch: [],
            hiddenAnime: [],
            totalCount: 0,
        });

        mockHideAnime = vi.fn().mockResolvedValue({
            success: true,
            message: "Hidden anime",
        });

        mockUnhideAnime = vi.fn().mockResolvedValue({
            success: true,
            message: "Unhidden anime",
        });

        mockClearAllHidden = vi.fn().mockResolvedValue({
            success: true,
            message: "Cleared all hidden",
        });

        // Mock the AnimeService constructor
        vi.mocked(AnimeService).mockImplementation(
            () =>
                ({
                    getAllAnime: mockGetAllAnime,
                    hideAnime: mockHideAnime,
                    unhideAnime: mockUnhideAnime,
                    clearAllHidden: mockClearAllHidden,
                }) as any,
        );

        // Create store instance
        store = useHiddenStore();
    });

    describe("hide", () => {
        it("should successfully hide an anime", async () => {
            const result = await store.hide(sampleAnime);

            expect(result.success).toBe(true);
            expect(mockHideAnime).toHaveBeenCalledWith("anime-1");
            expect(store.count).toBe(1);
            expect(store.isHidden("anime-1")).toBe(true);
        });

        it("should handle service failure gracefully", async () => {
            mockHideAnime.mockResolvedValueOnce({
                success: false,
                message: "Cannot hide anime",
            });

            const result = await store.hide(sampleAnime);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Cannot hide anime");
            expect(store.count).toBe(0);
            expect(store.isHidden("anime-1")).toBe(false);
        });
    });

    describe("unhide", () => {
        beforeEach(async () => {
            // Setup hidden store with initial data
            mockGetAllAnime.mockResolvedValue({
                currentlyWatching: [],
                planToWatch: [],
                hiddenAnime: ["anime-1"], // Hidden anime are stored as array of IDs
                totalCount: 1,
            });

            await store.init();
        });

        it("should successfully unhide an anime", async () => {
            expect(store.count).toBe(1); // Before unhiding
            expect(store.isHidden("anime-1")).toBe(true);

            const result = await store.unhide("anime-1");

            expect(result.success).toBe(true);
            expect(mockUnhideAnime).toHaveBeenCalledWith("anime-1");
            expect(store.count).toBe(0);
            expect(store.isHidden("anime-1")).toBe(false);
        });
    });

    describe("clearAllHidden", () => {
        beforeEach(async () => {
            // Setup hidden store with initial data
            mockGetAllAnime.mockResolvedValue({
                currentlyWatching: [],
                planToWatch: [],
                hiddenAnime: ["anime-1", "anime-2"], // Hidden anime are stored as array of IDs
                totalCount: 2,
            });

            await store.init();
        });

        it("should successfully clear all hidden anime", async () => {
            expect(store.count).toBe(2); // Before clearing

            const result = await store.clearAllHidden();

            expect(result.success).toBe(true);
            expect(mockClearAllHidden).toHaveBeenCalled();
            expect(store.count).toBe(0);
        });
    });
});
