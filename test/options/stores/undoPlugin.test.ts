import { __enableUndoForTests, registerUndo, undoLast, useUndoStack } from "@/options/commons/undoManager";
import { createPiniaApp } from "@/options/stores";
import { useWatchingStore } from "@/options/stores/watchingStore";
import { setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vue-toastification", () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

vi.mock("@/commons/services/AnimeService", () => {
    return {
        AnimeService: vi.fn().mockImplementation(() => ({
            getAllAnime: vi.fn().mockResolvedValue({
                currentlyWatching: [],
                planToWatch: [],
                hiddenAnime: [],
            }),
            updateEpisodeProgress: vi.fn().mockResolvedValue({ success: true, message: "ok" }),
            startWatching: vi.fn().mockResolvedValue({ success: true, message: "started" }),
            stopWatching: vi.fn().mockResolvedValue({ success: true, message: "stopped" }),
        })),
    };
});

describe("undo plugin integration", () => {
    beforeEach(() => {
        __enableUndoForTests();
        setActivePinia(createPiniaApp());
    });

    it("undos an incrementEpisode action", async () => {
        const store = useWatchingStore();
        (store as any).__seed([
            {
                animeId: "u1",
                animeTitle: "Undo Show",
                animeSlug: "undo-show",
                currentEpisode: 1,
                episodeId: "undo-show-episode-1",
                lastWatched: new Date().toISOString(),
                totalEpisodes: 12,
            },
        ]);
        expect(store.count).toBe(1);
        const before = store.byId("u1")!.currentEpisode;
        const snap = (store as any).__snapshot();
        // simulate action mutation
        (store.byId("u1") as any).currentEpisode = before + 1;
        expect(store.byId("u1")!.currentEpisode).toBe(before + 1);
        registerUndo({
            storeId: "watching",
            action: "incrementEpisode",
            description: "watching:incrementEpisode",
            apply: () => (store as any).__restore(snap),
        });
        const stack = useUndoStack();
        expect(stack.canUndo.value).toBe(true);
        const success = undoLast();
        expect(success).toBe(true);
        expect(store.byId("u1")!.currentEpisode).toBe(before);
    });
});
