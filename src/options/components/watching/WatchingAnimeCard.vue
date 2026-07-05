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
            <p
                data-testid="watching-card-episodes"
                class="text-sm text-white/80 drop-shadow-xs"
            >
                {{ episodeLabel }}
            </p>
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

const props = defineProps<{ item: EpisodeProgress }>();

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
</script>
