import type { CompletedAnime } from "@/commons/models";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAllAnime = vi.fn();

vi.mock("@/commons/services/AnimeService", () => ({
    AnimeService: vi.fn(function () {
        return { getAllAnime };
    }),
}));

const { useCompletedStore } = await import("@/options/stores/completedStore");

const entry = (animeId: string, completedAt: string): CompletedAnime => ({
    animeId,
    animeTitle: animeId,
    animeSlug: animeId,
    completedAt,
});

const older = entry("older", "2026-01-01T00:00:00.000Z");
const newer = entry("newer", "2026-06-01T00:00:00.000Z");

describe("useCompletedStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        getAllAnime.mockResolvedValue({ completedAnime: [older, newer] });
    });

    it("loads completed anime once and indexes them by id", async () => {
        const store = useCompletedStore();

        await store.init();
        await store.init();

        expect(getAllAnime).toHaveBeenCalledTimes(1);
        expect(store.isInitialized).toBe(true);
        expect(store.count).toBe(2);
        expect(store.byId("newer")).toEqual(newer);
        expect(store.byId("missing")).toBeUndefined();
    });

    it("sorts by most recently completed", async () => {
        const store = useCompletedStore();
        await store.init();

        expect(store.sortedByCompletedAt.map((item) => item.animeId)).toEqual(["newer", "older"]);
    });

    it("records a load failure and stays uninitialized", async () => {
        getAllAnime.mockRejectedValue(new Error("storage down"));
        const store = useCompletedStore();

        await store.init();

        expect(store.hasError).toBe(true);
        expect(store.error).toBe("storage down");
        expect(store.isInitialized).toBe(false);
        expect(store.isLoading).toBe(false);
    });

    it("refreshes from storage and clears a previous error", async () => {
        getAllAnime.mockRejectedValueOnce(new Error("storage down"));
        const store = useCompletedStore();
        await store.refreshFromStorage();
        expect(store.hasError).toBe(true);

        await store.refreshFromStorage();

        expect(store.hasError).toBe(false);
        expect(store.count).toBe(2);
    });
});
