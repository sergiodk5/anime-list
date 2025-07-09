<template>
    <DashboardLayout>
        <template #content>
            <h2 class="mb-4 text-2xl font-semibold">Watch List</h2>
            <ul class="space-y-4">
                <li
                    v-for="(anime, index) in watchList"
                    :key="index"
                    class="group flex items-center gap-4 rounded bg-white p-4 shadow hover:bg-gray-50"
                >
                    <RouterLink
                        :to="{
                            name: 'list-item',
                            params: {
                                title: anime.name,
                                url: anime.url,
                                malId: anime?.malId,
                            },
                        }"
                    >
                        <h3 class="text-lg font-semibold">{{ anime.name }}</h3>
                        <p class="text-sm text-gray-500">MAL ID: {{ anime?.malId }}</p>
                    </RouterLink>

                    <button
                        class="ml-auto h-6 w-6 text-gray-800 opacity-0 transition-all duration-100 group-hover:opacity-100"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="size-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                            />
                        </svg>
                    </button>
                </li>
            </ul>
        </template>
    </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import DashboardLayout from "../components/DashboardLayout.vue";
import { getAllLinks } from "@/commons/utils/linksUtil";
import type { Link } from "@/commons/models";

const watchList = ref<Link[]>([]);

// const open = ref(false);

onMounted(async () => {
    watchList.value = await getAllLinks();
});
</script>
