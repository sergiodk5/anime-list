import { AnimeService } from "@/commons/services/AnimeService";
import { useHiddenStore } from "@/options/stores/hiddenStore";
import { usePlanToWatchStore } from "@/options/stores/planToWatchStore";
import { useWatchingStore } from "@/options/stores/watchingStore";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the AnimeService
vi.mock("@/commons/services/AnimeService");

/**
 * Enhanced StorageSyncPlugin tests - Phase 6
 * Tests the refreshFromStorage functionality integration
 */
describe("Store refreshFromStorage - Enhanced Phase 6", () => {
    let pinia: ReturnType<typeof createPinia>;
    let mockAnimeService: any;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);

        // Mock console.log to avoid test output noise
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});

        // Setup AnimeService mock
        mockAnimeService = {
            getAllAnime: vi.fn().mockResolvedValue({
                currentlyWatching: [],
                planToWatch: [],
                hiddenAnime: [],
            }),
        };

        vi.mocked(AnimeService).mockImplementation(() => mockAnimeService);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("refreshFromStorage methods", () => {
        it("should have refreshFromStorage method on watching store", () => {
            const watchingStore = useWatchingStore();

            expect(typeof watchingStore.refreshFromStorage).toBe("function");
        });

        it("should have refreshFromStorage method on plan to watch store", () => {
            const planStore = usePlanToWatchStore();

            expect(typeof planStore.refreshFromStorage).toBe("function");
        });

        it("should have refreshFromStorage method on hidden store", () => {
            const hiddenStore = useHiddenStore();

            expect(typeof hiddenStore.refreshFromStorage).toBe("function");
        });

        it("should call refreshFromStorage without errors on watching store", async () => {
            const watchingStore = useWatchingStore();

            // Should not throw
            await expect(watchingStore.refreshFromStorage()).resolves.not.toThrow();

            // Should log refresh message
            expect(console.log).toHaveBeenCalledWith("[WatchingStore] Refreshing from storage due to external changes");
        });

        it("should call refreshFromStorage without errors on plan store", async () => {
            const planStore = usePlanToWatchStore();

            // Should not throw
            await expect(planStore.refreshFromStorage()).resolves.not.toThrow();

            // Should log refresh message
            expect(console.log).toHaveBeenCalledWith(
                "[PlanToWatchStore] Refreshing from storage due to external changes",
            );
        });

        it("should call refreshFromStorage without errors on hidden store", async () => {
            const hiddenStore = useHiddenStore();

            // Should not throw
            await expect(hiddenStore.refreshFromStorage()).resolves.not.toThrow();

            // Should log refresh message
            expect(console.log).toHaveBeenCalledWith("[HiddenStore] Refreshing from storage due to external changes");
        });
    });

    describe("Phase 6 integration completeness", () => {
        it("should have all stores ready for cross-context sync", () => {
            const watchingStore = useWatchingStore();
            const planStore = usePlanToWatchStore();
            const hiddenStore = useHiddenStore();

            // All stores should have the required methods for Phase 6
            expect(watchingStore.refreshFromStorage).toBeDefined();
            expect(planStore.refreshFromStorage).toBeDefined();
            expect(hiddenStore.refreshFromStorage).toBeDefined();

            // All stores should have CRUD actions (Phase 6.1)
            expect(watchingStore.startWatching).toBeDefined();
            expect(watchingStore.incrementEpisode).toBeDefined();
            expect(watchingStore.decrementEpisode).toBeDefined();
            expect(watchingStore.stopWatching).toBeDefined();

            expect(planStore.addToPlan).toBeDefined();
            expect(planStore.removeFromPlan).toBeDefined();

            expect(hiddenStore.hide).toBeDefined();
            expect(hiddenStore.unhide).toBeDefined();
            expect(hiddenStore.clearAllHidden).toBeDefined();
        });

        it("should have error handling in all stores", () => {
            const watchingStore = useWatchingStore();
            const planStore = usePlanToWatchStore();
            const hiddenStore = useHiddenStore();

            // All stores should have error state management
            expect(watchingStore.lastError).toBeDefined();
            expect(watchingStore.hasError).toBeDefined();

            expect(planStore.lastError).toBeDefined();
            expect(planStore.hasError).toBeDefined();

            expect(hiddenStore.lastError).toBeDefined();
            expect(hiddenStore.hasError).toBeDefined();
        });
    });
});
