import { describe, expect, it } from "vitest";
import { adapters, animetsuAdapter, hianimeAdapter, selectAdapter } from "@/content/adapters";

describe("content/adapters registry", () => {
    it("includes both built-in adapters", () => {
        expect(adapters).toContain(animetsuAdapter);
        expect(adapters).toContain(hianimeAdapter);
    });

    it("registers more-specific adapters before the hianime catch-all", () => {
        expect(adapters.indexOf(animetsuAdapter)).toBeLessThan(adapters.indexOf(hianimeAdapter));
    });

    it("selects the animetsu adapter for animetsu.live URLs", () => {
        const adapter = selectAdapter(new URL("https://animetsu.live/browse"));
        expect(adapter).toBe(animetsuAdapter);
    });

    it("falls back to the hianime adapter for unknown hosts", () => {
        const adapter = selectAdapter(new URL("https://example.com/anything"));
        expect(adapter).toBe(hianimeAdapter);
    });

    it("returns null when no adapter matches", () => {
        // Pass a local list rather than mutating the exported singleton so the
        // test stays safe under Vitest's parallel runner.
        const fakeAdapter = { ...hianimeAdapter, matches: () => false };
        const adapter = selectAdapter(new URL("https://example.com/anything"), [fakeAdapter]);
        expect(adapter).toBeNull();
    });
});

describe("hianime adapter", () => {
    it("exposes the legacy CSS selectors", () => {
        expect(hianimeAdapter.containerSelector).toBe(".film_list-wrap");
        expect(hianimeAdapter.cardSelector).toBe(".flw-item");
    });

    it("extracts numeric anime id from the standard href shape", () => {
        const card = document.createElement("div");
        card.innerHTML = `
            <div class="film-name">
                <a href="/watch/some-anime-12345" title="Some Anime">Some Anime</a>
            </div>
        `;
        const data = hianimeAdapter.extractAnime(card);
        expect(data).toEqual({
            animeId: "12345",
            animeTitle: "Some Anime",
            animeSlug: "some-anime-12345",
        });
    });

    it("falls back to slug when no numeric suffix is present", () => {
        const card = document.createElement("div");
        card.innerHTML = `
            <div class="film-name">
                <a href="/watch/cool-anime-slug" title="Cool Anime">Cool Anime</a>
            </div>
        `;
        const data = hianimeAdapter.extractAnime(card);
        expect(data?.animeId).toBe("cool-anime-slug");
        expect(data?.animeSlug).toBe("cool-anime-slug");
    });

    it("returns null when title link is missing", () => {
        const card = document.createElement("div");
        expect(hianimeAdapter.extractAnime(card)).toBeNull();
    });

    it("returns the .film-poster element as injection target", () => {
        const card = document.createElement("div");
        card.innerHTML = `<div class="film-poster"></div>`;
        const target = hianimeAdapter.getInjectionTarget(card);
        expect(target).not.toBeNull();
        expect(target?.classList.contains("film-poster")).toBe(true);
    });

    it("matches /watch/ urls as watch pages", () => {
        expect(hianimeAdapter.watchPage?.matches(new URL("https://hianime.to/watch/foo-12"))).toBe(true);
        expect(hianimeAdapter.watchPage?.matches(new URL("https://hianime.to/home"))).toBe(false);
    });
});
