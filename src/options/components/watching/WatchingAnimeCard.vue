<template>
    <div
        data-testid="watching-card"
        class="group flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xs transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
    >
        <!-- Poster -->
        <div class="relative aspect-[2/3] w-full overflow-hidden">
            <img
                v-if="item.posterUrl && !imageFailed"
                data-testid="watching-card-poster"
                :src="item.posterUrl"
                :alt="item.animeTitle"
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                @error="imageFailed = true"
            />
            <div
                v-else
                data-testid="watching-card-placeholder"
                class="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-400 to-pink-400"
            >
                <span class="text-5xl font-bold text-white drop-shadow-md">{{ titleInitial }}</span>
            </div>
            <button
                data-testid="watching-card-remove"
                type="button"
                title="Remove from watching"
                :aria-label="`Remove ${item.animeTitle} from watching`"
                class="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-white/20 bg-black/40 text-xs text-white/90 opacity-0 backdrop-blur-xs transition-all duration-200 group-hover:opacity-100 hover:bg-red-500/60 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:outline-hidden active:scale-95"
                @click="handleRemove"
            >
                ✕
            </button>
        </div>

        <!-- Details -->
        <div class="flex flex-1 flex-col gap-2 p-4">
            <h3
                data-testid="watching-card-title"
                :title="item.animeTitle"
                class="line-clamp-2 min-h-[3.5rem] text-lg font-semibold text-white drop-shadow-xs"
            >
                {{ item.animeTitle }}
            </h3>
            <div
                data-testid="watching-card-episode-controls"
                class="flex items-center gap-2"
            >
                <button
                    data-testid="watching-card-decrement"
                    type="button"
                    title="Previous episode"
                    aria-label="Previous episode"
                    :disabled="isDecrementDisabled"
                    class="flex h-6 w-6 items-center justify-center rounded-md border border-white/20 bg-white/10 text-sm font-bold text-white/90 transition-all duration-200 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:outline-hidden active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/10"
                    @click="handleDecrement"
                >
                    −
                </button>
                <p
                    data-testid="watching-card-episodes"
                    class="text-sm text-white/80 drop-shadow-xs"
                >
                    {{ episodeLabel }}
                </p>
                <button
                    data-testid="watching-card-increment"
                    type="button"
                    title="Next episode"
                    aria-label="Next episode"
                    :disabled="isIncrementDisabled"
                    class="flex h-6 w-6 items-center justify-center rounded-md border border-white/20 bg-white/10 text-sm font-bold text-white/90 transition-all duration-200 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:outline-hidden active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/10"
                    @click="handleIncrement"
                >
                    +
                </button>
            </div>
            <a
                data-testid="watching-card-link"
                :href="watchUrl"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`Continue watching ${item.animeTitle}, episode ${item.currentEpisode}`"
                class="mt-auto inline-flex w-fit items-center rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/90 transition-colors hover:bg-white/20"
            >
                Watch →
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { EpisodeProgress } from "@/commons/models";
import { getContinueWatchingUrl } from "@/commons/utils/watchUrl";
import { useWatchingStore } from "@/options/stores/watchingStore";

const props = defineProps<{ item: EpisodeProgress }>();

const watchingStore = useWatchingStore();

const imageFailed = ref(false);

// Reset the failure flag when the poster URL changes — the content-script
// backfill can populate posterUrl after mount via storage sync.
watch(
    () => props.item.posterUrl,
    () => {
        imageFailed.value = false;
    },
);

const titleInitial = computed(() => props.item.animeTitle.charAt(0).toUpperCase());
const episodeLabel = computed(() => `Ep ${props.item.currentEpisode} / ${props.item.totalEpisodes ?? "?"}`);
const watchUrl = computed(() => getContinueWatchingUrl(props.item));

// Disabled states mirror the store's clamping (min 1, max totalEpisodes when known).
// An unknown totalEpisodes keeps [+] enabled — the store clamps at 999 internally.
const isDecrementDisabled = computed(() => props.item.currentEpisode <= 1);
const isIncrementDisabled = computed(
    () => props.item.totalEpisodes !== undefined && props.item.currentEpisode >= props.item.totalEpisodes,
);

// All feedback (optimistic update, rollback, toasts, offline queueing, undo
// snapshotting) is handled by the store action pipeline — fire and forget.
function handleIncrement(): void {
    void watchingStore.incrementEpisode(props.item.animeId);
}

function handleDecrement(): void {
    void watchingStore.decrementEpisode(props.item.animeId);
}

function handleRemove(): void {
    void watchingStore.stopWatching(props.item.animeId);
}
</script>
