<template>
    <h1>My List</h1>

    <ul class="px-4 py-2">
        <li
            v-for="anime in watchList"
            :key="anime.name"
            class="mb-2"
        >
            <div class="flex items-center justify-between gap-1">
                <RouterLink
                    class="block w-full grow-0 rounded-sm bg-gray-100 px-2 py-1 text-gray-800 hover:bg-blue-500 hover:text-white"
                    :to="{
                        name: 'list-item',
                        params: {
                            title: anime.name,
                            url: anime.url,
                            malId: anime?.malId,
                        },
                    }"
                >
                    {{ anime.name }}
                </RouterLink>

                <button
                    class="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 px-2 py-1 text-sm text-white"
                    @click="removeFromWatchList(anime)"
                >
                    -
                </button>
            </div>
        </li>
    </ul>
</template>

<script setup lang="ts">
import type { Link } from "@/commons/models";
import { getAllLinks } from "@/commons/utils/linksUtil";
import { onMounted, onUnmounted, ref } from "vue";

const watchList = ref<Link[]>([]);

const removeFromWatchList = (anime: Link) => {
    watchList.value = watchList.value.filter((a) => a.name !== anime.name);
    chrome.storage.local.set({ links: watchList.value });
};

const checkForNewLinksListener = () => {
    chrome.storage.onChanged.addListener(async () => {
        watchList.value = await getAllLinks();
    });
};

onMounted(async () => {
    watchList.value = await getAllLinks();

    checkForNewLinksListener();
});

onUnmounted(() => {
    chrome.storage.onChanged.removeListener(checkForNewLinksListener);
});
</script>
