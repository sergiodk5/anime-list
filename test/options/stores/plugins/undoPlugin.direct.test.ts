import { __enableUndoForTests, __resetUndoForTests, useUndoStack } from "@/options/commons/undoManager";
import { undoPlugin } from "@/options/stores/plugins/undoPlugin";
import { beforeEach, describe, expect, it } from "vitest";

// Minimal Pinia-like context types
interface FakeStore {
    $id: string;
    $onAction: (handler: (ctx: { name: string; after: (cb: () => void) => void }) => void) => void;
    __snapshot?: () => any;
    __restore?: (snap: any) => void;
}

function createFakeStore(): { store: FakeStore; trigger: (action: string, mutate?: () => void) => void } {
    const afterCbs: (() => void)[] = [];
    let handler: any;
    const store: FakeStore = {
        $id: "watching",
        $onAction(h) {
            handler = h;
        },
        __snapshot: () => ({ count: state.count }),
        __restore: (snap) => {
            state.count = snap.count;
        },
    };
    const state = { count: 0 };
    function trigger(action: string, mutate?: () => void) {
        afterCbs.length = 0;
        handler({
            name: action,
            after(cb: () => void) {
                afterCbs.push(cb);
            },
        });
        // Simulate action mutation between before and after
        mutate?.();
        // Call after callbacks (what Pinia would do post-action)
        afterCbs.forEach((cb) => cb());
    }
    return { store, trigger };
}

describe("undoPlugin direct", () => {
    beforeEach(() => {
        __resetUndoForTests();
        __enableUndoForTests();
    });

    it("registers undo when tracked action mutates snapshot", () => {
        const { store, trigger } = createFakeStore();
        undoPlugin({ store } as any);
        const { entries } = useUndoStack();
        expect(entries.value.length).toBe(0);
        trigger("incrementEpisode", () => {
            // mutation so after snapshot differs
            store as any; // keep store referenced
            // mutate internal state via snapshot closure (not directly on store)
            // state is enclosed; simulate by redefining snapshot to changed value
            (store.__snapshot as any) = () => ({ count: 1 });
        });
        expect(entries.value.length).toBe(1);
        expect(entries.value[0].action).toBe("incrementEpisode");
    });

    it("skips registration when snapshot unchanged", () => {
        const { store, trigger } = createFakeStore();
        undoPlugin({ store } as any);
        const { entries } = useUndoStack();
        trigger("hide", () => {
            // hide is tracked but no change; keep snapshot identical
        });
        expect(entries.value.length).toBe(0);
    });

    it("ignores untracked action", () => {
        const { store, trigger } = createFakeStore();
        undoPlugin({ store } as any);
        const { entries } = useUndoStack();
        trigger("notTrackedAction", () => {
            (store.__snapshot as any) = () => ({ count: 5 });
        });
        expect(entries.value.length).toBe(0);
    });
});
