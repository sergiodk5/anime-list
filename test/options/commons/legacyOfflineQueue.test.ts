import { beforeEach, describe, expect, it, vi } from "vitest";

const storageGet = vi.fn();
const storageRemove = vi.fn();

vi.mock("@/commons/adapters/StorageAdapter", () => ({
    StorageAdapter: {
        get: (...args: unknown[]) => storageGet(...args),
        remove: (...args: unknown[]) => storageRemove(...args),
    },
}));

import type { AnimeService } from "@/commons/services/AnimeService";
import { flushLegacyOfflineQueue, LEGACY_OFFLINE_QUEUE_KEY } from "@/options/commons/legacyOfflineQueue";

const anime = { animeId: "naruto", animeTitle: "Naruto", animeSlug: "naruto" };

function createService(currentEpisode?: number) {
    return {
        getAnimeDetails: vi.fn().mockResolvedValue({
            episodeProgress: currentEpisode === undefined ? undefined : { currentEpisode },
        }),
        updateEpisodeProgress: vi.fn().mockResolvedValue({ success: true }),
        startWatching: vi.fn().mockResolvedValue({ success: true }),
        stopWatching: vi.fn().mockResolvedValue({ success: true }),
        addToPlanToWatch: vi.fn().mockResolvedValue({ success: true }),
        removeFromPlanToWatch: vi.fn().mockResolvedValue({ success: true }),
        hideAnime: vi.fn().mockResolvedValue({ success: true }),
        unhideAnime: vi.fn().mockResolvedValue({ success: true }),
        clearAllHidden: vi.fn().mockResolvedValue({ success: true }),
    };
}

async function flush(actions: unknown[] | null, service: ReturnType<typeof createService>) {
    storageGet.mockResolvedValue(actions);
    await flushLegacyOfflineQueue(service as unknown as AnimeService);
}

describe("flushLegacyOfflineQueue", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does nothing when no legacy queue is stored", async () => {
        const service = createService(1);
        await flush(null, service);

        expect(storageGet).toHaveBeenCalledWith(LEGACY_OFFLINE_QUEUE_KEY);
        expect(storageRemove).not.toHaveBeenCalled();
    });

    it("applies a queued increment the stored progress has not reached, then deletes the queue", async () => {
        const service = createService(4);
        await flush([{ type: "watching:inc", payload: { animeId: "naruto", targetEpisode: 5, total: 12 } }], service);

        expect(service.updateEpisodeProgress).toHaveBeenCalledWith("naruto", 5, 12);
        expect(storageRemove).toHaveBeenCalledWith(LEGACY_OFFLINE_QUEUE_KEY);
    });

    it.each([
        ["watching:inc", 5, 5],
        ["watching:dec", 3, 3],
        ["watching:dec", 3, 2],
    ])("skips %s to episode %i when stored progress is already at or past it (%i)", async (type, targetEpisode, current) => {
        const service = createService(current);
        await flush([{ type, payload: { animeId: "naruto", targetEpisode } }], service);

        expect(service.updateEpisodeProgress).not.toHaveBeenCalled();
    });

    it("skips episode changes for anime no longer being watched", async () => {
        const service = createService();
        await flush([{ type: "watching:inc", payload: { animeId: "naruto", targetEpisode: 5 } }], service);

        expect(service.updateEpisodeProgress).not.toHaveBeenCalled();
    });

    it("replays consecutive increments in order", async () => {
        const service = createService(4);
        service.getAnimeDetails
            .mockResolvedValueOnce({ episodeProgress: { currentEpisode: 4 } })
            .mockResolvedValueOnce({ episodeProgress: { currentEpisode: 5 } });

        await flush(
            [
                { type: "watching:inc", payload: { animeId: "naruto", targetEpisode: 5 } },
                { type: "watching:inc", payload: { animeId: "naruto", targetEpisode: 6 } },
            ],
            service,
        );

        expect(service.updateEpisodeProgress.mock.calls.map((call) => call[1])).toEqual([5, 6]);
    });

    it("routes each remaining action type to its service call", async () => {
        const service = createService();
        await flush(
            [
                { type: "watching:start", payload: { anime } },
                { type: "watching:stop", payload: { animeId: "a" } },
                { type: "plan:add", payload: { anime } },
                { type: "plan:remove", payload: { animeId: "b" } },
                { type: "hidden:hide", payload: { anime } },
                { type: "hidden:unhide", payload: { animeId: "c" } },
                { type: "hidden:clearAll" },
            ],
            service,
        );

        expect(service.startWatching).toHaveBeenCalledWith(anime);
        expect(service.stopWatching).toHaveBeenCalledWith("a");
        expect(service.addToPlanToWatch).toHaveBeenCalledWith(anime);
        expect(service.removeFromPlanToWatch).toHaveBeenCalledWith("b");
        expect(service.hideAnime).toHaveBeenCalledWith("naruto");
        expect(service.unhideAnime).toHaveBeenCalledWith("c");
        expect(service.clearAllHidden).toHaveBeenCalled();
    });

    it("keeps replaying after one action fails and still deletes the queue", async () => {
        const service = createService();
        service.stopWatching.mockRejectedValue(new Error("boom"));
        vi.spyOn(console, "warn").mockImplementation(() => {});

        await flush(
            [
                { type: "watching:stop", payload: { animeId: "a" } },
                { type: "plan:remove", payload: { animeId: "b" } },
            ],
            service,
        );

        expect(service.removeFromPlanToWatch).toHaveBeenCalledWith("b");
        expect(storageRemove).toHaveBeenCalledWith(LEGACY_OFFLINE_QUEUE_KEY);
    });
});
