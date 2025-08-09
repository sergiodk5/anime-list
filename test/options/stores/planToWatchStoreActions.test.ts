import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AnimeData } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import { usePlanToWatchStore } from "@/options/stores/planToWatchStore";
vi.mock("vue-toastification", () => ({
    useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

// Mock the AnimeService
vi.mock("@/commons/services/AnimeService");

describe("usePlanToWatchStore - Actions", () => {
    let store: ReturnType<typeof usePlanToWatchStore>;
    let mockGetAllAnime: any;
    let mockAddToPlanToWatch: any;
    let mockRemoveFromPlanToWatch: any;

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

        mockAddToPlanToWatch = vi.fn().mockResolvedValue({
            success: true,
            message: "Added to plan",
        });

        mockRemoveFromPlanToWatch = vi.fn().mockResolvedValue({
            success: true,
            message: "Removed from plan",
        });

        // Mock the AnimeService constructor
        vi.mocked(AnimeService).mockImplementation(
            () =>
                ({
                    getAllAnime: mockGetAllAnime,
                    addToPlanToWatch: mockAddToPlanToWatch,
                    removeFromPlanToWatch: mockRemoveFromPlanToWatch,
                }) as any,
        );

        // Create store instance
        store = usePlanToWatchStore();
    });

    describe("addToPlan", () => {
        it("should successfully add anime to plan", async () => {
            const result = await store.addToPlan(sampleAnime);

            expect(result.success).toBe(true);
            expect(mockAddToPlanToWatch).toHaveBeenCalledWith(sampleAnime);
            expect(store.count).toBe(1);
            expect(store.items[0].animeTitle).toBe("Attack on Titan");
        });

        it("should handle service failure gracefully", async () => {
            mockAddToPlanToWatch.mockResolvedValueOnce({
                success: false,
                message: "Anime already planned",
            });

            const result = await store.addToPlan(sampleAnime);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Anime already planned");
            expect(store.count).toBe(0);
            expect(store.lastError).toBe("Anime already planned");
        });
    });

    describe("removeFromPlan", () => {
        beforeEach(async () => {
            // Setup plan to watch store with initial data
            mockGetAllAnime.mockResolvedValue({
                currentlyWatching: [],
                planToWatch: [
                    {
                        animeId: "anime-1",
                        animeTitle: "Attack on Titan",
                        animeSlug: "attack-on-titan",
                        addedAt: "2024-01-01T00:00:00.000Z",
                    },
                ],
                hiddenAnime: [],
                totalCount: 1,
            });

            await store.init();
        });

        it("should successfully remove anime from plan", async () => {
            expect(store.count).toBe(1); // Before removal

            const result = await store.removeFromPlan("anime-1");

            expect(result.success).toBe(true);
            expect(mockRemoveFromPlanToWatch).toHaveBeenCalledWith("anime-1");
            expect(store.count).toBe(0);
        });

        it("should handle non-existent anime", async () => {
            const result = await store.removeFromPlan("non-existent");

            expect(result.success).toBe(false);
            expect(result.error).toBe("Anime not found in plan to watch list");
            expect(store.count).toBe(1); // Should remain unchanged
            expect(store.lastError).toBe("Anime not found in plan to watch list");
        });
    });
});
