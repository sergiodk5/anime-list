import { getOfflineQueue, registerOfflineAction } from "@/options/composables";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { AnimeData } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import type { HiddenAnimeState, StoreActionResult } from "@/options/stores/types";

/**
 * Pinia store for managing hidden anime
 * Phase 2: Read-only initialization and getters only
 */
export const useHiddenStore = defineStore("hidden", () => {
    // State
    const state = ref<HiddenAnimeState>({
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

    const byId = computed(() => (animeId: string): AnimeData | undefined => {
        return state.value.itemsMap[animeId];
    });

    const isHidden = computed(() => (animeId: string): boolean => {
        return animeId in state.value.itemsMap;
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
            const hiddenIds = allAnimeData.hiddenAnime;

            // Convert hidden anime IDs to AnimeData objects
            // Note: Hidden anime only stores IDs, so we create minimal AnimeData objects
            const hiddenItems: AnimeData[] = hiddenIds.map((animeId) => ({
                animeId,
                animeTitle: animeId, // Use ID as title since we only have ID
                animeSlug: animeId, // Use ID as slug since we only have ID
            }));

            // Create both array and map for efficient access
            const itemsMap: Record<string, AnimeData> = {};
            hiddenItems.forEach((item) => {
                itemsMap[item.animeId] = item;
            });

            state.value.items = hiddenItems;
            state.value.itemsMap = itemsMap;
            state.value.initialized = true;
        } catch (error) {
            state.value.error = error instanceof Error ? error.message : String(error);
            console.error("Failed to initialize hidden anime store:", error);
        } finally {
            state.value.loading = false;
        }
    }

    // Actions with optimistic update pattern

    /**
     * Hide an anime from all listings
     */
    async function hide(anime: AnimeData): Promise<StoreActionResult> {
        const offlineQueue = getOfflineQueue();
        return offlineQueue.enqueueRunStoreAction(
            {
                run: () => animeService.hideAnime(anime.animeId),
                onSuccessApply: () => {
                    if (!state.value.itemsMap[anime.animeId]) {
                        state.value.items.push(anime);
                        state.value.itemsMap[anime.animeId] = anime;
                    }
                },
                successToast: (r: any) => r?.message || `Hidden ${anime.animeTitle}`,
                errorToast: (m) => m || `Failed to hide ${anime.animeTitle}`,
                setLastError: (m) => (lastError.value = m),
            },
            { type: "hidden:hide", description: `Hide ${anime.animeTitle}`, payload: { anime } },
        );
    }

    /**
     * Unhide an anime (restore it to listings)
     */
    async function unhide(animeId: string): Promise<StoreActionResult> {
        const itemIndex = state.value.items.findIndex((item) => item.animeId === animeId);
        const currentItem = state.value.itemsMap[animeId];
        if (itemIndex === -1 || !currentItem) {
            lastError.value = "Anime not found in hidden list";
            return { success: false, error: lastError.value };
        }
        const snapshot = { item: currentItem, index: itemIndex };
        const offlineQueue = getOfflineQueue();
        return offlineQueue.enqueueRunStoreAction(
            {
                run: () => animeService.unhideAnime(animeId),
                onOptimistic: () => {
                    state.value.items.splice(snapshot.index, 1);
                    delete state.value.itemsMap[animeId];
                },
                onRollback: () => {
                    state.value.items.splice(snapshot.index, 0, snapshot.item);
                    state.value.itemsMap[animeId] = snapshot.item;
                },
                successToast: (r: any) => r?.message || "Unhidden anime",
                errorToast: (m) => m || "Unhide failed",
                setLastError: (m) => (lastError.value = m),
            },
            { type: "hidden:unhide", description: `Unhide ${animeId}`, payload: { animeId } },
        );
    }

    /**
     * Clear all hidden anime (unhide all)
     */
    async function clearAllHidden(): Promise<StoreActionResult> {
        const originalItems = [...state.value.items];
        const originalItemsMap = { ...state.value.itemsMap };
        const offlineQueue = getOfflineQueue();
        return offlineQueue.enqueueRunStoreAction(
            {
                run: () => animeService.clearAllHidden(),
                onOptimistic: () => {
                    state.value.items = [];
                    state.value.itemsMap = {};
                },
                onRollback: () => {
                    state.value.items = originalItems;
                    state.value.itemsMap = originalItemsMap;
                },
                successToast: (r: any) => r?.message || "Cleared hidden list",
                errorToast: (m) => m || "Clear hidden failed",
                setLastError: (m) => (lastError.value = m),
            },
            { type: "hidden:clearAll", description: "Clear hidden list", payload: {} },
        );
    }

    // Internal helper methods
    async function refreshItems(): Promise<void> {
        try {
            // Get all anime data from the service
            const allAnimeData = await animeService.getAllAnime();
            const hiddenIds = allAnimeData.hiddenAnime;

            // Convert hidden anime IDs to AnimeData objects
            // Note: Hidden anime only stores IDs, so we create minimal AnimeData objects
            const hiddenItems: AnimeData[] = hiddenIds.map((animeId) => ({
                animeId,
                animeTitle: animeId, // Use ID as title since we only have ID
                animeSlug: animeId, // Use ID as slug since we only have ID
            }));

            // Create both array and map for efficient access
            const itemsMap: Record<string, AnimeData> = {};
            hiddenItems.forEach((item) => {
                itemsMap[item.animeId] = item;
            });

            state.value.items = hiddenItems;
            state.value.itemsMap = itemsMap;
            state.value.error = null;
        } catch (error) {
            state.value.error = error instanceof Error ? error.message : String(error);
            console.error("Failed to refresh hidden items:", error);
        }
    }

    /**
     * Refresh store data from storage - called by storage sync plugin
     * Phase 6: Real-time updates enhancement
     */
    async function refreshFromStorage(): Promise<void> {
        console.log(`[HiddenStore] Refreshing from storage due to external changes`);
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
        isHidden,
        isLoading,
        hasError,
        isInitialized,
        error: computed(() => state.value.error),

        // Actions
        init,
        hide,
        unhide,
        clearAllHidden,

        // Phase 6: Storage sync integration
        refreshFromStorage,

        // Action state
        lastError: computed(() => lastError.value),
        __snapshot: () => ({
            items: state.value.items.map((i) => ({ ...i })),
        }),
        __restore: (snap: any) => {
            if (!snap || !Array.isArray(snap.items)) return;
            const itemsMap: Record<string, AnimeData> = {};
            snap.items.forEach((i: AnimeData) => (itemsMap[i.animeId] = { ...i }));
            state.value.items = snap.items.map((i: AnimeData) => ({ ...i }));
            state.value.itemsMap = itemsMap;
        },
    };
});

registerOfflineAction("hidden:hide", (payload: any) => {
    const anime: AnimeData = payload.anime;
    const service = new AnimeService();
    return {
        config: { run: () => service.hideAnime(anime.animeId), expectSuccessField: true },
        validate: () => {
            const store = useHiddenStore();
            return !store.itemsMap[anime.animeId];
        },
    };
});
registerOfflineAction("hidden:unhide", (payload: any) => {
    const { animeId } = payload;
    const service = new AnimeService();
    return {
        config: { run: () => service.unhideAnime(animeId), expectSuccessField: true },
        validate: () => {
            const store = useHiddenStore();
            return Boolean(store.itemsMap[animeId]);
        },
    };
});
registerOfflineAction("hidden:clearAll", () => {
    const service = new AnimeService();
    return {
        config: { run: () => service.clearAllHidden(), expectSuccessField: true },
        validate: () => {
            const store = useHiddenStore();
            return store.count > 0;
        },
    };
});
