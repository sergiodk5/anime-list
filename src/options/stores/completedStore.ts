import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { CompletedAnime } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import type { CompletedAnimeState } from "@/options/stores/types";

/**
 * Pinia store for completed anime
 */
export const useCompletedStore = defineStore("completed", () => {
    const state = ref<CompletedAnimeState>({
        items: [],
        itemsMap: {},
        loading: false,
        error: null,
        initialized: false,
    });

    const animeService = new AnimeService();

    const count = computed(() => state.value.items.length);

    const sortedByCompletedAt = computed(() => {
        return [...state.value.items].sort((a, b) => {
            return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        });
    });

    const byId = computed(() => (animeId: string): CompletedAnime | undefined => {
        return state.value.itemsMap[animeId];
    });

    const isLoading = computed(() => state.value.loading);
    const hasError = computed(() => state.value.error !== null);
    const isInitialized = computed(() => state.value.initialized);

    function setItems(items: CompletedAnime[]): void {
        const itemsMap: Record<string, CompletedAnime> = {};
        items.forEach((item) => {
            itemsMap[item.animeId] = item;
        });
        state.value.items = items;
        state.value.itemsMap = itemsMap;
    }

    async function init(): Promise<void> {
        if (state.value.initialized) {
            return;
        }

        state.value.loading = true;
        state.value.error = null;

        try {
            const allAnimeData = await animeService.getAllAnime();
            setItems(allAnimeData.completedAnime);
            state.value.initialized = true;
        } catch (error) {
            state.value.error = error instanceof Error ? error.message : String(error);
            console.error("Failed to initialize completed store:", error);
        } finally {
            state.value.loading = false;
        }
    }

    async function refreshFromStorage(): Promise<void> {
        try {
            const allAnimeData = await animeService.getAllAnime();
            setItems(allAnimeData.completedAnime);
            state.value.error = null;
        } catch (error) {
            state.value.error = error instanceof Error ? error.message : String(error);
            console.error("Failed to refresh completed items:", error);
        }
    }

    return {
        items: computed(() => state.value.items),
        itemsMap: computed(() => state.value.itemsMap),

        count,
        sortedByCompletedAt,
        byId,
        isLoading,
        hasError,
        isInitialized,
        error: computed(() => state.value.error),

        init,
        refreshFromStorage,
    };
});
