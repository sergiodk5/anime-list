import { __enableUndoForTests, __resetUndoForTests, useUndoStack } from "@/options/commons/undoManager";
import { createPiniaApp } from "@/options/stores";
import { defineStore, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick, ref } from "vue";

// Dummy store (setup style) with tracked and untracked actions plus snapshot/restore
const useDummyStore = defineStore("dummyUndo", () => {
    const count = ref(0);
    function startWatching() {
        count.value++;
    }
    function hide() {
        // no mutation
    }
    function notTracked() {
        count.value++;
    }
    function __snapshot() {
        return { count: count.value };
    }
    function __restore(snap: any) {
        count.value = snap.count;
    }
    return { count, startWatching, hide, notTracked, __snapshot, __restore };
});

describe("undoPlugin auto registration", () => {
    beforeEach(() => {
        __resetUndoForTests();
        const pinia = createPiniaApp();
        setActivePinia(pinia);
        __enableUndoForTests();
    });

    it("skips registering undo when snapshot unchanged", async () => {
        const store = useDummyStore();
        store.hide();
        await nextTick();
        await new Promise((r) => setTimeout(r, 0));
        const { entries } = useUndoStack();
        expect(entries.value.length).toBe(0);
    });

    it("does not register undo for untracked action even if state changes", async () => {
        const store = useDummyStore();
        store.notTracked();
        await nextTick();
        await new Promise((r) => setTimeout(r, 0));
        const { entries } = useUndoStack();
        expect(entries.value.length).toBe(0);
    });

    it("skips registering when undo disabled at runtime", async () => {
        const store = useDummyStore();
        // reset to disabled state AFTER plugin already attached listeners
        __resetUndoForTests();
        store.startWatching();
        await nextTick();
        await new Promise((r) => setTimeout(r, 0));
        const { entries } = useUndoStack();
        expect(entries.value.length).toBe(0);
    });
});
