import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { AnimeMetadata } from "@/commons/models";
import { AnimeMetadataRepository } from "@/commons/repositories";

/**
 * Read-only Pinia store for AniList metadata (episode totals, airing schedule)
 */
export const useAnimeMetadataStore = defineStore("animeMetadata", () => {
    const itemsMap = ref<Record<string, AnimeMetadata>>({});
    const initialized = ref(false);
    const error = ref<string | null>(null);

    const repository = new AnimeMetadataRepository();

    const byId = computed(
        () =>
            (animeId: string): AnimeMetadata | undefined =>
                itemsMap.value[animeId],
    );

    async function load(): Promise<void> {
        try {
            const entries = await repository.findAll();
            itemsMap.value = Object.fromEntries(entries.map((entry) => [entry.animeId, entry]));
            error.value = null;
        } catch (err) {
            error.value = err instanceof Error ? err.message : String(err);
            console.error("Failed to load anime metadata:", err);
        }
    }

    async function init(): Promise<void> {
        if (initialized.value) return;
        await load();
        initialized.value = true;
    }

    return {
        itemsMap: computed(() => itemsMap.value),
        byId,
        isInitialized: computed(() => initialized.value),
        error: computed(() => error.value),
        init,
        refreshFromStorage: load,
    };
});
