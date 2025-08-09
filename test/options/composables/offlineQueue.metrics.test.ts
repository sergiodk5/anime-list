import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

vi.mock("@vueuse/core", () => {
    const isOnline = ref(false);
    return { useNetwork: () => ({ isOnline }) };
});

vi.mock("@/options/commons/actionHelpers", () => ({
    runStoreAction: vi.fn(async () => ({ success: true })),
}));

import { useOfflineQueue } from "@/options/composables/useOfflineQueue";

// Mock StorageAdapter minimal surface
vi.mock("@/commons/adapters/StorageAdapter", () => ({ StorageAdapter: { set: vi.fn(), get: vi.fn() } }));

describe("offlineQueue metrics & config", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("applies maxQueueSize with dropOldest policy", async () => {
        const q = useOfflineQueue();
        q.config.maxQueueSize.value = 3;
        q.config.overflowPolicy.value = "dropOldest";
        for (let i = 0; i < 5; i++) {
            await q.enqueueRunStoreAction({ run: async () => ({ success: true }) } as any, { type: "t" + i });
        }
        expect(q.size.value).toBe(3);
    });

    it("rejects new when overflowPolicy=rejectNew", async () => {
        const q = useOfflineQueue();
        q.config.maxQueueSize.value = 2;
        q.config.overflowPolicy.value = "rejectNew";
        await q.enqueueRunStoreAction({ run: async () => ({ success: true }) } as any, { type: "a" });
        await q.enqueueRunStoreAction({ run: async () => ({ success: true }) } as any, { type: "b" });
        await q.enqueueRunStoreAction({ run: async () => ({ success: true }) } as any, { type: "c" });
        expect(q.size.value).toBe(2);
    });
});
