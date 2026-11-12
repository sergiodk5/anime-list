import { StorageAdapter } from "@/commons/adapters/StorageAdapter";
import type { AnimeData } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";

export const LEGACY_OFFLINE_QUEUE_KEY = "__offlineQueue__";

interface LegacyQueuedAction {
    type: string;
    payload?: {
        anime?: AnimeData;
        animeId?: string;
        targetEpisode?: number;
        total?: number;
    };
}

async function replayEpisodeChange(service: AnimeService, action: LegacyQueuedAction): Promise<void> {
    const { animeId, targetEpisode, total } = action.payload ?? {};
    if (!animeId || !targetEpisode) return;

    const { episodeProgress } = await service.getAnimeDetails(animeId);
    if (!episodeProgress) return;

    const isIncrement = action.type === "watching:inc";
    const stillNeeded = isIncrement
        ? episodeProgress.currentEpisode < targetEpisode
        : episodeProgress.currentEpisode > targetEpisode;
    if (stillNeeded) {
        await service.updateEpisodeProgress(animeId, targetEpisode, total);
    }
}

async function replay(service: AnimeService, action: LegacyQueuedAction): Promise<void> {
    const { anime, animeId } = action.payload ?? {};
    switch (action.type) {
        case "watching:inc":
        case "watching:dec":
            return replayEpisodeChange(service, action);
        case "watching:start":
            if (anime) await service.startWatching(anime);
            return;
        case "watching:stop":
            if (animeId) await service.stopWatching(animeId);
            return;
        case "plan:add":
            if (anime) await service.addToPlanToWatch(anime);
            return;
        case "plan:remove":
            if (animeId) await service.removeFromPlanToWatch(animeId);
            return;
        case "hidden:hide":
            if (anime) await service.hideAnime(anime.animeId);
            return;
        case "hidden:unhide":
            if (animeId) await service.unhideAnime(animeId);
            return;
        case "hidden:clearAll":
            await service.clearAllHidden();
            return;
    }
}

/**
 * Apply actions left behind by the removed offline queue, then delete it.
 */
export async function flushLegacyOfflineQueue(service: AnimeService = new AnimeService()): Promise<void> {
    const actions = await StorageAdapter.get<LegacyQueuedAction[]>(LEGACY_OFFLINE_QUEUE_KEY);
    if (!actions) return;

    for (const action of actions) {
        try {
            await replay(service, action);
        } catch (error) {
            console.warn(`[LegacyOfflineQueue] Failed to replay ${action.type}`, error);
        }
    }

    await StorageAdapter.remove(LEGACY_OFFLINE_QUEUE_KEY);
}
