import { useHiddenStore } from "@/options/stores/hiddenStore";
import { usePlanToWatchStore } from "@/options/stores/planToWatchStore";
import { useWatchingStore } from "@/options/stores/watchingStore";
import { useDocumentVisibility, useIntervalFn } from "@vueuse/core";
import { ref, watch } from "vue";

/**
 * Composable for visibility-aware background updates
 * Phase 7.1: VueUse Integration - Document Visibility & Performance
 *
 * Pauses periodic refreshes when tab is hidden to save battery and CPU
 * Resumes refreshes when tab becomes visible
 */
export function useVisibilityAwareUpdates() {
    const visibility = useDocumentVisibility();
    const isActive = ref(false);

    // Get store instances
    const watchingStore = useWatchingStore();
    const planStore = usePlanToWatchStore();
    const hiddenStore = useHiddenStore();

    // Refresh function that updates all stores
    const refreshAllStores = async () => {
        if (visibility.value !== "visible") {
            console.log("[VisibilityUpdates] Skipping refresh - tab not visible");
            return;
        }

        console.log("[VisibilityUpdates] Performing background refresh");
        try {
            await Promise.all([
                watchingStore.refreshFromStorage(),
                planStore.refreshFromStorage(),
                hiddenStore.refreshFromStorage(),
            ]);
            console.log("[VisibilityUpdates] Background refresh completed");
        } catch (error) {
            console.error("[VisibilityUpdates] Background refresh failed:", error);
        }
    };

    // Set up interval that respects visibility
    const {
        pause,
        resume,
        isActive: intervalActive,
    } = useIntervalFn(
        refreshAllStores,
        60000, // 60 seconds
        { immediate: false, immediateCallback: false },
    );

    // Watch visibility changes and control interval accordingly
    watch(
        visibility,
        (newVisibility) => {
            console.log(`[VisibilityUpdates] Visibility changed: ${newVisibility}`);

            if (newVisibility === "visible") {
                // Tab became visible - resume updates and do immediate refresh
                if (!intervalActive.value) {
                    resume();
                    isActive.value = true;

                    // Perform immediate refresh when tab becomes visible
                    setTimeout(refreshAllStores, 500); // Small delay to ensure tab is fully loaded
                }
            } else {
                // Tab became hidden - pause updates
                if (intervalActive.value) {
                    pause();
                    isActive.value = false;
                }
            }
        },
        { immediate: true },
    );

    // Manual refresh function for components
    const forceRefresh = async () => {
        console.log("[VisibilityUpdates] Force refresh requested");
        await refreshAllStores();
    };

    // Cleanup function
    const cleanup = () => {
        pause();
        isActive.value = false;
    };

    return {
        visibility,
        isActive,
        intervalActive,
        forceRefresh,
        cleanup,
        pause,
        resume,
    };
}
