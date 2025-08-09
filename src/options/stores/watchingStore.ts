import { getOfflineQueue, registerOfflineAction } from "@/options/composables";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { AnimeData, EpisodeProgress } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import type { EpisodeProgressState, StoreActionResult } from "@/options/stores/types";

/**
 * Pinia store for managing currently watching anime (episode progress)
 * Phase 2: Read-only initialization and getters only
 */
export const useWatchingStore = defineStore("watching", () => {
    // State
    const state = ref<EpisodeProgressState>({
        items: [],
        itemsMap: {},
        loading: false,
        error: null,
        initialized: false,
    });

    // Action error tracking
    const lastError = ref<string | null>(null);

    // Service instance - will be injected in future phases
    const animeService = new AnimeService();

    // Getters
    const count = computed(() => state.value.items.length);

    const sortedByTitle = computed(() => {
        return [...state.value.items].sort((a, b) =>
            a.animeTitle.localeCompare(b.animeTitle, undefined, { sensitivity: "base" }),
        );
    });

    const byId = computed(() => (animeId: string): EpisodeProgress | undefined => {
        return state.value.itemsMap[animeId];
    });

    const isLoading = computed(() => state.value.loading);
    const hasError = computed(() => state.value.error !== null);
    const isInitialized = computed(() => state.value.initialized);

    // Actions
    async function init(): Promise<void> {
        // Idempotent initialization - only run once
        if (state.value.initialized) {
            return;
        }

        state.value.loading = true;
        state.value.error = null;

        try {
            // Get all anime data from the service
            const allAnimeData = await animeService.getAllAnime();
            const watchingItems = allAnimeData.currentlyWatching;

            // Create both array and map for efficient access
            const itemsMap: Record<string, EpisodeProgress> = {};
            watchingItems.forEach((item) => {
                itemsMap[item.animeId] = item;
            });

            state.value.items = watchingItems;
            state.value.itemsMap = itemsMap;
            state.value.initialized = true;
        } catch (error) {
            state.value.error = error instanceof Error ? error.message : String(error);
            console.error("Failed to initialize watching store:", error);
        } finally {
            state.value.loading = false;
        }
    }

    // Actions with optimistic update pattern

    /**
     * Start watching a new anime
     */
    async function startWatching(anime: AnimeData): Promise<StoreActionResult> {
        // Always apply optimistic addition upfront (works both online & offline)
        if (!state.value.itemsMap[anime.animeId]) {
            // Optimistic add (debug log removed)
            const newProgress: EpisodeProgress = {
                animeId: anime.animeId,
                animeTitle: anime.animeTitle,
                animeSlug: anime.animeSlug,
                currentEpisode: 1,
                episodeId: `${anime.animeSlug}-episode-1`,
                lastWatched: new Date().toISOString(),
                totalEpisodes: 12,
            };
            state.value.items.push(newProgress);
            state.value.itemsMap[anime.animeId] = newProgress;
        }
        const offlineQueue = getOfflineQueue();
        return offlineQueue.enqueueRunStoreAction(
            {
                run: () => animeService.startWatching(anime),
                onRollback: () => {
                    // Rollback optimistic add (debug log removed)
                    // Remove optimistic entry if service ultimately fails
                    if (state.value.itemsMap[anime.animeId]) {
                        const idx = state.value.items.findIndex((i) => i.animeId === anime.animeId);
                        if (idx !== -1) state.value.items.splice(idx, 1);
                        delete state.value.itemsMap[anime.animeId];
                    }
                },
                successToast: (r: any) => r?.message || `Started ${anime.animeTitle}`,
                errorToast: (m) => m || `Failed to start ${anime.animeTitle}`,
                setLastError: (m) => (lastError.value = m),
            },
            { type: "watching:start", description: `Start watching ${anime.animeTitle}`, payload: { anime } },
        );
    }

    /**
     * Increment episode count for an anime
     */
    async function incrementEpisode(animeId: string): Promise<StoreActionResult> {
        const currentItem = state.value.itemsMap[animeId];
        if (!currentItem) {
            lastError.value = "Anime not found in watching list";
            return { success: false, error: lastError.value };
        }
        const snapshot = {
            episode: currentItem.currentEpisode,
            episodeId: currentItem.episodeId,
            lastWatched: currentItem.lastWatched,
        };
        const newEpisode = Math.min(currentItem.currentEpisode + 1, currentItem.totalEpisodes || 999);
        const offlineQueue = getOfflineQueue();
        return offlineQueue.enqueueRunStoreAction(
            {
                run: () => animeService.updateEpisodeProgress(animeId, newEpisode, currentItem.totalEpisodes),
                onOptimistic: () => {
                    currentItem.currentEpisode = newEpisode;
                    currentItem.episodeId = `${currentItem.animeSlug}-episode-${newEpisode}`;
                    currentItem.lastWatched = new Date().toISOString();
                },
                onRollback: () => {
                    currentItem.currentEpisode = snapshot.episode;
                    currentItem.episodeId = snapshot.episodeId;
                    currentItem.lastWatched = snapshot.lastWatched;
                },
                successToast: (r: any) => r?.message || "Episode updated",
                errorToast: (m) => m || "Increment failed",
                setLastError: (m) => (lastError.value = m),
            },
            {
                type: "watching:inc",
                description: `Increment episode for ${animeId}`,
                payload: { animeId, targetEpisode: newEpisode, total: currentItem.totalEpisodes },
            },
        );
    }

    /**
     * Decrement episode count for an anime
     */
    async function decrementEpisode(animeId: string): Promise<StoreActionResult> {
        const currentItem = state.value.itemsMap[animeId];
        if (!currentItem) {
            lastError.value = "Anime not found in watching list";
            return { success: false, error: lastError.value };
        }
        const snapshot = {
            episode: currentItem.currentEpisode,
            episodeId: currentItem.episodeId,
            lastWatched: currentItem.lastWatched,
        };
        const newEpisode = Math.max(currentItem.currentEpisode - 1, 1);
        const offlineQueue = getOfflineQueue();
        return offlineQueue.enqueueRunStoreAction(
            {
                run: () => animeService.updateEpisodeProgress(animeId, newEpisode, currentItem.totalEpisodes),
                onOptimistic: () => {
                    currentItem.currentEpisode = newEpisode;
                    currentItem.episodeId = `${currentItem.animeSlug}-episode-${newEpisode}`;
                    currentItem.lastWatched = new Date().toISOString();
                },
                onRollback: () => {
                    currentItem.currentEpisode = snapshot.episode;
                    currentItem.episodeId = snapshot.episodeId;
                    currentItem.lastWatched = snapshot.lastWatched;
                },
                successToast: (r: any) => r?.message || "Episode updated",
                errorToast: (m) => m || "Decrement failed",
                setLastError: (m) => (lastError.value = m),
            },
            {
                type: "watching:dec",
                description: `Decrement episode for ${animeId}`,
                payload: { animeId, targetEpisode: newEpisode, total: currentItem.totalEpisodes },
            },
        );
    }

    /**
     * Stop watching an anime (remove from watching list)
     */
    async function stopWatching(animeId: string): Promise<StoreActionResult> {
        const currentItem = state.value.itemsMap[animeId];
        const itemIndex = state.value.items.findIndex((item) => item.animeId === animeId);
        if (!currentItem || itemIndex === -1) {
            lastError.value = "Anime not found in watching list";
            return { success: false, error: lastError.value };
        }
        const snapshot = { item: currentItem, index: itemIndex };
        const offlineQueue = getOfflineQueue();
        return offlineQueue.enqueueRunStoreAction(
            {
                run: () => animeService.stopWatching(animeId),
                onOptimistic: () => {
                    state.value.items.splice(snapshot.index, 1);
                    delete state.value.itemsMap[animeId];
                },
                onRollback: () => {
                    state.value.items.splice(snapshot.index, 0, snapshot.item);
                    state.value.itemsMap[animeId] = snapshot.item;
                },
                successToast: (r: any) => r?.message || "Removed from watching",
                errorToast: (m) => m || "Removal failed",
                setLastError: (m) => (lastError.value = m),
            },
            { type: "watching:stop", description: `Stop watching ${animeId}`, payload: { animeId } },
        );
    }

    // Internal helper methods
    async function refreshItems(): Promise<void> {
        try {
            // Get fresh data from service
            const allAnimeData = await animeService.getAllAnime();
            const watchingItems = allAnimeData.currentlyWatching;

            // Update both array and map
            const itemsMap: Record<string, EpisodeProgress> = {};
            watchingItems.forEach((item) => {
                itemsMap[item.animeId] = item;
            });

            state.value.items = watchingItems;
            state.value.itemsMap = itemsMap;
            state.value.error = null;
        } catch (error) {
            state.value.error = error instanceof Error ? error.message : String(error);
            console.error("Failed to refresh watching items:", error);
        }
    }

    /**
     * Refresh store data from storage - called by storage sync plugin
     * Phase 6: Real-time updates enhancement
     */
    async function refreshFromStorage(): Promise<void> {
        console.log(`[WatchingStore] Refreshing from storage due to external changes`);
        await refreshItems();
    }

    return {
        // State (read-only)
        items: computed(() => state.value.items),
        itemsMap: computed(() => state.value.itemsMap),

        // Getters
        count,
        sortedByTitle,
        byId,
        isLoading,
        hasError,
        isInitialized,
        error: computed(() => state.value.error),

        // Actions
        init,
        startWatching,
        incrementEpisode,
        decrementEpisode,
        stopWatching,

        // Phase 6: Storage sync integration
        refreshFromStorage,

        // Action state
        lastError: computed(() => lastError.value),
        __snapshot: () => ({
            items: state.value.items.map((i) => ({ ...i })),
        }),
        __restore: (snap: any) => {
            if (!snap || !Array.isArray(snap.items)) return;
            const itemsMap: Record<string, EpisodeProgress> = {};
            snap.items.forEach((i: EpisodeProgress) => (itemsMap[i.animeId] = { ...i }));
            state.value.items = snap.items.map((i: EpisodeProgress) => ({ ...i }));
            state.value.itemsMap = itemsMap;
        },
        // Test-only seeding helper (not used in production code paths)
        __seed: (items: EpisodeProgress[]) => {
            const itemsMap: Record<string, EpisodeProgress> = {};
            items.forEach((i) => (itemsMap[i.animeId] = i));
            state.value.items = items;
            state.value.itemsMap = itemsMap;
        },
    };
});

