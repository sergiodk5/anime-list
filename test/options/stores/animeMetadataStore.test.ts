import type { AnimeMetadata } from "@/commons/models";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findAll = vi.fn();

vi.mock("@/commons/repositories", () => ({
    AnimeMetadataRepository: vi.fn(function () {
        return { findAll };
    }),
}));

const { useAnimeMetadataStore } = await import("@/options/stores/animeMetadataStore");

const overgeared: AnimeMetadata = { animeId: "overgeared", anilistId: 212888, totalEpisodes: 12, nextRefreshAt: null };

describe("useAnimeMetadataStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        findAll.mockResolvedValue([overgeared]);
    });

    it("loads metadata once and looks it up by anime id", async () => {
        const store = useAnimeMetadataStore();

        await store.init();
        await store.init();

        expect(findAll).toHaveBeenCalledTimes(1);
        expect(store.isInitialized).toBe(true);
        expect(store.byId("overgeared")).toEqual(overgeared);
        expect(store.byId("missing")).toBeUndefined();
    });

    it("keeps the last loaded data and reports the error when a refresh fails", async () => {
        const store = useAnimeMetadataStore();
        await store.init();
        findAll.mockRejectedValueOnce(new Error("storage down"));

        await store.refreshFromStorage();

        expect(store.error).toBe("storage down");
        expect(store.byId("overgeared")).toEqual(overgeared);
    });

    it("picks up storage changes on refresh", async () => {
        const store = useAnimeMetadataStore();
        await store.init();
        findAll.mockResolvedValue([{ ...overgeared, totalEpisodes: 13 }]);

        await store.refreshFromStorage();

        expect(store.byId("overgeared")?.totalEpisodes).toBe(13);
        expect(store.error).toBeNull();
    });
});
