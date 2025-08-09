<template>
    <div
        data-testid="watchlists-view"
        class="space-y-8"
    >
        <!-- Loading State -->
        <div
            v-if="isLoading"
            data-testid="loading-state"
            class="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
            <SkeletonCard />
            <SkeletonCard class="hidden md:block" />
            <SkeletonCard class="hidden md:block" />
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
                data-testid="watchlists-header"
                class="flex items-center justify-between"
            >
                <div class="flex items-center gap-4">
                    <div
                        data-testid="page-icon"
                        class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-white/20 backdrop-blur-xs"
                    >
                        <span class="text-2xl drop-shadow-xs">📺</span>
                    </div>
                    <div>
                        <h1
                            data-testid="page-title"
                            class="text-3xl font-bold text-white drop-shadow-md"
                        >
                            Watch Lists
                        </h1>
                        <p
                            data-testid="page-subtitle"
                            class="text-lg text-white/80 drop-shadow-xs"
                        >
                            Manage your anime collections
                        </p>
                    </div>
                </div>

                <button
                    data-testid="add-list-button"
                    class="group flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-xs transition-all duration-200 hover:border-white/30 hover:bg-white/20 hover:shadow-md hover:shadow-black/20 active:scale-95"
                >
                    <span
                        data-testid="add-icon"
                        class="text-base drop-shadow-xs"
                        >➕</span
                    >
                    <span class="drop-shadow-xs">New List</span>
                </button>
            </div>

            <!-- Watch Lists Grid -->
            <div
                data-testid="watchlists-grid"
                class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                <!-- Currently Watching List -->
                <div
                    data-testid="list-currently-watching"
                    class="group rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
                >
                    <div class="mb-4 flex items-center gap-3">
                        <span
                            data-testid="watching-icon"
                            class="text-2xl drop-shadow-xs"
                            >▶️</span
                        >
                        <h3
                            data-testid="watching-title"
                            class="text-xl font-bold text-white drop-shadow-xs"
                        >
                            Currently Watching
                        </h3>
                    </div>
                    <p
                        data-testid="watching-description"
                        class="mb-4 text-white/80 drop-shadow-xs"
                    >
                        Anime you're actively following
                    </p>
                    <div
                        data-testid="watching-stats"
                        class="flex items-center justify-between"
                    >
                        <span
                            data-testid="watching-count"
                            class="text-2xl font-bold text-purple-200 drop-shadow-xs"
                        >
                            {{ stats.watching }} series
                        </span>
                        <button
                            data-testid="view-watching"
                            class="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/90 transition-colors hover:bg-white/20"
                        >
                            View →
                        </button>
                    </div>
                </div>

                <!-- Completed List -->
                <div
                    data-testid="list-completed"
                    class="group rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
                >
                    <div class="mb-4 flex items-center gap-3">
                        <span
                            data-testid="completed-icon"
                            class="text-2xl drop-shadow-xs"
                            >✅</span
                        >
                        <h3
                            data-testid="completed-title"
                            class="text-xl font-bold text-white drop-shadow-xs"
                        >
                            Completed
                        </h3>
                    </div>
                    <p
                        data-testid="completed-description"
                        class="mb-4 text-white/80 drop-shadow-xs"
                    >
                        Anime you've finished watching
                    </p>
                    <div
                        data-testid="completed-stats"
                        class="flex items-center justify-between"
                    >
                        <span
                            data-testid="completed-count"
                            class="text-2xl font-bold text-green-200 drop-shadow-xs"
                        >
                            87 series
                        </span>
                        <button
                            data-testid="view-completed"
                            class="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/90 transition-colors hover:bg-white/20"
                        >
                            View →
                        </button>
                    </div>
                </div>

                <!-- Plan to Watch List -->
                <div
                    data-testid="list-planned"
                    class="group rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
                >
                    <div class="mb-4 flex items-center gap-3">
                        <span
                            data-testid="planned-icon"
                            class="text-2xl drop-shadow-xs"
                            >📋</span
                        >
                        <h3
                            data-testid="planned-title"
                            class="text-xl font-bold text-white drop-shadow-xs"
                        >
                            Plan to Watch
                        </h3>
                    </div>
                    <p
                        data-testid="planned-description"
                        class="mb-4 text-white/80 drop-shadow-xs"
                    >
                        Anime on your watchlist
                    </p>
                    <div
                        data-testid="planned-stats"
                        class="flex items-center justify-between"
                    >
                        <span
                            data-testid="planned-count"
                            class="text-2xl font-bold text-blue-200 drop-shadow-xs"
                        >
                            {{ stats.planned }} series
                        </span>
                        <button
                            data-testid="view-planned"
                            class="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/90 transition-colors hover:bg-white/20"
                        >
                            View →
                        </button>
                    </div>
                </div>

                <!-- On Hold List -->
                <div
                    data-testid="list-on-hold"
                    class="group rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
                >
                    <div class="mb-4 flex items-center gap-3">
                        <span
                            data-testid="on-hold-icon"
                            class="text-2xl drop-shadow-xs"
                            >⏸️</span
                        >
                        <h3
                            data-testid="on-hold-title"
                            class="text-xl font-bold text-white drop-shadow-xs"
                        >
                            On Hold
                        </h3>
                    </div>
                    <p
                        data-testid="on-hold-description"
                        class="mb-4 text-white/80 drop-shadow-xs"
                    >
                        Anime you've paused watching
                    </p>
                    <div
                        data-testid="on-hold-stats"
                        class="flex items-center justify-between"
                    >
                        <span
                            data-testid="on-hold-count"
                            class="text-2xl font-bold text-yellow-200 drop-shadow-xs"
                        >
                            5 series
                        </span>
                        <button
                            data-testid="view-on-hold"
                            class="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/90 transition-colors hover:bg-white/20"
                        >
                            View →
                        </button>
                    </div>
                </div>

                <!-- Dropped List -->
                <div
                    data-testid="list-dropped"
                    class="group rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
                >
                    <div class="mb-4 flex items-center gap-3">
                        <span
                            data-testid="dropped-icon"
                            class="text-2xl drop-shadow-xs"
                            >❌</span
                        >
                        <h3
                            data-testid="dropped-title"
                            class="text-xl font-bold text-white drop-shadow-xs"
                        >
                            Dropped
                        </h3>
                    </div>
                    <p
                        data-testid="dropped-description"
                        class="mb-4 text-white/80 drop-shadow-xs"
                    >
                        Anime you've stopped watching
                    </p>
                    <div
                        data-testid="dropped-stats"
                        class="flex items-center justify-between"
                    >
                        <span
                            data-testid="dropped-count"
                            class="text-2xl font-bold text-red-200 drop-shadow-xs"
                        >
                            8 series
                        </span>
                        <button
                            data-testid="view-dropped"
                            class="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/90 transition-colors hover:bg-white/20"
                        >
                            View →
                        </button>
                    </div>
                </div>

                <!-- Custom Lists Placeholder -->
                <div
                    data-testid="list-custom"
                    class="group rounded-2xl border border-dashed border-white/30 bg-white/5 p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/40 hover:bg-white/10"
                >
                    <div class="flex h-full flex-col items-center justify-center text-center">
                        <span
                            data-testid="custom-icon"
                            class="mb-3 text-3xl opacity-50"
                            >➕</span
                        >
                        <h3
                            data-testid="custom-title"
                            class="mb-2 text-lg font-semibold text-white/80 drop-shadow-xs"
                        >
                            Create Custom List
                        </h3>
                        <p
                            data-testid="custom-description"
                            class="text-sm text-white/60 drop-shadow-xs"
                        >
                            Add your own categories
                        </p>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import SkeletonCard from "@/options/components/ui/SkeletonCard.vue";
import { useSmartStats } from "@/options/composables";
import { useHiddenStore } from "@/options/stores/hiddenStore";
import { usePlanToWatchStore } from "@/options/stores/planToWatchStore";
import { useWatchingStore } from "@/options/stores/watchingStore";
import { computed, onMounted } from "vue";
import { useToast } from "vue-toastification";

// Enhanced statistics with VueUse integration
const { stats } = useSmartStats();

// Stores
const watchingStore = useWatchingStore();
const planStore = usePlanToWatchStore();
const hiddenStore = useHiddenStore();

function resolveFlag(flag: any): boolean {
    if (typeof flag === "boolean") return flag;
    if (flag && typeof flag.value === "boolean") return flag.value;
    return false;
}
const isLoading = computed(() => resolveFlag(watchingStore.isLoading) || resolveFlag(planStore.isLoading));
const hasError = computed(
    () => resolveFlag(watchingStore.hasError) || resolveFlag(planStore.hasError) || resolveFlag(hiddenStore.hasError),
);

const toast = useToast();
onMounted(async () => {
    await Promise.all([watchingStore.init?.(), planStore.init?.(), hiddenStore.init?.()]);
    toast.info("Lists loaded");
});
</script>
