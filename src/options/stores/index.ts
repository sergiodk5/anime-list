import { createPinia, type Pinia } from "pinia";
import type { App } from "vue";

import { storageSyncPlugin } from "@/options/stores/plugins/storageSyncPlugin";
import { undoPlugin } from "@/options/stores/plugins/undoPlugin";

/**
 * Creates and configures a Pinia instance for the Options app
 *
 * @returns Configured Pinia instance with all necessary plugins
 */
export function createPiniaApp(): Pinia {
    const pinia = createPinia();

    // Register the storage sync plugin (no-op for Phase 1)
    pinia.use(storageSyncPlugin);
    pinia.use(undoPlugin);

    return pinia;
}

/**
 * Helper function to setup Pinia with the Options Vue app
 *
 * @param app Vue app instance
 */
export function setupPinia(app: App): void {
    const pinia = createPiniaApp();
    app.use(pinia);
}

// Export types for store implementations
export * from "@/options/stores/types";

// Export stores
export * from "@/options/stores/hiddenStore";
export * from "@/options/stores/planToWatchStore";
export * from "@/options/stores/watchingStore";
