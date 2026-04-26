import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animetsuAdapter } from "@/content/adapters/animetsu";

function buildCard({
    href = "/anime/6989b89f29cf95f4eb03b4ee",
    title = "Attack on Titan",
}: { href?: string; title?: string } = {}): HTMLAnchorElement {
    const card = document.createElement("a");
    card.setAttribute("href", href);
    card.className = "flex flex-col w-full gap-2 cursor-pointer";
    card.innerHTML = `
        <div class="flex aspect-cover w-full bg-white/10 radius-xl">
            <div class="relative size-full flex items-center justify-center select-none shrink-0">
                <img />
            </div>
        </div>
        <div class="flex w-full flex-col gap-1">
            <div class="w-full flex-center justify-between text-2xs sm:text-xs text-muted">
                <span>TV Show</span>
                <span>2013</span>
            </div>
            <div class="line-clamp-2 font-medium xl:font-semibold text-xs sm:text-sm">${title}</div>
        </div>
    `;
    return card;
}

describe("animetsu adapter", () => {
    it("declares its identity and feature flags", () => {
        expect(animetsuAdapter.id).toBe("animetsu");
        expect(animetsuAdapter.supportsClearHiddenButton).toBe(false);
        expect(animetsuAdapter.supportsDragAndDrop).toBe(false);
        expect(animetsuAdapter.watchPage).not.toBeNull();
    });

    it("matches animetsu.live and its subdomains only", () => {
        expect(animetsuAdapter.matches(new URL("https://animetsu.live/browse"))).toBe(true);
        expect(animetsuAdapter.matches(new URL("https://www.animetsu.live/anime/abc"))).toBe(true);
        expect(animetsuAdapter.matches(new URL("https://hianime.to/home"))).toBe(false);
        expect(animetsuAdapter.matches(new URL("https://example.com/animetsu.live"))).toBe(false);
    });

    it("scopes its card selector to anchors with a poster wrapper", () => {
        expect(animetsuAdapter.cardSelector).toBe('a[href^="/anime/"]:has(.aspect-cover)');
    });

    it("extracts the anime id from the /anime/{id} path", () => {
        const card = buildCard({ href: "/anime/6989b89f29cf95f4eb03b4ee", title: "Attack on Titan" });
        expect(animetsuAdapter.extractAnime(card)).toEqual({
            animeId: "6989b89f29cf95f4eb03b4ee",
            animeTitle: "Attack on Titan",
            animeSlug: "6989b89f29cf95f4eb03b4ee",
        });
    });

    it("strips trailing query strings and fragments from the href", () => {
        const card = buildCard({ href: "/anime/abc123?ref=home", title: "Sample" });
        expect(animetsuAdapter.extractAnime(card)?.animeId).toBe("abc123");
    });

    it("returns null when the title is missing", () => {
        const card = buildCard({ title: "" });
        expect(animetsuAdapter.extractAnime(card)).toBeNull();
    });

    it("returns null when the href is malformed", () => {
        const card = document.createElement("a");
        card.setAttribute("href", "/browse");
        expect(animetsuAdapter.extractAnime(card)).toBeNull();
    });

    it("returns the inner relative wrapper as the injection target", () => {
        const card = buildCard();
        const target = animetsuAdapter.getInjectionTarget(card) as HTMLElement | null;
        expect(target).not.toBeNull();
        expect(target?.classList.contains("relative")).toBe(true);
    });

    it("forces position:relative on the injection target idempotently", () => {
        const card = buildCard();
        const first = animetsuAdapter.getInjectionTarget(card) as HTMLElement;
        expect(first.style.position).toBe("relative");
        // Second call should not mutate twice nor pick a different element.
        const second = animetsuAdapter.getInjectionTarget(card) as HTMLElement;
        expect(second).toBe(first);
        expect(second.style.position).toBe("relative");
    });

    it("falls back to the poster wrapper when the relative inner div is missing", () => {
        const card = document.createElement("a");
        card.setAttribute("href", "/anime/abc");
        const wrapper = document.createElement("div");
        wrapper.className = "aspect-cover";
        card.appendChild(wrapper);
        const target = animetsuAdapter.getInjectionTarget(card) as HTMLElement;
        expect(target).toBe(wrapper);
        expect(target.style.position).toBe("relative");
    });
});

describe("animetsu adapter — watch page", () => {
    const watchPage = animetsuAdapter.watchPage!;
    const originalTitle = document.title;

    beforeEach(() => {
        document.body.innerHTML = "";
        document.title = "Animetsu";
    });

    afterEach(() => {
        document.title = originalTitle;
        vi.restoreAllMocks();
    });

    it("matches /anime/{id} URLs", () => {
        expect(watchPage.matches(new URL("https://animetsu.live/anime/abc123"))).toBe(true);
        expect(watchPage.matches(new URL("https://animetsu.live/anime/abc123/episode/4"))).toBe(true);
    });

    it("does not match list, root, or bare /anime URLs", () => {
        expect(watchPage.matches(new URL("https://animetsu.live/browse"))).toBe(false);
        expect(watchPage.matches(new URL("https://animetsu.live/"))).toBe(false);
        expect(watchPage.matches(new URL("https://animetsu.live/anime"))).toBe(false);
    });

    it("extracts id from path and title from document.title once hydrated", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/anime/abc123",
        } as Location);
        document.title = "Attack on Titan";
        expect(watchPage.extractAnime()).toEqual({
            animeId: "abc123",
            animeTitle: "Attack on Titan",
            animeSlug: "abc123",
        });
    });

    it("falls back to a DOM heading when document.title is still 'Animetsu'", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/anime/abc123",
        } as Location);
        document.title = "Animetsu";
        const heading = document.createElement("div");
        heading.className = "flex-center font-extrabold";
        heading.textContent = "Demon Slayer";
        document.body.appendChild(heading);
        expect(watchPage.extractAnime()?.animeTitle).toBe("Demon Slayer");
    });

    it("falls back to the anime id when no title source is available", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/anime/zzzz",
        } as Location);
        document.title = "Animetsu";
        expect(watchPage.extractAnime()?.animeTitle).toBe("zzzz");
    });

    it("returns null when path does not match the watch shape", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/browse",
        } as Location);
        expect(watchPage.extractAnime()).toBeNull();
    });
});
