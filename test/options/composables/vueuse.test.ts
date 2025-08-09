import { useSmartStats } from "@/options/composables/useSmartStats";
import { useStorageCache } from "@/options/composables/useStorageCache";
import { useVisibilityAwareUpdates } from "@/options/composables/useVisibilityAwareUpdates";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

// Mock store composables that the VueUse composables depend on
vi.mock("@/options/stores/watchingStore", () => ({
    useWatchingStore: () => ({
        items: [],
        refreshFromStorage: vi.fn(),
    }),
}));

vi.mock("@/options/stores/planToWatchStore", () => ({
    usePlanToWatchStore: () => ({
        items: [],
        refreshFromStorage: vi.fn(),
    }),
}));

vi.mock("@/options/stores/hiddenStore", () => ({
    useHiddenStore: () => ({
        items: [],
        refreshFromStorage: vi.fn(),
    }),
}));

describe("VueUse Composables", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Use fake timers only for these specific tests
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Properly clean up timers
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    describe("useVisibilityAwareUpdates", () => {
        it("should initialize without hanging", () => {
            const result = useVisibilityAwareUpdates();

            expect(result).toBeDefined();
            expect(typeof result.isActive.value).toBe("boolean");
            expect(typeof result.pause).toBe("function");
            expect(typeof result.resume).toBe("function");
        });

        it("should handle timer progression", async () => {
            const { isActive, pause, resume, intervalActive } = useVisibilityAwareUpdates();

            // Initially active based on visibility
            expect(isActive.value).toBe(true);

            // Calling pause directly affects the interval
            pause();
            expect(intervalActive.value).toBe(false);

            // Resume should reactivate the interval
            resume();
            expect(intervalActive.value).toBe(true);

            // Fast forward time to test interval
            vi.advanceTimersByTime(60000); // 60 seconds
            await nextTick();
        });
    });

    describe("useStorageCache", () => {
        it("should initialize cache system", () => {
            const cache = useStorageCache();

            expect(cache).toBeDefined();
            expect(cache.cachedStats).toBeDefined();
            expect(typeof cache.updateStatsCache).toBe("function");
            expect(typeof cache.hasCache.value).toBe("boolean");
            expect(typeof cache.isStale.value).toBe("boolean");
        });

        it("should handle cache operations", () => {
            const cache = useStorageCache();

            // Test basic cache availability
            expect(cache.cachedStats).toBeDefined();
            expect(cache.cachedStats.value).toBeDefined();
        });
    });

    describe("useSmartStats", () => {
        it("should initialize without hanging on throttled watches", async () => {
            const stats = useSmartStats();

            expect(stats).toBeDefined();
            expect(stats.stats).toBeDefined();
            expect(stats.basicStats).toBeDefined();
            expect(stats.performance).toBeDefined();

            // Advance timers to ensure throttled operations complete
            vi.advanceTimersByTime(2000);
            await nextTick();

            // Should not hang or throw errors
            expect(true).toBe(true);
        });

        it("should provide reactive statistics", async () => {
            const { stats, basicStats, performance } = useSmartStats();

            // Initial values should be defined
            expect(stats.value).toBeDefined();
            expect(basicStats.value).toBeDefined();
            expect(performance.value).toBeDefined();

            expect(typeof stats.value.watching).toBe("number");
            expect(typeof stats.value.planned).toBe("number");
            expect(typeof stats.value.hidden).toBe("number");

            // Fast forward to allow throttled computations
            vi.advanceTimersByTime(2000);
            await nextTick();
        });
    });
});
