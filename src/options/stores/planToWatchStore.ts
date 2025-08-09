import { getOfflineQueue, registerOfflineAction } from "@/options/composables";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { AnimeData, PlanToWatch } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import type { PlanToWatchState, StoreActionResult } from "@/options/stores/types";

/**
 * Pinia store for managing plan to watch anime
 * Phase 2: Read-only initialization and getters only
 */
export const usePlanToWatchStore = defineStore("planToWatch", () => {
    // State
    const state = ref<PlanToWatchState>({
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

    const sortedByDateAdded = computed(() => {
        return [...state.value.items].sort((a, b) => {
            return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        });
    });

    const byId = computed(() => (animeId: string): PlanToWatch | undefined => {
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
            const planItems = allAnimeData.planToWatch;

            // Create both array and map for efficient access
            const itemsMap: Record<string, PlanToWatch> = {};
            planItems.forEach((item) => {
                itemsMap[item.animeId] = item;
            });

            state.value.items = planItems;
            state.value.itemsMap = itemsMap;
            state.value.initialized = true;
        } catch (error) {
            state.value.error = error instanceof Error ? error.message : String(error);
            console.error("Failed to initialize plan to watch store:", error);
        } finally {
            state.value.loading = false;
        }
    }

    // Actions with optimistic update pattern

    /**
     * Add an anime to plan to watch list
     */
    async function addToPlan(anime: AnimeData): Promise<StoreActionResult> {
        const offlineQueue = getOfflineQueue();
        return offlineQueue.enqueueRunStoreAction(
            {
                run: () => animeService.addToPlanToWatch(anime),
                onSuccessApply: () => {
                    if (!state.value.itemsMap[anime.animeId]) {
                        const newPlanItem: PlanToWatch = {
                            animeId: anime.animeId,
                            animeTitle: anime.animeTitle,
                            animeSlug: anime.animeSlug,
                            addedAt: new Date().toISOString(),
                        };
                        state.value.items.push(newPlanItem);
                        state.value.itemsMap[anime.animeId] = newPlanItem;
                    }
                },
                successToast: (r: any) => r?.message || `Added ${anime.animeTitle}`,
                errorToast: (m) => m || `Failed to add ${anime.animeTitle}`,
                setLastError: (m) => (lastError.value = m),
            },
            { type: "plan:add", description: `Add ${anime.animeTitle} to plan`, payload: { anime } },
        );
    }

    /**
     * Remove an anime from plan to watch list
     */
    async function removeFromPlan(animeId: string): Promise<StoreActionResult> {
        const currentItem = state.value.itemsMap[animeId];
        const itemIndex = state.value.items.findIndex((item) => item.animeId === animeId);
        if (!currentItem || itemIndex === -1) {
            lastError.value = "Anime not found in plan to watch list";
            return { success: false, error: lastError.value };
        }
        const snapshot = { item: currentItem, index: itemIndex };
        const offlineQueue = getOfflineQueue();
        return offlineQueue.enqueueRunStoreAction(
            {
                run: () => animeService.removeFromPlanToWatch(animeId),
                onOptimistic: () => {
                    state.value.items.splice(snapshot.index, 1);
                    delete state.value.itemsMap[animeId];
                },
                onRollback: () => {
                    state.value.items.splice(snapshot.index, 0, snapshot.item);
                    state.value.itemsMap[animeId] = snapshot.item;
                },
                successToast: (r: any) => r?.message || "Removed from plan",
                errorToast: (m) => m || "Removal failed",
                setLastError: (m) => (lastError.value = m),
            },
            { type: "plan:remove", description: `Remove ${animeId} from plan`, payload: { animeId } },
        );
    }

    // Internal helper methods
    async function refreshItems(): Promise<void> {
        try {
            // Get fresh data from service
            const allAnimeData = await animeService.getAllAnime();
            const planItems = allAnimeData.planToWatch;

            // Update both array and map
            const itemsMap: Record<string, PlanToWatch> = {};
            planItems.forEach((item) => {
                itemsMap[item.animeId] = item;
            });

            state.value.items = planItems;
            state.value.itemsMap = itemsMap;
            state.value.error = null;
        } catch (error) {
            state.value.error = error instanceof Error ? error.message : String(error);
            console.error("Failed to refresh plan to watch items:", error);
        }
    }

    /**
     * Refresh store data from storage - called by storage sync plugin
     * Phase 6: Real-time updates enhancement
     */
    async function refreshFromStorage(): Promise<void> {
        console.log(`[PlanToWatchStore] Refreshing from storage due to external changes`);
        await refreshItems();
    }

    return {
        // State (read-only)
        items: computed(() => state.value.items),
        itemsMap: computed(() => state.value.itemsMap),

        // Getters
        count,
        sortedByTitle,
        sortedByDateAdded,
        byId,
        isLoading,
        hasError,
        isInitialized,
        error: computed(() => state.value.error),

        // Actions
        init,
        addToPlan,
        removeFromPlan,

        // Phase 6: Storage sync integration
        refreshFromStorage,

        // Action state
        lastError: computed(() => lastError.value),
        __snapshot: () => ({
            items: state.value.items.map((i) => ({ ...i })),
        }),
        __restore: (snap: any) => {
            if (!snap || !Array.isArray(snap.items)) return;
            const itemsMap: Record<string, PlanToWatch> = {};
            snap.items.forEach((i: PlanToWatch) => (itemsMap[i.animeId] = { ...i }));
            state.value.items = snap.items.map((i: PlanToWatch) => ({ ...i }));
            state.value.itemsMap = itemsMap;
        },
    };
});

registerOfflineAction("plan:add", (payload: any) => {
    const anime: AnimeData = payload.anime;
    const service = new AnimeService();
    return {
        config: { run: () => service.addToPlanToWatch(anime), expectSuccessField: true },
        validate: () => {
            const store = usePlanToWatchStore();
            return !store.itemsMap[anime.animeId];
        },
    };
});
registerOfflineAction("plan:remove", (payload: any) => {
    const { animeId } = payload;
    const service = new AnimeService();
    return {
        config: { run: () => service.removeFromPlanToWatch(animeId), expectSuccessField: true },
        validate: () => {
            const store = usePlanToWatchStore();
            return Boolean(store.itemsMap[animeId]);
        },
    };
});
