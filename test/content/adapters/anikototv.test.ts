import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { anikototvAdapter } from "@/content/adapters/anikototv";

interface CardOptions {
    href?: string;
    title?: string;
    titleHref?: string;
    imgSrc?: string;
    imgDataSrc?: string;
    includeImg?: boolean;
}

function buildCard({
    href = "https://anikototv.to/watch/the-warrior-princess-and-the-barbaric-king-snxwm/ep-6",
    title = "The Warrior Princess and the Barbaric King",
    titleHref,
    imgSrc,
    imgDataSrc,
    includeImg = true,
}: CardOptions = {}): HTMLDivElement {
    const imgAttrs = [
        `alt="${title}"`,
        imgSrc ? `src="${imgSrc}"` : "",
        imgDataSrc ? `data-src="${imgDataSrc}"` : "",
    ]
        .filter(Boolean)
        .join(" ");
    const img = includeImg ? `<img ${imgAttrs}>` : "";
    const card = document.createElement("div");
    card.className = "item";
    card.innerHTML = `
        <div class="inner">
            <div class="ani poster tip tooltipstered" data-tip="8741">
                <a href="${href}">${img}</a>
            </div>
            <div class="info">
                <div class="b1">
                    <a class="name d-title" href="${titleHref ?? href}" data-jp="JP Title">${title}</a>
                </div>
            </div>
        </div>
    `;
    return card;
}

