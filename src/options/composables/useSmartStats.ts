import type { EpisodeProgress } from "@/commons/models";
import { watchThrottled } from "@vueuse/core";
import { computed, ref } from "vue";
import { useHiddenStore } from "../stores/hiddenStore";
import { usePlanToWatchStore } from "../stores/planToWatchStore";
import { useWatchingStore } from "../stores/watchingStore";
import { useStorageCache } from "./useStorageCache";

/**
 * Interface for computed statistics
 * Phase 7.5: Smart Statistics with VueUse optimization
 */
interface SmartStats {
    watching: number;
    planned: number;
    hidden: number;
    totalEpisodes: number;
    averageProgress: number;
    completionRate: number;
    totalItems: number;
}

/**
 * Interface for trend data
 */
interface TrendData {
    watchingTrend: "up" | "down" | "stable";
    plannedTrend: "up" | "down" | "stable";
    lastChangeTime: number;
    changeDescription: string;
}

/**
 * Smart statistics composable with throttled computations
 * Phase 7.5: VueUse Integration - Performance & Smart Stats
 *
 * Provides high-performance statistics with intelligent caching,
 * throttled updates, and trend analysis
 */
export function useSmartStats() {
    // Store references
    const watchingStore = useWatchingStore();
    const planStore = usePlanToWatchStore();
    const hiddenStore = useHiddenStore();
    const { cachedStats, updateStatsCache, hasCache, isStale } = useStorageCache();

    // Track if we're currently computing expensive operations
    const isComputing = ref(false);

    // Track when data changes for trend analysis
    const lastChangeTime = ref(Date.now());

    /**
     * Helper to normalize potential Ref<Array> or plain Array provided by stores/mocks
     * In production stores expose computed arrays; in tests mocks may supply ref([])
     */
    function resolveItems<T = unknown>(maybeArrayOrRef: any): T[] {
        if (Array.isArray(maybeArrayOrRef)) return maybeArrayOrRef as T[];
        if (maybeArrayOrRef && Array.isArray(maybeArrayOrRef.value)) return maybeArrayOrRef.value as T[];
        return [] as T[];
    }

    /**
     * Compute basic statistics (fast operations)
     */
    const basicStats = computed((): SmartStats => {
        const watchingItems = resolveItems<EpisodeProgress>(watchingStore.items);
        const plannedItems = resolveItems(planStore.items);
        const hiddenItems = resolveItems(hiddenStore.items);

        // Fallback to store.count ref/computed when items array not yet populated (e.g., mocked stores)
        const resolveCount = (store: any): number => {
            const c = store?.count;
            if (typeof c === "number") return c;
            if (c && typeof c.value === "number") return c.value;
            return 0;
        };
        const watchingCount = watchingItems.length > 0 ? watchingItems.length : resolveCount(watchingStore);
        const plannedCount = plannedItems.length > 0 ? plannedItems.length : resolveCount(planStore);
        const hiddenCount = hiddenItems.length > 0 ? hiddenItems.length : resolveCount(hiddenStore);
        const totalItems = watchingCount + plannedCount;

        // Quick stats without expensive operations
        return {
            watching: watchingCount,
            planned: plannedCount,
            hidden: hiddenCount,
            totalEpisodes: 0, // Will be computed separately if needed
            averageProgress: 0, // Will be computed separately if needed
            completionRate: 0, // Will be computed separately if needed
            totalItems,
        };
    });

    /**
     * Compute expensive statistics (throttled)
     */
    const expensiveStats = ref<Partial<SmartStats>>({});

    // Throttled computation of expensive stats
    watchThrottled(
        [() => resolveItems(watchingStore.items)],
        () => {
            // Update change time
            lastChangeTime.value = Date.now();
            const watchingItems = resolveItems<EpisodeProgress>(watchingStore.items);

            if (!watchingItems || watchingItems.length === 0) {
                expensiveStats.value = {
                    totalEpisodes: 0,
                    averageProgress: 0,
                    completionRate: 0,
                };
                return;
            }

            isComputing.value = true;

            // Expensive computations here
            const totalEpisodes = watchingItems.reduce((sum: number, item: EpisodeProgress) => {
                return sum + (item.totalEpisodes || 0);
            }, 0);

            const totalProgress = watchingItems.reduce((sum: number, item: EpisodeProgress) => {
                const episodes = item.totalEpisodes || 1;
                return sum + item.currentEpisode / episodes;
            }, 0);

            const averageProgress =
                watchingItems.length > 0 ? Math.round((totalProgress / watchingItems.length) * 100) / 100 : 0;

            const completedItems = watchingItems.filter((item: EpisodeProgress) => {
                return item.totalEpisodes && item.currentEpisode >= item.totalEpisodes;
            }).length;

            const completionRate =
                watchingItems.length > 0 ? Math.round((completedItems / watchingItems.length) * 100) : 0;

            expensiveStats.value = {
                totalEpisodes,
                averageProgress,
                completionRate,
            };

            isComputing.value = false;

            console.log("[SmartStats] Expensive computations updated:", expensiveStats.value);
        },
        { throttle: 1000 }, // Only compute expensive stats once per second max
    );

    /**
     * Combined statistics with smart fallback to cache
     */
    const stats = computed((): SmartStats => {
        const basic = basicStats.value;
        const expensive = expensiveStats.value;

        // If we have fresh expensive stats, use them
        if (expensive.totalEpisodes !== undefined) {
            const combined = {
                ...basic,
                ...expensive,
            };

            // Update cache with fresh data
            updateStatsCache(combined);
            return combined;
        }

        // If we have cache and it's not too stale, use it for expensive operations
        if (hasCache.value && !isStale.value) {
            return {
                ...basic,
                totalEpisodes: cachedStats.value.totalEpisodes,
                averageProgress: cachedStats.value.averageProgress,
                completionRate: cachedStats.value.averageProgress > 0.8 ? 80 : 0, // Rough estimate
            };
        }

        // Fallback to basic stats only
        return basic;
    });

    /**
     * Trend analysis with change detection
     */
    const trends = computed((): TrendData => {
        const currentTime = Date.now();
        const timeSinceChange = currentTime - lastChangeTime.value;

        // Simple trend logic based on recent changes
        const watchingTrend: "up" | "down" | "stable" = timeSinceChange < 60000 ? "up" : "stable"; // Recently changed = trending up

        const plannedTrend: "up" | "down" | "stable" = timeSinceChange < 300000 ? "up" : "stable"; // Changed in last 5 min = trending up

        let changeDescription = "";
        if (timeSinceChange < 60000) {
            changeDescription = "Recent activity detected";
        } else if (timeSinceChange < 3600000) {
            changeDescription = "Active in the last hour";
        } else {
            changeDescription = "No recent changes";
        }

        return {
            watchingTrend,
            plannedTrend,
            lastChangeTime: lastChangeTime.value,
            changeDescription,
        };
    });

    /**
     * Performance metrics
     */
    const performance = computed(() => ({
        isComputing: isComputing.value,
        hasCachedData: hasCache.value,
        cacheIsStale: isStale.value,
        lastChange: new Date(lastChangeTime.value),
        usingCache: hasCache.value && !expensiveStats.value.totalEpisodes,
    }));

    return {
        // Core statistics
        stats,
        basicStats,

        // Performance insights
        performance,
        trends,

        // Raw data access
        lastChangeTime: lastChangeTime.value,
    };
}
