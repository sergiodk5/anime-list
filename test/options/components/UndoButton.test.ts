// Mock must be declared before importing component (hoisting requirement)
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";

vi.mock("@/options/commons/undoManager", () => {
    const entries = ref<any[]>([]);
    const canUndo = ref(false);
    function syncCanUndo() {
        canUndo.value = entries.value.length > 0;
    }
    return {
        useUndoStack: () => ({ entries, canUndo }),
        undoLast: vi.fn(() => {
            if (entries.value.length > 0) {
                entries.value.pop();
            }
            syncCanUndo();
            return true;
        }),
        // Test helper: set stack to exactly n entries (reset first)
        __pushTest: (n: number) => {
            entries.value = [];
            for (let i = 0; i < n; i++) entries.value.push({ id: String(i) });
            syncCanUndo();
        },
    };
});

import UndoButton from "@/options/components/UndoButton.vue";
import { mount } from "@vue/test-utils";

// Capture reference to mocked helper (defined inside vi.mock factory closure)
// We recreate a lightweight local wrapper that re-invokes the mock's __pushTest via dynamic import of the module under test.
async function pushTest(count: number) {
    const mod: any = await import("@/options/commons/undoManager");
    if (mod.__pushTest) mod.__pushTest(count);
}

describe("UndoButton", () => {
    beforeEach(async () => {
        await pushTest(0);
    });

    it("does not render when no undo available", () => {
        const wrapper = mount(UndoButton);
        expect(wrapper.find('[data-testid="undo-button"]').exists()).toBe(false);
    });

    it("renders and shows count", async () => {
        await pushTest(3);
        const wrapper = mount(UndoButton);
        wrapper.get('[data-testid="undo-button"]');
        expect(wrapper.get('[data-testid="undo-count"]').text()).toBe("3");
    });

    it("calls undoLast on click", async () => {
        await pushTest(1);
        const wrapper = mount(UndoButton);
        const btn = wrapper.get('[data-testid="undo-button"]');
        await btn.trigger("click");
        await nextTick();
        // After undo, should disappear
        expect(wrapper.find('[data-testid="undo-button"]').exists()).toBe(false);
    });
});
