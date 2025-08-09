import {
    __enableUndoForTests,
    __resetUndoForTests,
    registerUndo,
    undoLast,
    useUndoStack,
} from "@/options/commons/undoManager";
import { beforeEach, describe, expect, it } from "vitest";

function makeEntry(n: number) {
    return {
        storeId: "watching",
        action: `act-${n}`,
        description: `Action ${n}`,
        apply: () => {
            // noop restore
        },
    };
}

describe("undoManager additional coverage", () => {
    beforeEach(() => {
        __resetUndoForTests();
    });

    it("ignores register when disabled", () => {
        registerUndo(makeEntry(1) as any);
        const { canUndo, entries } = useUndoStack();
        expect(canUndo.value).toBe(false);
        expect(entries.value.length).toBe(0);
    });

    it("registers up to MAX_UNDO and trims oldest", () => {
        __enableUndoForTests();
        for (let i = 0; i < 12; i++) registerUndo(makeEntry(i) as any);
        const { entries } = useUndoStack();
        expect(entries.value.length).toBe(10); // MAX_UNDO
        // Oldest two should be dropped -> start at act-2
        expect(entries.value[0].action).toBe("act-2");
        expect(entries.value[entries.value.length - 1].action).toBe("act-11");
    });

    it("undoLast returns false when disabled or empty", () => {
        expect(undoLast()).toBe(false); // disabled
        __enableUndoForTests();
        expect(undoLast()).toBe(false); // empty
    });

    it("undoLast applies latest and pops", () => {
        __enableUndoForTests();
        const applied: string[] = [];
        registerUndo({
            storeId: "watching",
            action: "a",
            description: "A",
            apply: () => applied.push("a"),
        });
        registerUndo({
            storeId: "watching",
            action: "b",
            description: "B",
            apply: () => applied.push("b"),
        });
        expect(undoLast()).toBe(true);
        expect(applied).toEqual(["b"]);
        const { entries } = useUndoStack();
        expect(entries.value.length).toBe(1);
        expect(entries.value[0].action).toBe("a");
    });

    it("undoLast handles apply throwing and returns false", () => {
        __enableUndoForTests();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        registerUndo({
            storeId: "watching",
            action: "boom",
            description: "Boom",
            apply: () => {
                throw new Error("explode");
            },
        });
        // Should attempt undo but fail gracefully
        expect(undoLast()).toBe(false);
        expect(warnSpy).toHaveBeenCalled();
        // Stack now empty after pop attempt
        const { canUndo } = useUndoStack();
        expect(canUndo.value).toBe(false);
        warnSpy.mockRestore();
    });
});
