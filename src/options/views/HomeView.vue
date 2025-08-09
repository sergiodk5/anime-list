<template>
    <div
        data-testid="home-view"
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
            <!-- Welcome Section -->
            <div
                data-testid="welcome-section"
                class="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xs"
            >
                <div class="mb-6 flex items-center gap-4">
                    <div
                        data-testid="welcome-icon"
                        class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-white/20 backdrop-blur-xs"
                    >
                        <span class="text-2xl drop-shadow-xs">🎌</span>
                    </div>
                    <div>
                        <h1
                            data-testid="welcome-title"
                            class="text-3xl font-bold text-white drop-shadow-md"
                        >
                            Welcome to AnimeList
                        </h1>
                        <p
                            data-testid="welcome-subtitle"
                            class="text-lg text-white/80 drop-shadow-xs"
                        >
                            Your ultimate anime tracking companion
                        </p>
                    </div>
                </div>
                <p
                    data-testid="welcome-description"
                    class="leading-relaxed text-white/90 drop-shadow-xs"
                >
                    Manage your anime watch lists, track your progress, and discover new series to enjoy. Built with
                    love for the anime community! ✨
                </p>
            </div>

            <!-- Quick Stats -->
            <div
                data-testid="stats-section"
                class="grid grid-cols-1 gap-6 md:grid-cols-3"
            >
                <div
                    data-testid="stat-card-watching"
                    class="group rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
                >
                    <div class="flex items-center gap-3">
                        <span
                            data-testid="watching-icon"
                            class="text-2xl drop-shadow-xs"
                            >▶️</span
                        >
                        <div>
                            <h3
                                data-testid="watching-title"
                                class="text-lg font-semibold text-white drop-shadow-xs"
                            >
                                Currently Watching
                            </h3>
                            <p
                                data-testid="watching-count"
                                class="text-2xl font-bold text-purple-200 drop-shadow-xs"
                            >
                                {{ stats.watching }}
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    data-testid="stat-card-completed"
                    class="group rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
                >
                    <div class="flex items-center gap-3">
                        <span
                            data-testid="completed-icon"
                            class="text-2xl drop-shadow-xs"
                            >✅</span
                        >
                        <div>
                            <h3
                                data-testid="completed-title"
                                class="text-lg font-semibold text-white drop-shadow-xs"
                            >
                                Completed
                            </h3>
                            <p
                                data-testid="completed-count"
                                class="text-2xl font-bold text-green-200 drop-shadow-xs"
                            >
                                87
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    data-testid="stat-card-planned"
                    class="group rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
                >
                    <div class="flex items-center gap-3">
                        <span
                            data-testid="planned-icon"
                            class="text-2xl drop-shadow-xs"
                            >📋</span
                        >
                        <div>
                            <h3
                                data-testid="planned-title"
                                class="text-lg font-semibold text-white drop-shadow-xs"
                            >
                                Plan to Watch
                            </h3>
                            <p
                                data-testid="planned-count"
                                class="text-2xl font-bold text-blue-200 drop-shadow-xs"
                            >
                                {{ stats.planned }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div
                data-testid="actions-section"
                class="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xs"
            >
                <h2
                    data-testid="actions-title"
                    class="mb-6 text-2xl font-bold text-white drop-shadow-md"
                >
                    Quick Actions
                </h2>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <button
                        data-testid="action-add-anime"
                        class="group flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 text-left transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20 active:scale-95"
                    >
                        <span
                            data-testid="add-anime-icon"
                            class="text-xl drop-shadow-xs"
                            >➕</span
                        >
                        <div>
                            <h3 class="font-semibold text-white drop-shadow-xs">Add New Anime</h3>
                            <p class="text-sm text-white/80 drop-shadow-xs">Add a new series to your list</p>
                        </div>
                    </button>

                    <button
                        data-testid="action-view-lists"
                        class="group flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 text-left transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20 active:scale-95"
                    >
                        <span
                            data-testid="view-lists-icon"
                            class="text-xl drop-shadow-xs"
                            >📖</span
                        >
                        <div>
                            <h3 class="font-semibold text-white drop-shadow-xs">View All Lists</h3>
                            <p class="text-sm text-white/80 drop-shadow-xs">Browse your watch lists</p>
                        </div>
                    </button>
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

// Stores (for init / loading / error states expected by tests)
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
    // Initialize stores idempotently
    await Promise.all([watchingStore.init?.(), planStore.init?.(), hiddenStore.init?.()]);
    toast.success("Anime lists loaded");
});
</script>
