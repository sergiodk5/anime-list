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

describe("offlineQueue descriptors", () => {
    let q: ReturnType<typeof useOfflineQueue>;

    beforeEach(() => {
        q = useOfflineQueue();
        (q.isOnline as any).value = false;
    });

    it("includes optimisticApplied flag and payload in descriptors", async () => {
        await q.enqueueRunStoreAction(
            { run: async () => ({ success: true }), onOptimistic: () => {} },
            {
                type: "testAction",
                payload: { value: 42 },
            },
        );
        const desc = q.getQueuedDescriptors();
        expect(desc.length).toBe(1);
        expect(desc[0].type).toBe("testAction");
        expect(desc[0].payload).toEqual({ value: 42 });
        expect(desc[0].optimisticApplied).toBe(true);
    });
});
