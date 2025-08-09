import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

// Shared spies reused across dynamic imports
const setSpy = vi.fn();
const getSpy = vi.fn();

/**
 * Dynamically import the offline queue module after installing fresh mocks.
 * Ensures hydration logic sees the provided stored descriptors and network state.
 */
async function importWithEnv({ stored, online }: { stored: any[] | null; online: boolean }) {
    vi.resetModules();
    setSpy.mockReset();
    getSpy.mockReset();
    const isOnline = ref(online);
    vi.doMock("@vueuse/core", () => ({ useNetwork: () => ({ isOnline }) }));
    vi.doMock("@/commons/adapters/StorageAdapter", () => ({
        StorageAdapter: {
            set: (k: any, v: any) => setSpy(k, v),
            get: async () => stored,
        },
    }));
    vi.doMock("@/options/commons/actionHelpers", () => ({
        runStoreAction: async (cfg: any) => {
            if (cfg && cfg.__forceFail) return { success: false, error: "forced" };
            return { success: true };
        },
    }));
    const mod = await import("@/options/composables/useOfflineQueue");
    return { ...mod, isOnline };
}

describe("offlineQueue persistence & hydration (dynamic imports)", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("persists queued action descriptors via flush helper", async () => {
        const { getOfflineQueue, __resetOfflineQueueForTest, __flushOfflineQueuePersistForTest } = await importWithEnv({
            stored: null,
            online: false,
        });
        __resetOfflineQueueForTest();
        // create singleton instance so flush helper can see it
        const q = getOfflineQueue();
        // enqueue directly using factory (not singleton) still fine, but keep consistent
        // (useOfflineQueue would create a separate non-singleton instance)
        // So use the singleton for enqueueing
        await q.enqueueRunStoreAction(
            { run: async () => ({ success: true }), onOptimistic: () => {} },
            { type: "watching:start", payload: { animeId: "a1" } },
        );
        await __flushOfflineQueuePersistForTest();
        expect(setSpy).toHaveBeenCalledTimes(1);
        const [, descriptors] = setSpy.mock.calls[0];
        expect(Array.isArray(descriptors)).toBe(true);
        expect(descriptors[0].type).toBe("watching:start");
        expect(descriptors[0].optimisticApplied).toBe(true);
    });

    it("hydrates queued descriptors on fresh import", async () => {
        const stored = [
            {
                id: "x1",
                type: "plan:add",
                description: "add plan item",
                createdAt: Date.now(),
                retries: 0,
                maxRetries: 3,
                payload: { animeId: "b2" },
                optimisticApplied: true,
                version: 1,
            },
        ];
        const { getOfflineQueue, registerOfflineAction, __resetOfflineQueueForTest } = await importWithEnv({
            stored,
            online: false,
        });
        __resetOfflineQueueForTest();
        registerOfflineAction(
            "plan:add",
            () => ({ run: async () => ({ success: true }), onOptimistic: undefined }) as any,
        );
        const q = getOfflineQueue();
        await Promise.resolve();
        expect(q.size.value).toBe(1);
        const d = q.getQueuedDescriptors()[0];
        expect(d.type).toBe("plan:add");
        expect(d.payload).toEqual({ animeId: "b2" });
    });

    it("drops failing action after exceeding retries", async () => {
        const { getOfflineQueue, __resetOfflineQueueForTest, isOnline } = await importWithEnv({
            stored: null,
            online: false,
        });
        __resetOfflineQueueForTest();
        const q = getOfflineQueue();
        q.config.baseBackoffMs.value = 0;
        q.config.jitterMaxMs.value = 0;
        await q.enqueueRunStoreAction({ run: async () => ({ success: true }), __forceFail: true } as any, {
            type: "watching:inc",
            maxRetries: 1,
        });
        expect(q.size.value).toBe(1);
        isOnline.value = true; // allow processing attempts
        await q.processQueue();
        if (q.size.value === 1) await q.processQueue(); // second attempt triggers drop (retries>maxRetries)
        expect(q.droppedCount.value).toBeGreaterThanOrEqual(1);
        expect(q.size.value).toBe(0);
    });

    it("reports stats after successful processing", async () => {
        const { getOfflineQueue, __resetOfflineQueueForTest, isOnline } = await importWithEnv({
            stored: null,
            online: false,
        });
        __resetOfflineQueueForTest();
        const q = getOfflineQueue();
        await q.enqueueRunStoreAction({ run: async () => ({ success: true }) }, { type: "hidden:hide" });
        isOnline.value = true;
        await q.processQueue();
        const stats = q.getQueueStats();
        expect(stats.size).toBe(0);
        expect(stats.processed).toBe(1);
        expect(stats.dropped).toBe(0);
        expect(stats.totalEnqueued).toBe(1);
    });
});
