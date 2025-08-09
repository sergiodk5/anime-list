import { computed, ref } from "vue";

export interface UndoEntry {
    id: string;
    storeId: string;
    action: string;
    timestamp: number;
    description: string;
    apply: () => void; // restore snapshot
}

const MAX_UNDO = 10;
const stack = ref<UndoEntry[]>([]);
let enabled = (import.meta as any)?.env?.VITE_ENABLE_UNDO === "true";

export function __enableUndoForTests() {
    enabled = true;
}

export function isUndoEnabled() {
    return enabled;
}

export function registerUndo(entry: Omit<UndoEntry, "id" | "timestamp">) {
    if (!enabled) return;
    const full: UndoEntry = { id: crypto.randomUUID(), timestamp: Date.now(), ...entry };
    stack.value.push(full);
    if (stack.value.length > MAX_UNDO) stack.value.shift();
}

export function undoLast(): boolean {
    if (!enabled || stack.value.length === 0) return false;
    const last = stack.value.pop();
    try {
        last?.apply();
        return true;
    } catch (e) {
        console.warn("Undo failed", e);
        return false;
    }
}

export function useUndoStack() {
    return {
        entries: computed(() => stack.value),
        canUndo: computed(() => stack.value.length > 0 && enabled),
        undoLast,
    };
}

// Test-only helper to reset undo state
export function __resetUndoForTests() {
    stack.value = [];
    enabled = false;
}
