<template>
    <div
        data-testid="currently-watching-view"
        class="space-y-8"
    >
        <!-- Loading State -->
        <div
            v-if="isLoading"
            data-testid="loading-state"
            class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
            <SkeletonCard />
            <SkeletonCard class="hidden sm:block" />
            <SkeletonCard class="hidden lg:block" />
            <SkeletonCard class="hidden lg:block" />
        </div>

        <!-- Error State -->
        <div
            v-else-if="hasError"
            data-testid="error-state"
            class="rounded-2xl border border-red-400/30 bg-red-400/10 p-8 text-center text-red-200 backdrop-blur-xs"
        >
            <h2 class="mb-2 text-xl font-semibold drop-shadow-xs">Unable to Load Data</h2>
            <p class="text-sm opacity-80">Please try again later.</p>
        </div>

        <template v-else>
            <!-- Page Header -->
            <div
                data-testid="watching-header"
                class="flex items-center justify-between"
            >
                <div class="flex items-center gap-4">
                    <div
                        data-testid="page-icon"
                        class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-white/20 backdrop-blur-xs"
                    >
                        <span class="text-2xl drop-shadow-xs">▶️</span>
                    </div>
                    <div>
                        <h1
                            data-testid="page-title"
                            class="text-3xl font-bold text-white drop-shadow-md"
                        >
                            Currently Watching
                        </h1>
                        <p
                            data-testid="page-subtitle"
                            class="text-lg text-white/80 drop-shadow-xs"
                        >
                            {{ watchingStore.count }} series in progress
                        </p>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div
                v-if="items.length === 0"
                data-testid="empty-state"
                class="rounded-2xl border border-dashed border-white/30 bg-white/5 p-12 text-center backdrop-blur-xs"
            >
                <span class="mb-3 block text-3xl opacity-50">▶️</span>
                <h3 class="mb-2 text-lg font-semibold text-white/80 drop-shadow-xs">Nothing here yet</h3>
                <p class="text-sm text-white/60 drop-shadow-xs">
                    Start watching on
                    <a
                        data-testid="empty-state-link"
                        href="https://anikototv.to/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-purple-200 underline transition-colors hover:text-white"
                        >anikototv</a
                    >
                    and your anime will show up here.
                </p>
            </div>

            <!-- Watching Grid -->
            <div
                v-else
                data-testid="watching-grid"
                class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
                <WatchingAnimeCard
                    v-for="item in items"
                    :key="item.animeId"
                    :item="item"
                />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useToast } from "vue-toastification";

import type { EpisodeProgress } from "@/commons/models";
import WatchingAnimeCard from "@/options/components/watching/WatchingAnimeCard.vue";
import SkeletonCard from "@/options/components/ui/SkeletonCard.vue";
import { useWatchingStore } from "@/options/stores/watchingStore";

// Store
const watchingStore = useWatchingStore();

function resolveFlag(flag: any): boolean {
    if (typeof flag === "boolean") return flag;
    if (flag && typeof flag.value === "boolean") return flag.value;
    return false;
}
const isLoading = computed(() => resolveFlag(watchingStore.isLoading));
const hasError = computed(() => resolveFlag(watchingStore.hasError));

const items = computed<EpisodeProgress[]>(() => watchingStore.sortedByTitle);

const toast = useToast();
onMounted(async () => {
    await Promise.all([watchingStore.init?.()]);
    toast.info("Watching list loaded");
});
</script>
