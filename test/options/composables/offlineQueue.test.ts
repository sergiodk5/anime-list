import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

vi.mock("@vueuse/core", () => {
    const isOnline = ref(false);
    return { useNetwork: () => ({ isOnline }) };
});

vi.mock("@/options/commons/actionHelpers", () => ({
    runStoreAction: vi.fn(async (config: any) => {
        if (config.failAlways) return { success: false, error: "forced" };
        return { success: true };
    }),
}));

import { runStoreAction } from "@/options/commons/actionHelpers";
import { useOfflineQueue } from "@/options/composables/useOfflineQueue";
import { useNetwork } from "@vueuse/core";

describe("useOfflineQueue", () => {
    let queue: ReturnType<typeof useOfflineQueue>;
    let network: ReturnType<typeof useNetwork>;

    beforeEach(() => {
        queue = useOfflineQueue();
        network = useNetwork();
        (network.isOnline as any).value = false;
    });

    it("enqueues while offline and processes when online", async () => {
        await queue.enqueueRunStoreAction({ run: async () => ({ success: true }) }, { type: "increment" });
        expect(queue.size.value).toBe(1);
        (network.isOnline as any).value = true;
        await queue.processQueue();
        expect(queue.size.value).toBe(0);
        expect(queue.processedCount.value).toBe(1);
    });

    it("retries then drops after exceeding max retries", async () => {
        (runStoreAction as any).mockImplementation(async (cfg: any) => {
            if (cfg.__forceFail) return { success: false, error: "forced" };
            return { success: true };
        });
        await queue.enqueueRunStoreAction({ run: async () => ({ success: true }), __forceFail: true } as any, {
            type: "fail",
            maxRetries: 1,
        });
        expect(queue.size.value).toBe(1);
        (network.isOnline as any).value = true;
        await queue.processQueue();
        expect(queue.droppedCount.value).toBeGreaterThanOrEqual(1);
    });
});
