import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EpisodeProgress } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import { useWatchingStore } from "@/options/stores/watchingStore";

vi.mock("vue-toastification", () => ({
    useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

vi.mock("@/commons/services/AnimeService");

describe("useWatchingStore extended actions", () => {
    let mockGetAllAnime: any;
    let mockUpdateEpisodeProgress: any;
    let mockStopWatching: any;
    let mockStartWatching: any;

    const baseItem: EpisodeProgress = {
        animeId: "a1",
        animeTitle: "Sample Show",
        animeSlug: "sample-show",
        currentEpisode: 1,
        episodeId: "sample-show-ep-1",
        lastWatched: "2025-01-01T00:00:00.000Z",
        totalEpisodes: 2,
    };

    function setupStore(withItem = true) {
        mockGetAllAnime = vi.fn().mockResolvedValue({
            currentlyWatching: withItem ? [structuredClone(baseItem)] : [],
            planToWatch: [],
            hiddenAnime: [],
            totalCount: withItem ? 1 : 0,
        });
        mockUpdateEpisodeProgress = vi.fn().mockResolvedValue({ success: true, message: "ok" });
        mockStopWatching = vi.fn().mockResolvedValue({ success: true, message: "removed" });
        mockStartWatching = vi.fn().mockResolvedValue({ success: true, message: "started" });
        vi.mocked(AnimeService).mockImplementation(
            () =>
                ({
                    getAllAnime: mockGetAllAnime,
                    updateEpisodeProgress: mockUpdateEpisodeProgress,
                    stopWatching: mockStopWatching,
                    startWatching: mockStartWatching,
                }) as any,
        );
        const store = useWatchingStore();
        return store;
    }

    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it("increments episode (optimistic then confirms) and caps at totalEpisodes", async () => {
        const store = setupStore(true);
        await store.init();
        const first = store.items[0];
        expect(first.currentEpisode).toBe(1);
        await store.incrementEpisode("a1");
        expect(first.currentEpisode).toBe(2); // incremented
        await store.incrementEpisode("a1");
        expect(first.currentEpisode).toBe(2); // capped
        expect(mockUpdateEpisodeProgress).toHaveBeenCalled();
    });

    it("decrements episode with rollback on failure", async () => {
        const store = setupStore(true);
        await store.init();
        const first = store.items[0];
        first.currentEpisode = 2; // prepare
        mockUpdateEpisodeProgress.mockResolvedValueOnce({ success: false, message: "fail" });
        const res = await store.decrementEpisode("a1");
        expect(res.success).toBe(false);
        expect(first.currentEpisode).toBe(2); // rollback
        expect(store.lastError).toBe("fail");
    });

    it("stopWatching removes item and supports rollback on failure", async () => {
        const store = setupStore(true);
        await store.init();
        mockStopWatching.mockResolvedValueOnce({ success: false, message: "cannot" });
        const resFail = await store.stopWatching("a1");
        expect(resFail.success).toBe(false);
        expect(store.count).toBe(1);
        mockStopWatching.mockResolvedValueOnce({ success: true, message: "removed" });
        const resOk = await store.stopWatching("a1");
        expect(resOk.success).toBe(true);
        expect(store.count).toBe(0);
    });

    it("returns error when incrementing unknown anime id", async () => {
        const store = setupStore(false);
        await store.init();
        const res = await store.incrementEpisode("missing");
        expect(res.success).toBe(false);
        expect(res.error).toMatch(/not found/i);
    });

    it("refreshFromStorage rehydrates items after external change", async () => {
        const store = setupStore(true);
        await store.init();
        mockGetAllAnime.mockResolvedValueOnce({
            currentlyWatching: [
                {
                    ...baseItem,
                    animeId: "a2",
                    animeTitle: "New Show",
                    animeSlug: "new-show",
                },
            ],
            planToWatch: [],
            hiddenAnime: [],
            totalCount: 1,
        });
        await store.refreshFromStorage();
        expect(store.count).toBe(1);
        expect(store.items[0].animeId).toBe("a2");
    });
});
