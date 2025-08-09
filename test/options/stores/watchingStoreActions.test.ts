import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AnimeData } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import { useWatchingStore } from "@/options/stores/watchingStore";
vi.mock("vue-toastification", () => ({
    useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

// Mock the AnimeService
vi.mock("@/commons/services/AnimeService");

describe("useWatchingStore - Actions", () => {
    let store: ReturnType<typeof useWatchingStore>;
    let mockGetAllAnime: any;
    let mockStartWatching: any;
    let mockUpdateEpisodeProgress: any;
    let mockStopWatching: any;

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

        mockStartWatching = vi.fn().mockResolvedValue({
            success: true,
            message: "Started watching",
        });

        mockUpdateEpisodeProgress = vi.fn().mockResolvedValue({
            success: true,
            message: "Updated episode progress",
        });

        mockStopWatching = vi.fn().mockResolvedValue({
            success: true,
            message: "Stopped watching",
        });

        // Mock the AnimeService constructor
        vi.mocked(AnimeService).mockImplementation(
            () =>
                ({
                    getAllAnime: mockGetAllAnime,
                    startWatching: mockStartWatching,
                    updateEpisodeProgress: mockUpdateEpisodeProgress,
                    stopWatching: mockStopWatching,
                }) as any,
        );

        // Create store instance
        store = useWatchingStore();
    });

    describe("startWatching", () => {
        it("should successfully start watching an anime", async () => {
            const result = await store.startWatching(sampleAnime);

            expect(result.success).toBe(true);
            expect(mockStartWatching).toHaveBeenCalledWith(sampleAnime);
            expect(store.count).toBe(1);
            expect(store.items[0].animeTitle).toBe("Attack on Titan");
            expect(store.items[0].currentEpisode).toBe(1);
            expect(store.lastError).toBeNull();
        });

        it("should handle service failure gracefully", async () => {
            mockStartWatching.mockResolvedValueOnce({
                success: false,
                message: "Anime already being watched",
            });

            const result = await store.startWatching(sampleAnime);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Anime already being watched");
            expect(store.count).toBe(0);
            expect(store.lastError).toBe("Anime already being watched");
        });
    });
});
