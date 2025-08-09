import { StorageAdapter } from "@/commons/adapters/StorageAdapter";
import { runStoreAction, type StoreActionConfig } from "@/options/commons/actionHelpers";
import type { StoreActionResult } from "@/options/stores/types";
import { useNetwork } from "@vueuse/core";
import { computed, ref, watch } from "vue";

export interface QueuedOfflineAction {
    id: string;
    type: string;
    description?: string;
    createdAt: number;
    retries: number;
    maxRetries: number;
    run: () => Promise<StoreActionResult>;
    payload?: any; // serialized payload for persistence
    /** Whether we already applied the optimistic mutation locally */
    optimisticApplied?: boolean;
    /** Optional conflict validator: return false to drop immediately (no retries) */
    validate?: () => boolean;
}

export interface EnqueueOptions {
    type: string;
    description?: string;
    maxRetries?: number;
}

/**
 * Offline queue composable (Phase 7.3)
 * - Queues store actions while offline
 * - Replays sequentially when connection restored
 * - Reuses runStoreAction abstraction for uniform behavior
 */
export function useOfflineQueue() {
    const { isOnline } = useNetwork();
    const queue = ref<QueuedOfflineAction[]>([]);
    const isProcessing = ref(false);
    const lastError = ref<string | null>(null);
    const processedCount = ref(0);
    const droppedCount = ref(0);
    const totalEnqueued = ref(0);
    const totalProcessingTimeMs = ref(0);
    const lastProcessStartedAt = ref<number | null>(null);

    // Configurable parameters (could be injected later)
    const baseBackoffMs = ref(150);
    const jitterMaxMs = ref(50);
    const maxQueueSize = ref(100);
    const overflowPolicy = ref<"dropOldest" | "rejectNew">("dropOldest");

    const PERSIST_KEY = "__offlineQueue__";
    let persistPending = false;

    async function persistQueue() {
        try {
            const descriptors = queue.value.map((a) => ({
                id: a.id,
                type: a.type,
                description: a.description,
                createdAt: a.createdAt,
                retries: a.retries,
                maxRetries: a.maxRetries,
                payload: a.payload,
                optimisticApplied: a.optimisticApplied ?? false,
                version: 1,
            }));
            await StorageAdapter.set(PERSIST_KEY, descriptors);
        } catch (e) {
            console.warn("OfflineQueue persist failure", e);
        }
    }

    function schedulePersist() {
        if (persistPending) return;
        persistPending = true;
        setTimeout(() => {
            persistPending = false;
            void persistQueue();
        }, 60);
    }

    function enqueueAction(action: QueuedOfflineAction) {
        if (queue.value.length >= maxQueueSize.value) {
            if (overflowPolicy.value === "dropOldest") {
                queue.value.shift();
            } else {
                // reject new: simply do not enqueue
                return;
            }
        }
        queue.value.push(action);
        totalEnqueued.value += 1;
        schedulePersist();
    }

    function enqueueRunStoreAction<T = any>(
        config: StoreActionConfig<T>,
        opts: EnqueueOptions & { payload?: any },
    ): Promise<StoreActionResult> {
        if (isOnline.value) {
            return runStoreAction({ ...config });
        }
        // Execute optimistic update immediately (if provided) and create a queued action that omits the optimistic step
        if (config.onOptimistic) {
            try {
                config.onOptimistic();
            } catch (e) {
                // ignore optimistic failures – shouldn't block queuing
                console.warn("Offline optimistic update failed", e);
            }
        }
        const queuedConfig: StoreActionConfig<T> = { ...config, onOptimistic: undefined };
        return new Promise<StoreActionResult>((resolve) => {
            // If a registry builder exists, use its validate for immediate conflict detection too
            const builder = actionRegistry[opts.type];
            let validate: (() => boolean) | undefined;
            if (builder) {
                try {
                    const built = builder(opts.payload);
                    validate = built.validate;
                } catch (e) {
                    console.warn("OfflineQueue builder validate resolve failed", e);
                }
            }
            const action: QueuedOfflineAction = {
                id: crypto.randomUUID(),
                type: opts.type,
                description: opts.description,
                createdAt: Date.now(),
                retries: 0,
                maxRetries: opts.maxRetries ?? 3,
                run: async () => runStoreAction({ ...queuedConfig }),
                payload: opts.payload,
                optimisticApplied: true,
                validate,
            };
            enqueueAction(action);
            resolve({ success: true });
        });
    }

    async function processQueue(): Promise<void> {
        if (isProcessing.value || !isOnline.value || queue.value.length === 0) return;
        isProcessing.value = true;
        lastError.value = null;
        lastProcessStartedAt.value = performance.now();
        try {
            while (queue.value.length > 0 && isOnline.value) {
                const action = queue.value[0];
                // Conflict detection pre-flight
                if (action.validate && !action.validate()) {
                    // Drop silently but record metric
                    droppedCount.value += 1;
                    queue.value.shift();
                    lastError.value = `Conflict skipped action ${action.type}`;
                    schedulePersist();
                    continue; // move to next
                }
                try {
                    const result = await action.run();
                    if (!result.success) throw new Error(result.error || "Unknown offline action failure");
                    processedCount.value += 1;
                    queue.value.shift();
                    schedulePersist();
                } catch (err) {
                    action.retries += 1;
                    if (action.retries > action.maxRetries) {
                        droppedCount.value += 1;
                        queue.value.shift();
                        lastError.value = `Dropped action ${action.type} after ${action.maxRetries} retries`;
                        schedulePersist();
                    } else {
                        // Backoff with jitter
                        const base = baseBackoffMs.value * action.retries;
                        const jitter = Math.floor(Math.random() * jitterMaxMs.value);
                        await new Promise((r) => setTimeout(r, base + jitter));
                    }
                }
            }
        } finally {
            isProcessing.value = false;
            if (lastProcessStartedAt.value != null) {
                totalProcessingTimeMs.value += performance.now() - lastProcessStartedAt.value;
                lastProcessStartedAt.value = null;
            }
        }
    }

    function buildActionFromDescriptor(d: any): QueuedOfflineAction | null {
        if (!d || !d.id || !d.type) return null;
        const builder = actionRegistry[d.type];
        if (!builder) return null;
        const reconstructed = builder(d.payload);
        const reconstructedConfig = reconstructed.config;
        const validate = reconstructed.validate;
        return {
            id: d.id,
            type: d.type,
            description: d.description,
            createdAt: d.createdAt,
            retries: d.retries || 0,
            maxRetries: d.maxRetries || 3,
            payload: d.payload,
            optimisticApplied: d.optimisticApplied ?? false,
            run: () => runStoreAction(reconstructedConfig),
            validate,
        };
    }

    async function hydrateQueue() {
        try {
            const stored = await StorageAdapter.get<any[]>(PERSIST_KEY);
            if (!stored || queue.value.length > 0) return;
            stored.forEach((d) => {
                const action = buildActionFromDescriptor(d);
                if (action) queue.value.push(action);
            });
        } catch (e) {
            console.warn("OfflineQueue hydrate failure", e);
        }
    }

    void hydrateQueue();

    watch(isOnline, (online) => {
        if (online) {
            setTimeout(() => processQueue(), 400);
        }
    });

    return {
        queue: computed(() => queue.value),
        size: computed(() => queue.value.length),
        isProcessing: computed(() => isProcessing.value),
        isOnline,
        lastError: computed(() => lastError.value),
        processedCount: computed(() => processedCount.value),
        droppedCount: computed(() => droppedCount.value),
        totalEnqueued: computed(() => totalEnqueued.value),
        avgProcessingSessionMs: computed(() => {
            // approximate average per processed action in sessions
            const actionsDone = processedCount.value + droppedCount.value;
            return actionsDone === 0 ? 0 : Math.round(totalProcessingTimeMs.value / actionsDone);
        }),
        config: {
            baseBackoffMs,
            jitterMaxMs,
            maxQueueSize,
            overflowPolicy,
        },
        getQueueStats: () => ({
            size: queue.value.length,
            processed: processedCount.value,
            dropped: droppedCount.value,
            totalEnqueued: totalEnqueued.value,
            avgProcessingSessionMs:
                processedCount.value + droppedCount.value === 0
                    ? 0
                    : Math.round(totalProcessingTimeMs.value / (processedCount.value + droppedCount.value)),
        }),
        /** Lightweight descriptors for UI / debugging without exposing run functions */
        getQueuedDescriptors: () =>
            queue.value.map((a) => ({
                id: a.id,
                type: a.type,
                description: a.description,
                createdAt: a.createdAt,
                retries: a.retries,
                maxRetries: a.maxRetries,
                payload: a.payload,
                optimisticApplied: a.optimisticApplied ?? false,
            })),
        enqueueRunStoreAction,
        processQueue,
        persistQueue,
        hydrateQueue,
    };
}

// Singleton accessor so all stores share one queue instance
let _offlineQueueInstance: ReturnType<typeof useOfflineQueue> | null = null;
export function getOfflineQueue() {
    if (!_offlineQueueInstance) {
        _offlineQueueInstance = useOfflineQueue();
    }
    return _offlineQueueInstance;
}

// Action registry for persistence reconstruction
interface ActionBuilderResult {
    config: StoreActionConfig<any>;
    validate?: () => boolean;
}
type ActionBuilder = (payload: any) => ActionBuilderResult;
export const actionRegistry: Record<string, ActionBuilder> = {};
export function registerOfflineAction(type: string, builder: ActionBuilder) {
    actionRegistry[type] = builder;
}

// Test-only helper to reset singleton (avoid leaking state between unit tests)
// Not intended for production code paths.
export function __resetOfflineQueueForTest() {
    _offlineQueueInstance = null;
}

// Force an immediate persistence (used in tests to avoid waiting for debounce)
export async function __flushOfflineQueuePersistForTest() {
    if (_offlineQueueInstance) {
        await (_offlineQueueInstance as any).persistQueue();
    }
}
