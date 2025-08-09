import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

vi.mock("@vueuse/core", () => {
    const isOnline = { value: false };
    return { useNetwork: () => ({ isOnline }), __isOnlineRef: isOnline };
});

// Mock toast
vi.mock("vue-toastification", () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

// Mock offline queue composable
const queueState = {
    queue: { value: [] as any[] },
    size: { value: 0 },
    isProcessing: { value: false },
    isOnline: { value: false },
    lastError: { value: null },
    processedCount: { value: 0 },
    droppedCount: { value: 0 },
    enqueueRunStoreAction: vi.fn(),
    processQueue: vi.fn(async () => {
        queueState.isProcessing.value = true;
        // simulate processing all
        queueState.queue.value = [];
        queueState.size.value = 0;
        queueState.processedCount.value += 2;
        queueState.isProcessing.value = false;
    }),
    persistQueue: vi.fn(),
    hydrateQueue: vi.fn(),
};

vi.mock("@/options/composables", () => ({ getOfflineQueue: () => queueState }));

import OfflineQueueBadge from "@/options/components/OfflineQueueBadge.vue";
import { useNetwork } from "@vueuse/core";

describe("OfflineQueueBadge", () => {
    beforeEach(() => {
        queueState.queue.value = [
            { id: "1", description: "Action 1", type: "test", createdAt: Date.now(), retries: 0 },
            { id: "2", description: "Action 2", type: "test", createdAt: Date.now(), retries: 1 },
        ];
        queueState.size.value = 2;
        queueState.processedCount.value = 0;
        queueState.droppedCount.value = 0;
    });

    it("renders badge with queued count while offline", () => {
        const wrapper = mount(OfflineQueueBadge);
        const badge = wrapper.get('[data-testid="offline-queue-badge"]');
        expect(badge.text()).toContain("Offline");
        const count = wrapper.get('[data-testid="offline-queue-count"]');
        expect(count.text()).toBe("2");
    });

    it("opens panel and lists queued items", async () => {
        const wrapper = mount(OfflineQueueBadge);
        await wrapper.get('[data-testid="offline-queue-badge"]').trigger("click");
        const panel = wrapper.get('[data-testid="offline-queue-panel"]');
        expect(panel.text()).toContain("Offline Queue");
        expect(panel.text()).toContain("Action 1");
        expect(panel.text()).toContain("Action 2");
    });

    it("processes queue when clicking Process Now (if online simulated)", async () => {
        // Switch network to online via mocked ref
        (useNetwork().isOnline as any).value = true;
        queueState.queue.value = [
            { id: "1", description: "Action 1", type: "test", createdAt: Date.now(), retries: 0 },
        ];
        queueState.size.value = 1;
        (queueState.processQueue as any).mockClear();
        const wrapper = mount(OfflineQueueBadge);
        await nextTick();
        await wrapper.get('[data-testid="offline-queue-badge"]').trigger("click");
        await wrapper.get('[data-testid="offline-queue-retry"]').trigger("click");
        expect(queueState.processQueue).toHaveBeenCalledTimes(1);
    });
});