describe("anikototv adapter", () => {
    it("declares its identity and exposes the watch-page handler", () => {
        expect(anikototvAdapter.id).toBe("anikototv");
        expect(anikototvAdapter.watchPage).not.toBeNull();
    });

    it("matches the anikototv host (and subdomains) only", () => {
        expect(anikototvAdapter.matches(new URL("https://anikototv.to/recent"))).toBe(true);
        expect(anikototvAdapter.matches(new URL("https://www.anikototv.to/browse"))).toBe(true);
    });

    it("does not match unrelated hosts even though the script runs on <all_urls>", () => {
        // Guards against the adapter (and its document-wide MutationObserver)
        // activating on arbitrary pages that happen to share generic markup
        // like `.item` / `#list-items`.
        expect(anikototvAdapter.matches(new URL("https://example.com/whatever"))).toBe(false);
        expect(anikototvAdapter.matches(new URL("https://anikototv.fake.com/watch/foo/ep-1"))).toBe(false);
    });

    it("exposes the anikoto list-page selectors", () => {
        expect(anikototvAdapter.containerSelector).toBe("#list-items");
        expect(anikototvAdapter.cardSelector).toBe(".item");
    });

    it("leaves clear-hidden and drag-and-drop enabled by default", () => {
        expect(anikototvAdapter.supportsClearHiddenButton).toBeUndefined();
        expect(anikototvAdapter.supportsDragAndDrop).toBeUndefined();
        expect(anikototvAdapter.getTileElement).toBeUndefined();
    });

    it("extracts slug + title from a card's name link", () => {
        const card = buildCard();
        expect(anikototvAdapter.extractAnime(card)).toEqual({
            animeId: "the-warrior-princess-and-the-barbaric-king-snxwm",
            animeTitle: "The Warrior Princess and the Barbaric King",
            animeSlug: "the-warrior-princess-and-the-barbaric-king-snxwm",
        });
    });

    it("accepts relative hrefs on the name link", () => {
        const card = buildCard({
            href: "/watch/candy-caries-vm1jn/ep-5",
            title: "Candy Caries",
        });
        expect(anikototvAdapter.extractAnime(card)?.animeSlug).toBe("candy-caries-vm1jn");
    });

    it("returns null when the name link is missing", () => {
        const card = document.createElement("div");
        card.className = "item";
        expect(anikototvAdapter.extractAnime(card)).toBeNull();
    });

    it("returns null when the href does not point at a /watch/{slug}/ep-N path", () => {
        const card = buildCard({ href: "https://anikototv.to/genre/fantasy" });
        expect(anikototvAdapter.extractAnime(card)).toBeNull();
    });

    it("returns null when the title text is empty", () => {
        const card = buildCard({ title: "" });
        expect(anikototvAdapter.extractAnime(card)).toBeNull();
    });

    it("extracts the poster URL from the poster img src", () => {
        const card = buildCard({ imgSrc: "https://cdn.anipixcdn.co/thumbnail/92c2425736b1065fa04616737b9e41b5.jpg" });
        expect(anikototvAdapter.extractAnime(card)?.posterUrl).toBe(
            "https://cdn.anipixcdn.co/thumbnail/92c2425736b1065fa04616737b9e41b5.jpg",
        );
    });

    it("prefers the src attribute over data-src when both are present", () => {
        const card = buildCard({
            imgSrc: "https://cdn.anipixcdn.co/thumbnail/real.jpg",
            imgDataSrc: "https://cdn.anipixcdn.co/thumbnail/lazy.jpg",
        });
        expect(anikototvAdapter.extractAnime(card)?.posterUrl).toBe("https://cdn.anipixcdn.co/thumbnail/real.jpg");
    });

    it("falls back to the data-src attribute when src is missing", () => {
        const card = buildCard({ imgDataSrc: "https://cdn.anipixcdn.co/thumbnail/lazy.jpg" });
        expect(anikototvAdapter.extractAnime(card)?.posterUrl).toBe("https://cdn.anipixcdn.co/thumbnail/lazy.jpg");
    });

    it("omits posterUrl when the poster img has no usable source", () => {
        const card = buildCard();
        expect(anikototvAdapter.extractAnime(card)?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the img src uses a javascript: scheme", () => {
        const card = buildCard({ imgSrc: "javascript:alert(1)" });
        expect(anikototvAdapter.extractAnime(card)?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the img src is a data: lazy-load placeholder", () => {
        const card = buildCard({
            imgSrc: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
        });
        expect(anikototvAdapter.extractAnime(card)?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the data-src fallback uses a blob: scheme", () => {
        const card = buildCard({ imgDataSrc: "blob:https://anikototv.to/8f6f3b1c" });
        expect(anikototvAdapter.extractAnime(card)?.posterUrl).toBeUndefined();
    });

    it("resolves relative img src values to absolute URLs", () => {
        const card = buildCard({ imgSrc: "/thumbnail/relative.jpg" });
        expect(anikototvAdapter.extractAnime(card)?.posterUrl).toBe(
            new URL("/thumbnail/relative.jpg", document.baseURI).href,
        );
    });

    it("omits posterUrl when the poster img is missing entirely", () => {
        const card = buildCard({ includeImg: false });
        const anime = anikototvAdapter.extractAnime(card);
        expect(anime).not.toBeNull();
        expect(anime?.posterUrl).toBeUndefined();
    });

    it("returns the poster wrapper as the injection target", () => {
        const card = buildCard();
        const target = anikototvAdapter.getInjectionTarget(card) as HTMLElement | null;
        expect(target).not.toBeNull();
        expect(target?.classList.contains("poster")).toBe(true);
    });

    it("forces position:relative on the injection target idempotently", () => {
        const card = buildCard();
        const first = anikototvAdapter.getInjectionTarget(card) as HTMLElement;
        expect(first.style.position).toBe("relative");
        const second = anikototvAdapter.getInjectionTarget(card) as HTMLElement;
        expect(second).toBe(first);
        expect(second.style.position).toBe("relative");
    });

    it("returns null injection target when no poster wrapper is present", () => {
        const card = document.createElement("div");
        card.className = "item";
        expect(anikototvAdapter.getInjectionTarget(card)).toBeNull();
    });
});

describe("anikototv adapter — watch page", () => {
    const watchPage = anikototvAdapter.watchPage!;
    const originalTitle = document.title;

    beforeEach(() => {
        document.body.innerHTML = "";
        document.title = "";
    });

    afterEach(() => {
        document.title = originalTitle;
        // setup.ts only clears document.body — og:image metas go in the head.
        document.head.querySelectorAll('meta[property="og:image"]').forEach((meta) => meta.remove());
        vi.restoreAllMocks();
    });

    function appendOgImageMeta(content: string): void {
        const meta = document.createElement("meta");
        meta.setAttribute("property", "og:image");
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
    }

    it("matches /watch/{slug}/ep-N URLs only", () => {
        expect(
            watchPage.matches(
                new URL("https://anikototv.to/watch/the-warrior-princess-and-the-barbaric-king-snxwm/ep-6"),
            ),
        ).toBe(true);
        expect(watchPage.matches(new URL("https://anikototv.to/watch/something/ep-12"))).toBe(true);
    });

    it("does not match list, root, or watch-prefix-only URLs", () => {
        expect(watchPage.matches(new URL("https://anikototv.to/"))).toBe(false);
        expect(watchPage.matches(new URL("https://anikototv.to/recent"))).toBe(false);
        expect(watchPage.matches(new URL("https://anikototv.to/watch/foo"))).toBe(false);
        expect(watchPage.matches(new URL("https://anikototv.to/genre/fantasy"))).toBe(false);
    });

    it("does not match watch paths with trailing extra segments or text", () => {
        // Anchoring guard: `/ep-1-extra` and `/ep-1/other` must NOT be treated
        // as the player URL, otherwise unrelated routes would activate the
        // single-page modal.
        expect(watchPage.matches(new URL("https://anikototv.to/watch/foo/ep-1-extra"))).toBe(false);
        expect(watchPage.matches(new URL("https://anikototv.to/watch/foo/ep-1/other"))).toBe(false);
        expect(watchPage.matches(new URL("https://anikototv.to/watch/foo/ep-1-bonus"))).toBe(false);
    });

    it("does not match a valid watch path on a non-anikoto host", () => {
        // Protects unrelated sites with a similar URL shape from being
        // hijacked by the single-page modal.
        expect(watchPage.matches(new URL("https://example.com/watch/foo/ep-1"))).toBe(false);
    });

    it("matches anikoto subdomains as well as the bare host", () => {
        expect(watchPage.matches(new URL("https://www.anikototv.to/watch/foo/ep-1"))).toBe(true);
    });

    it("extracts slug from the path and title from document.title", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/the-warrior-princess-and-the-barbaric-king-snxwm/ep-6",
        } as Location);
        document.title = "Watch The Warrior Princess and the Barbaric King Episode 6 - AnikotoTV";
        expect(watchPage.extractAnime()).toEqual({
            animeId: "the-warrior-princess-and-the-barbaric-king-snxwm",
            animeTitle: "The Warrior Princess and the Barbaric King",
            animeSlug: "the-warrior-princess-and-the-barbaric-king-snxwm",
        });
    });

    it("falls back to a DOM heading when document.title is empty", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/some-slug-abcde/ep-1",
        } as Location);
        document.title = "";
        const heading = document.createElement("h1");
        heading.textContent = "Some Anime";
        document.body.appendChild(heading);
        expect(watchPage.extractAnime()?.animeTitle).toBe("Some Anime");
    });

    it("falls back to the slug when no title source is available", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/lonely-slug-zzzzz/ep-3",
        } as Location);
        document.title = "";
        expect(watchPage.extractAnime()?.animeTitle).toBe("lonely-slug-zzzzz");
    });

    it("captures the og:image poster URL when the meta tag is present", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/some-slug-abcde/ep-1",
        } as Location);
        appendOgImageMeta("https://cdn.anipixcdn.co/poster/some-slug.jpg");
        expect(watchPage.extractAnime()?.posterUrl).toBe("https://cdn.anipixcdn.co/poster/some-slug.jpg");
    });

    it("omits posterUrl when no og:image meta tag is present", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/some-slug-abcde/ep-1",
        } as Location);
        expect(watchPage.extractAnime()?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the og:image meta tag has empty content", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/some-slug-abcde/ep-1",
        } as Location);
        appendOgImageMeta("");
        expect(watchPage.extractAnime()?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the og:image content uses a javascript: scheme", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/some-slug-abcde/ep-1",
        } as Location);
        appendOgImageMeta("javascript:alert(1)");
        expect(watchPage.extractAnime()?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the og:image content uses a data: scheme", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/some-slug-abcde/ep-1",
        } as Location);
        appendOgImageMeta("data:image/png;base64,iVBORw0KGgo=");
        expect(watchPage.extractAnime()?.posterUrl).toBeUndefined();
    });

    it("returns null when the path does not match a /watch/{slug}/ep-N shape", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/recent",
        } as Location);
        expect(watchPage.extractAnime()).toBeNull();
    });

    it("strips trailing site suffixes from document.title", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/demon-slayer-abcde/ep-1",
        } as Location);
        document.title = "Demon Slayer | AnikotoTV";
        expect(watchPage.extractAnime()?.animeTitle).toBe("Demon Slayer");
    });

    it("preserves dashes inside the anime title and only strips the site suffix", () => {
        // Titles like "Steins;Gate - The Movie" contain ` - ` legitimately.
        // We must not split on the first separator — only the trailing site
        // brand should be removed.
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/steins-gate-movie-aaaaa/ep-1",
        } as Location);
        document.title = "Steins;Gate - The Movie - AnikotoTV";
        expect(watchPage.extractAnime()?.animeTitle).toBe("Steins;Gate - The Movie");
    });

    it("does not leave a dangling separator when both episode and brand suffixes are present", () => {
        // Layered stripping case: brand suffix is removed first, then the
        // episode marker. Episode pattern must absorb the preceding " - "
        // separator so we don't end up with "Title -".
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: "/watch/demon-slayer-aaaaa/ep-6",
        } as Location);
        document.title = "Demon Slayer - Episode 6 - AnikotoTV";
        expect(watchPage.extractAnime()?.animeTitle).toBe("Demon Slayer");
    });
});