// Offline action builders for persistence replay
registerOfflineAction("watching:start", (payload: any) => {
    const anime: AnimeData = payload.anime;
    const service = new AnimeService();
    return {
        config: {
            run: () => service.startWatching(anime),
            expectSuccessField: true,
        },
        validate: () => {
            // Skip if already started locally now
            const store = useWatchingStore();
            return !store.itemsMap[anime.animeId];
        },
    };
});
registerOfflineAction("watching:inc", (payload: any) => {
    const { animeId, targetEpisode, total } = payload;
    const service = new AnimeService();
    return {
        config: { run: () => service.updateEpisodeProgress(animeId, targetEpisode, total), expectSuccessField: true },
        validate: () => {
            const store = useWatchingStore();
            const item = store.itemsMap[animeId];
            if (!item) return false; // anime removed -> conflict
            // If current episode already >= target (another context advanced), skip
            return item.currentEpisode < targetEpisode;
        },
    };
});
registerOfflineAction("watching:dec", (payload: any) => {
    const { animeId, targetEpisode, total } = payload;
    const service = new AnimeService();
    return {
        config: { run: () => service.updateEpisodeProgress(animeId, targetEpisode, total), expectSuccessField: true },
        validate: () => {
            const store = useWatchingStore();
            const item = store.itemsMap[animeId];
            if (!item) return false; // removed
            // If local episode already below or equal target (another decrement applied), skip
            return item.currentEpisode > targetEpisode;
        },
    };
});
registerOfflineAction("watching:stop", (payload: any) => {
    const { animeId } = payload;
    const service = new AnimeService();
    return {
        config: { run: () => service.stopWatching(animeId), expectSuccessField: true },
        validate: () => {
            const store = useWatchingStore();
            return Boolean(store.itemsMap[animeId]);
        },
    };
});
