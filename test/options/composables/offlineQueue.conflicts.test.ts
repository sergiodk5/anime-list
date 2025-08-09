import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

// Mock network offline by default
vi.mock("@vueuse/core", () => {
    const isOnline = ref(false);
    return { useNetwork: () => ({ isOnline }) };
});

// Track runStoreAction invocations (accept config arg to satisfy call signature in wrapper)
// Mock without params; call sites may pass config which is ignored
const runStoreActionMock = vi.fn(async () => ({ success: true }));
vi.mock("@/options/commons/actionHelpers", () => ({
    runStoreAction: () => runStoreActionMock(),
}));

import type { StoreActionConfig } from "@/options/commons/actionHelpers";
import { registerOfflineAction, useOfflineQueue } from "@/options/composables/useOfflineQueue";
import { useNetwork } from "@vueuse/core";

// Helper builder registration for test
registerOfflineAction("test:conflictSkip", () => {
    const config: StoreActionConfig = { run: async () => ({ success: true }) } as any;
    return {
        config,
        // Always invalidate so it should be dropped before run
        validate: () => false,
    };
});

registerOfflineAction("test:validRun", () => {
    const config: StoreActionConfig = { run: async () => ({ success: true }) } as any;
    return {
        config,
        validate: () => true,
    };
});

describe("offlineQueue conflict validation", () => {
    let queue: ReturnType<typeof useOfflineQueue>;
    let network: ReturnType<typeof useNetwork>;

    beforeEach(() => {
        runStoreActionMock.mockClear();
        queue = useOfflineQueue();
        network = useNetwork();
        (network.isOnline as any).value = false;
    });

    it("skips and drops action when validate() returns false", async () => {
        // Enqueue while offline
        await queue.enqueueRunStoreAction({ run: async () => ({ success: true }) } as any, {
            type: "test:conflictSkip",
        });
        expect(queue.size.value).toBe(1);
        // Go online and process
        (network.isOnline as any).value = true;
        await queue.processQueue();
        expect(queue.size.value).toBe(0);
        // Dropped due to conflict (count increments)
        expect(queue.droppedCount.value).toBe(1);
        // Should NOT invoke runStoreAction because validate blocked it
        expect(runStoreActionMock).not.toHaveBeenCalled();
    });

    it("executes action when validate() returns true", async () => {
        await queue.enqueueRunStoreAction({ run: async () => ({ success: true }) } as any, {
            type: "test:validRun",
        });
        (network.isOnline as any).value = true;
        await queue.processQueue();
        expect(queue.processedCount.value).toBe(1);
        expect(runStoreActionMock).toHaveBeenCalledTimes(1);
    });

    it("mixed queue processes valid and drops invalid", async () => {
        await queue.enqueueRunStoreAction({ run: async () => ({ success: true }) } as any, {
            type: "test:conflictSkip",
        });
        await queue.enqueueRunStoreAction({ run: async () => ({ success: true }) } as any, {
            type: "test:validRun",
        });
        (network.isOnline as any).value = true;
        await queue.processQueue();
        expect(queue.droppedCount.value).toBe(1);
        expect(queue.processedCount.value).toBe(1);
        expect(runStoreActionMock).toHaveBeenCalledTimes(1);
        expect(queue.size.value).toBe(0);
    });
});
