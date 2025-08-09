import { isUndoEnabled, registerUndo } from "@/options/commons/undoManager";
import type { PiniaPluginContext } from "pinia";

const TRACKED_ACTIONS = new Set([
    "startWatching",
    "incrementEpisode",
    "decrementEpisode",
    "stopWatching",
    "addToPlan",
    "removeFromPlan",
    "hide",
    "unhide",
    "clearAllHidden",
]);

interface SnapshotCapableStore {
    __snapshot?: () => any;
    __restore?: (snap: any) => void;
}

export function undoPlugin({ store }: PiniaPluginContext) {
    const snapshotCapable = store as unknown as SnapshotCapableStore;
    if (!snapshotCapable.__snapshot || !snapshotCapable.__restore) return;

    store.$onAction(({ name, after }) => {
        if (!TRACKED_ACTIONS.has(name)) return;
        const beforeSnap = snapshotCapable.__snapshot!();
        after(() => {
            if (!isUndoEnabled()) return; // runtime check (tests can enable later)
            try {
                const afterSnap = snapshotCapable.__snapshot!();
                const same = JSON.stringify(afterSnap) === JSON.stringify(beforeSnap);
                if (same) return;
            } catch {
                /* ignore */
            }
            registerUndo({
                storeId: store.$id,
                action: name,
                description: `${store.$id}:${name}`,
                apply: () => snapshotCapable.__restore!(beforeSnap),
            });
        });
    });
}
