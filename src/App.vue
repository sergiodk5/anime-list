<template>
    <div class="flex w-[336px] flex-col gap-4 overflow-hidden bg-white">
        <h1 class="px-4 py-2 text-xl font-bold text-gray-800">Watch List</h1>
        <button
            class="px-4 text-lg text-blue-500"
            @click="openOptions"
        >
            Options
        </button>

        <ul class="max-h-60 overflow-y-auto px-4 py-2">
            <li
                v-for="anime in watchList"
                :key="anime.animeId"
                class="mb-2"
            >
                <div class="flex items-center justify-between gap-1">
                    <a
                        :href="`https://hianime.to/${anime.animeSlug}`"
                        target="_blank"
                        class="block w-full grow-0 rounded-xs bg-gray-100 px-2 py-1 text-gray-800 hover:bg-blue-500 hover:text-white"
                    >
                        {{ anime.animeTitle }} - Ep {{ anime.currentEpisode }}
                    </a>
                    <button
                        class="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 px-2 py-1 text-sm text-white"
                        @click="removeFromWatchList(anime.animeId)"
                    >
                        -
                    </button>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type { EpisodeProgress } from "@/commons/models";
import { AnimeService } from "@/commons/services";
import { onMounted, onUnmounted, ref } from "vue";

const watchList = ref<EpisodeProgress[]>([]);
const animeService = new AnimeService();

const removeFromWatchList = async (animeId: string) => {
    const result = await animeService.stopWatching(animeId);
    if (result.success) {
        // Refresh the watch list after successful removal
        const allAnime = await animeService.getAllAnime();
        watchList.value = allAnime.currentlyWatching;
    } else {
        console.error("Failed to remove from watch list:", result.message);
    }
};

const checkForNewLinksListener = () => {
    chrome.storage.onChanged.addListener(async (changes) => {
        if (changes.episodeProgress) {
            const allAnime = await animeService.getAllAnime();
            watchList.value = allAnime.currentlyWatching;
        }
    });
};

const openOptions = () => {
    chrome.runtime.openOptionsPage();
};

onMounted(async () => {
    const allAnime = await animeService.getAllAnime();
    watchList.value = allAnime.currentlyWatching;
    checkForNewLinksListener();
});

onUnmounted(() => {
    chrome.storage.onChanged.removeListener(checkForNewLinksListener);
});
</script>
