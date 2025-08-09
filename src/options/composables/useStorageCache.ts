import type { EpisodeProgress } from "@/commons/models";
import { useStorage } from "@vueuse/core";
import { computed, readonly } from "vue";

/**
 * Interface for cached statistics
 * Phase 7.2: Storage & Persistence Enhancement
 */
interface CachedStats {
    watching: number;
    planned: number;
    hidden: number;
    totalEpisodes: number;
    averageProgress: number;
    lastUpdated: number;
}

/**
 * Interface for cached episode progress summary
 */
interface CachedProgressSummary {
    [animeId: string]: {
        currentEpisode: number;
        totalEpisodes?: number;
        lastWatched: string;
    };
}

/**
 * Composable for persistent storage cache management
 * Phase 7.2: VueUse Integration - Storage & Persistence
 *
 * Provides instant startup with cached data while fresh data loads
 * Implements smart cache invalidation and hydration strategies
 */
export function useStorageCache() {
    // Cache for aggregate statistics - instant dashboard loading
    const cachedStats = useStorage<CachedStats>(
        "anime-list-stats-cache",
        {
            watching: 0,
            planned: 0,
            hidden: 0,
            totalEpisodes: 0,
            averageProgress: 0,
            lastUpdated: 0,
        },
        localStorage,
        {
            serializer: {
                read: (value: string) => {
                    try {
                        return JSON.parse(value);
                    } catch {
                        // Return default on parse error
                        return {
                            watching: 0,
                            planned: 0,
                            hidden: 0,
                            totalEpisodes: 0,
                            averageProgress: 0,
                            lastUpdated: 0,
                        };
                    }
                },
                write: (value: CachedStats) => JSON.stringify(value),
            },
        },
    );

    // Cache for episode progress summary - quick access to current episodes
    const cachedProgress = useStorage<CachedProgressSummary>("anime-list-progress-cache", {}, localStorage, {
        serializer: {
            read: (value: string) => {
                try {
                    return JSON.parse(value);
                } catch {
                    return {};
                }
            },
            write: (value: CachedProgressSummary) => JSON.stringify(value),
        },
    });

    /**
     * Update the stats cache with fresh data
     */
    const updateStatsCache = (stats: Omit<CachedStats, "lastUpdated">) => {
        const newStats = {
            ...stats,
            lastUpdated: Date.now(),
        };

        cachedStats.value = newStats;
        console.log("[StorageCache] Stats cache updated:", newStats);
    };

    /**
     * Update the progress cache with episode data
     */
    const updateProgressCache = (progressData: EpisodeProgress[]) => {
        const progressSummary: CachedProgressSummary = {};

        progressData.forEach((item) => {
            progressSummary[item.animeId] = {
                currentEpisode: item.currentEpisode,
                totalEpisodes: item.totalEpisodes,
                lastWatched: item.lastWatched,
            };
        });

        cachedProgress.value = progressSummary;
        console.log(`[StorageCache] Progress cache updated for ${progressData.length} items`);
    };

    /**
     * Check if the stats cache is stale (older than 5 minutes)
     */
    const isStale = computed(() => {
        const fiveMinutes = 5 * 60 * 1000;
        const age = Date.now() - cachedStats.value.lastUpdated;
        return age > fiveMinutes;
    });

    /**
     * Check if cache exists (has been populated at least once)
     */
    const hasCache = computed(() => {
        return cachedStats.value.lastUpdated > 0;
    });

    /**
     * Get cache age in minutes
     */
    const cacheAge = computed(() => {
        if (cachedStats.value.lastUpdated === 0) return Infinity;
        return Math.floor((Date.now() - cachedStats.value.lastUpdated) / (1000 * 60));
    });

    /**
     * Clear all caches
     */
    const clearCache = () => {
        cachedStats.value = {
            watching: 0,
            planned: 0,
            hidden: 0,
            totalEpisodes: 0,
            averageProgress: 0,
            lastUpdated: 0,
        };
        cachedProgress.value = {};
        console.log("[StorageCache] All caches cleared");
    };

    /**
     * Get current episode for an anime from cache
     */
    const getCachedEpisode = (animeId: string) => {
        return cachedProgress.value[animeId]?.currentEpisode || 0;
    };

    return {
        // Readonly access to cached data
        cachedStats: readonly(cachedStats),
        cachedProgress: readonly(cachedProgress),

        // Cache management functions
        updateStatsCache,
        updateProgressCache,
        clearCache,

        // Cache utilities
        isStale,
        hasCache,
        cacheAge,
        getCachedEpisode,
    };
}
