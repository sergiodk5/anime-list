import { StorageKeys } from "@/commons/models";
import { useDebounceFn } from "@vueuse/core";
import type { PiniaPluginContext } from "pinia";

/**
 * Pinia plugin for synchronizing store state with Chrome storage and runtime messages
 *
 * Phase 5: Implements cross-context synchronization:
 * - Monitors Chrome storage changes from content script/popup
 * - Debounces rapid updates to prevent UI thrash
 * - Prevents sync loops with write origin tagging
 * - Triggers store re-initialization when relevant data changes
 */

// Track plugin-originated writes to prevent sync loops
let isPluginWrite = false;

// Debounce configuration (VueUse powered)
const DEBOUNCE_DELAY = 100; // 100ms debounce for batching updates
const pendingUpdates = new Set<StorageKeys>();
let debouncedHandler: ((stores: Map<string, any>) => void) | undefined;

/**
 * Debounced handler for storage changes
 */
function handleStorageChanges(stores: Map<string, any>): void {
    if (pendingUpdates.size === 0) return;

    console.log(`[StorageSyncPlugin] Processing batched updates for: ${Array.from(pendingUpdates).join(", ")}`);

    // Process each pending update
    for (const storageKey of pendingUpdates) {
        switch (storageKey) {
            case StorageKeys.EPISODE_PROGRESS: {
                // Trigger watching store refresh from storage
                const watchingStore = stores.get("watching");
                if (watchingStore && watchingStore.refreshFromStorage) {
                    watchingStore.refreshFromStorage();
                }
                break;
            }

            case StorageKeys.PLAN_TO_WATCH: {
                // Trigger plan to watch store refresh from storage
                const planStore = stores.get("planToWatch");
                if (planStore && planStore.refreshFromStorage) {
                    planStore.refreshFromStorage();
                }
                break;
            }

            case StorageKeys.HIDDEN_ANIME: {
                // Trigger hidden store refresh from storage
                const hiddenStore = stores.get("hidden");
                if (hiddenStore && hiddenStore.refreshFromStorage) {
                    hiddenStore.refreshFromStorage();
                }
                break;
            }

            default:
                console.log(`[StorageSyncPlugin] Ignoring unknown storage key: ${storageKey}`);
                break;
        }
    }

    // Clear pending updates
    pendingUpdates.clear();
}

/**
 * Queue a storage update for debounced processing
 */
function queueStorageUpdate(storageKey: StorageKeys, stores: Map<string, any>): void {
    pendingUpdates.add(storageKey);
    if (!debouncedHandler) {
        debouncedHandler = useDebounceFn((s: Map<string, any>) => handleStorageChanges(s), DEBOUNCE_DELAY, {
            maxWait: 500,
        });
    }
    debouncedHandler(stores);
}

/**
 * Chrome storage change listener
 */
function onStorageChanged(
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: chrome.storage.AreaName,
    stores: Map<string, any>,
): void {
    // Only handle local storage changes
    if (areaName !== "local") return;

    // Ignore changes originated by this plugin to prevent sync loops
    if (isPluginWrite) {
        console.log("[StorageSyncPlugin] Ignoring plugin-originated write");
        return;
    }

    // Check if any monitored keys changed
    const relevantChanges: StorageKeys[] = [];

    for (const [key, change] of Object.entries(changes)) {
        if (Object.values(StorageKeys).includes(key as StorageKeys)) {
            console.log(`[StorageSyncPlugin] Detected change in ${key}:`, {
                oldValue: change.oldValue ? "present" : "empty",
                newValue: change.newValue ? "present" : "empty",
            });
            relevantChanges.push(key as StorageKeys);
        }
    }

    // Queue updates for relevant changes
    for (const storageKey of relevantChanges) {
        queueStorageUpdate(storageKey, stores);
    }
}

/**
 * Runtime message handler for cross-context communication
 */
function onMessage(message: any, sender: chrome.runtime.MessageSender, stores: Map<string, any>): void {
    // Handle anime state change messages from content script
    if (message.type === "ANIME_STATE_CHANGED" && message.storageKey) {
        console.log(`[StorageSyncPlugin] Received anime state change message:`, message);

        const storageKey = message.storageKey as StorageKeys;
        if (Object.values(StorageKeys).includes(storageKey)) {
            queueStorageUpdate(storageKey, stores);
        }
    }
}

/**
 * Main plugin function - sets up Chrome extension event listeners
 */
export function storageSyncPlugin(context: PiniaPluginContext): void {
    const { store } = context;

    // Static registry of all stores for cross-store updates
    if (!window.__piniaStoreRegistry) {
        window.__piniaStoreRegistry = new Map();
    }

    const storeRegistry = window.__piniaStoreRegistry as Map<string, any>;

    // Register this store in the global registry
    if (store.$id) {
        storeRegistry.set(store.$id, store);
    }

    // Set up Chrome extension listeners (only once for the first store)
    if (storeRegistry.size === 1) {
        console.log("[StorageSyncPlugin] Setting up Chrome extension listeners");

        // Chrome storage change listener
        if (chrome && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((changes, areaName) => {
                onStorageChanged(changes, areaName, storeRegistry);
            });
        }

        // Chrome runtime message listener
        if (chrome && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message, sender) => {
                onMessage(message, sender, storeRegistry);
                return false; // Not async, no response needed
            });
        }
    } // Hook into store actions to tag plugin writes
    store.$onAction(({ name, after, onError }) => {
        // Mark writes as plugin-originated during store actions
        if (
            [
                "startWatching",
                "stopWatching",
                "addToPlan",
                "removeFromPlan",
                "hide",
                "unhide",
                "clearAllHidden",
            ].includes(name)
        ) {
            isPluginWrite = true;

            after(() => {
                // Clear plugin write flag after action completes
                setTimeout(() => {
                    isPluginWrite = false;
                }, 50); // Short delay to ensure storage write completes
            });

            onError(() => {
                // Clear plugin write flag on error
                isPluginWrite = false;
            });
        }
    });
}

// Global type declaration for store registry
declare global {
    interface Window {
        __piniaStoreRegistry?: Map<string, any>;
    }
}
