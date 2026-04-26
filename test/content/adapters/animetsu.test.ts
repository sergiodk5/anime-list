import { describe, expect, it } from "vitest";
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
        expect(animetsuAdapter.watchPage).toBeNull();
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
