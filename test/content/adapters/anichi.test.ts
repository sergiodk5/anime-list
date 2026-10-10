import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { anichiAdapter } from "@/content/adapters/anichi";

interface CardOptions {
    href?: string;
    title?: string;
    titleHref?: string;
    imgSrc?: string;
    imgDataSrc?: string;
    includeImg?: boolean;
}

function buildCard({
    href = "https://anichi.to/anime/the-warrior-princess-and-the-barbaric-king-snxwm",
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

describe("anichi adapter", () => {
    it("declares its identity and exposes the watch-page handler", () => {
        expect(anichiAdapter.id).toBe("anichi");
        expect(anichiAdapter.watchPage).not.toBeNull();
    });

    it("matches the anichi host (and subdomains) only", () => {
        expect(anichiAdapter.matches(new URL("https://anichi.to/recent"))).toBe(true);
        expect(anichiAdapter.matches(new URL("https://www.anichi.to/browse"))).toBe(true);
    });

    it("does not match unrelated hosts even though the script runs on <all_urls>", () => {
        // Guards against the adapter (and its document-wide MutationObserver)
        // activating on arbitrary pages that happen to share generic markup
        // like `.item` / `#list-items`.
        expect(anichiAdapter.matches(new URL("https://example.com/whatever"))).toBe(false);
        expect(anichiAdapter.matches(new URL("https://anichi.fake.com/anime/foo"))).toBe(false);
    });

    it("exposes the anichi list-page selectors", () => {
        expect(anichiAdapter.containerSelector).toBe("#list-items");
        expect(anichiAdapter.cardSelector).toBe(".item");
    });

    it("leaves clear-hidden and drag-and-drop enabled by default", () => {
        expect(anichiAdapter.supportsClearHiddenButton).toBeUndefined();
        expect(anichiAdapter.supportsDragAndDrop).toBeUndefined();
        expect(anichiAdapter.getTileElement).toBeUndefined();
    });

    it("extracts slug + title from a card's name link", () => {
        const card = buildCard();
        expect(anichiAdapter.extractAnime(card)).toEqual({
            animeId: "the-warrior-princess-and-the-barbaric-king-snxwm",
            animeTitle: "The Warrior Princess and the Barbaric King",
            animeSlug: "the-warrior-princess-and-the-barbaric-king-snxwm",
        });
    });

    it("extracts slug from a hash-suffixed /anime/{slug} card href", () => {
        const card = buildCard({ href: "https://anichi.to/anime/tomb-raider-king-91d21" });
        expect(anichiAdapter.extractAnime(card)?.animeSlug).toBe("tomb-raider-king-91d21");
    });

    it("extracts slug from a bare (no-suffix) /anime/{slug} card href", () => {
        const card = buildCard({ href: "/anime/youjo-senki-ii" });
        expect(anichiAdapter.extractAnime(card)?.animeSlug).toBe("youjo-senki-ii");
    });

    it("returns null when the card links to the player instead of the detail page", () => {
        const card = buildCard({ href: "https://anichi.to/watch/tomb-raider-king-91d21/ep-1" });
        expect(anichiAdapter.extractAnime(card)).toBeNull();
    });

    it("accepts relative hrefs on the name link", () => {
        const card = buildCard({
            href: "/anime/candy-caries-vm1jn",
            title: "Candy Caries",
        });
        expect(anichiAdapter.extractAnime(card)?.animeSlug).toBe("candy-caries-vm1jn");
    });

    it("returns null when the name link is missing", () => {
        const card = document.createElement("div");
        card.className = "item";
        expect(anichiAdapter.extractAnime(card)).toBeNull();
    });

    it("returns null for unrelated paths", () => {
        const card = buildCard({ href: "https://anichi.to/genre/fantasy" });
        expect(anichiAdapter.extractAnime(card)).toBeNull();
    });

    it("returns null when the title text is empty", () => {
        const card = buildCard({ title: "" });
        expect(anichiAdapter.extractAnime(card)).toBeNull();
    });

    it("extracts the poster URL from the poster img src", () => {
        const card = buildCard({ imgSrc: "https://cdn.anipixcdn.co/thumbnail/92c2425736b1065fa04616737b9e41b5.jpg" });
        expect(anichiAdapter.extractAnime(card)?.posterUrl).toBe(
            "https://cdn.anipixcdn.co/thumbnail/92c2425736b1065fa04616737b9e41b5.jpg",
        );
    });

    it("prefers the src attribute over data-src when both are present", () => {
        const card = buildCard({
            imgSrc: "https://cdn.anipixcdn.co/thumbnail/real.jpg",
            imgDataSrc: "https://cdn.anipixcdn.co/thumbnail/lazy.jpg",
        });
        expect(anichiAdapter.extractAnime(card)?.posterUrl).toBe("https://cdn.anipixcdn.co/thumbnail/real.jpg");
    });

    it("falls back to the data-src attribute when src is missing", () => {
        const card = buildCard({ imgDataSrc: "https://cdn.anipixcdn.co/thumbnail/lazy.jpg" });
        expect(anichiAdapter.extractAnime(card)?.posterUrl).toBe("https://cdn.anipixcdn.co/thumbnail/lazy.jpg");
    });

    it("omits posterUrl when the poster img has no usable source", () => {
        const card = buildCard();
        expect(anichiAdapter.extractAnime(card)?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the img src uses a javascript: scheme", () => {
        const card = buildCard({ imgSrc: "javascript:alert(1)" });
        expect(anichiAdapter.extractAnime(card)?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the img src is a data: lazy-load placeholder", () => {
        const card = buildCard({
            imgSrc: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
        });
        expect(anichiAdapter.extractAnime(card)?.posterUrl).toBeUndefined();
    });

    it("falls back to data-src when src is a data: lazy-load placeholder", () => {
        const card = buildCard({
            imgSrc: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
            imgDataSrc: "https://cdn.anipixcdn.co/thumbnail/lazy.jpg",
        });
        expect(anichiAdapter.extractAnime(card)?.posterUrl).toBe("https://cdn.anipixcdn.co/thumbnail/lazy.jpg");
    });

    it("omits posterUrl when the data-src fallback uses a blob: scheme", () => {
        const card = buildCard({ imgDataSrc: "blob:https://anichi.to/8f6f3b1c" });
        expect(anichiAdapter.extractAnime(card)?.posterUrl).toBeUndefined();
    });

    it("resolves relative img src values to absolute URLs", () => {
        const card = buildCard({ imgSrc: "/thumbnail/relative.jpg" });
        expect(anichiAdapter.extractAnime(card)?.posterUrl).toBe(
            new URL("/thumbnail/relative.jpg", document.baseURI).href,
        );
    });

    it("omits posterUrl when the poster img is missing entirely", () => {
        const card = buildCard({ includeImg: false });
        const anime = anichiAdapter.extractAnime(card);
        expect(anime).not.toBeNull();
        expect(anime?.posterUrl).toBeUndefined();
    });

    it("returns the poster wrapper as the injection target", () => {
        const card = buildCard();
        const target = anichiAdapter.getInjectionTarget(card) as HTMLElement | null;
        expect(target).not.toBeNull();
        expect(target?.classList.contains("poster")).toBe(true);
    });

    it("forces position:relative on the injection target idempotently", () => {
        const card = buildCard();
        const first = anichiAdapter.getInjectionTarget(card) as HTMLElement;
        expect(first.style.position).toBe("relative");
        const second = anichiAdapter.getInjectionTarget(card) as HTMLElement;
        expect(second).toBe(first);
        expect(second.style.position).toBe("relative");
    });

    it("returns null injection target when no poster wrapper is present", () => {
        const card = document.createElement("div");
        card.className = "item";
        expect(anichiAdapter.getInjectionTarget(card)).toBeNull();
    });
});

describe("anichi adapter — watch page", () => {
    const watchPage = anichiAdapter.watchPage!;
    const originalTitle = document.title;

    beforeEach(() => {
        document.body.innerHTML = "";
        document.title = "";
    });

    afterEach(() => {
        document.title = originalTitle;
        // setup.ts only clears document.body — og:image/og:title metas go in the head.
        document.head.querySelectorAll('meta[property="og:image"], meta[property="og:title"]').forEach((meta) => {
            meta.remove();
        });
        vi.restoreAllMocks();
    });

    function appendOgImageMeta(content: string): void {
        const meta = document.createElement("meta");
        meta.setAttribute("property", "og:image");
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
    }

    function appendOgTitleMeta(content: string): void {
        const meta = document.createElement("meta");
        meta.setAttribute("property", "og:title");
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
    }

    function setLocation(href: string): void {
        const url = new URL(href);
        vi.spyOn(window, "location", "get").mockReturnValue({
            pathname: url.pathname,
        } as Location);
    }

    it.each([
        ["https://anichi.to/anime/tomb-raider-king-91d21", true],
        ["https://anichi.to/watch/tomb-raider-king-91d21/ep-1", true],
        ["https://anichi.to/anime/", false],
        ["https://anichi.to/anime/foo/bar", false],
        ["https://anichi.to/watch/foo/ep-1-extra", false],
        ["https://example.com/anime/tomb-raider-king-91d21", false],
    ])("watchPage.matches(%s) === %s", (href, expected) => {
        expect(watchPage.matches(new URL(href))).toBe(expected);
    });

    it("does not match list, root, or watch-prefix-only URLs", () => {
        expect(watchPage.matches(new URL("https://anichi.to/"))).toBe(false);
        expect(watchPage.matches(new URL("https://anichi.to/recent"))).toBe(false);
        expect(watchPage.matches(new URL("https://anichi.to/watch/foo"))).toBe(false);
        expect(watchPage.matches(new URL("https://anichi.to/genre/fantasy"))).toBe(false);
    });

    it("does not match watch paths with trailing extra segments or text", () => {
        // Anchoring guard: `/ep-1-extra` and `/ep-1/other` must NOT be treated
        // as the player URL, otherwise unrelated routes would activate the
        // single-page modal.
        expect(watchPage.matches(new URL("https://anichi.to/watch/foo/ep-1-extra"))).toBe(false);
        expect(watchPage.matches(new URL("https://anichi.to/watch/foo/ep-1/other"))).toBe(false);
        expect(watchPage.matches(new URL("https://anichi.to/watch/foo/ep-1-bonus"))).toBe(false);
    });

    it("does not match a valid watch path on a non-anichi host", () => {
        // Protects unrelated sites with a similar URL shape from being
        // hijacked by the single-page modal.
        expect(watchPage.matches(new URL("https://example.com/watch/foo/ep-1"))).toBe(false);
    });

    it("matches anichi subdomains as well as the bare host", () => {
        expect(watchPage.matches(new URL("https://www.anichi.to/watch/foo/ep-1"))).toBe(true);
        expect(watchPage.matches(new URL("https://www.anichi.to/anime/foo"))).toBe(true);
    });

    it("recovers the slug when on the detail page", () => {
        setLocation("https://anichi.to/anime/tomb-raider-king-91d21");
        expect(watchPage.extractAnime()?.animeSlug).toBe("tomb-raider-king-91d21");
    });

    it("recovers the slug when on the watch/player page", () => {
        setLocation("https://anichi.to/watch/tomb-raider-king-91d21/ep-3");
        expect(watchPage.extractAnime()?.animeSlug).toBe("tomb-raider-king-91d21");
    });

    it("returns null when the path does not match either shape", () => {
        setLocation("https://anichi.to/recent");
        expect(watchPage.extractAnime()).toBeNull();
    });

    it("prefers data-en on the detail-page title element", () => {
        document.body.innerHTML = `<h1 class="series-title d-title" data-en="Tomb Raider King">Dogulwang</h1>`;
        document.title = "Something else - Anichi";
        setLocation("https://anichi.to/anime/tomb-raider-king-91d21");
        expect(watchPage.extractAnime()?.animeTitle).toBe("Tomb Raider King");
    });

    it("prefers data-en on the inner <a> of the watch-page h1.media-title", () => {
        document.body.innerHTML = `<h1 class="media-title"><a class="d-title" data-en="Tomb Raider King">Dogulwang</a></h1>`;
        document.title = "Watch Tomb Raider King Episode 1 Anime Online | Anichi";
        setLocation("https://anichi.to/watch/tomb-raider-king-91d21/ep-1");
        expect(watchPage.extractAnime()?.animeTitle).toBe("Tomb Raider King");
    });

    it("falls back to og:title, stripped, when data-en is absent", () => {
        appendOgTitleMeta("Tomb Raider King - Anichi - Watch Anime Online, Subbed & Dubbed Anime");
        setLocation("https://anichi.to/anime/tomb-raider-king-91d21");
        expect(watchPage.extractAnime()?.animeTitle).toBe("Tomb Raider King");
    });

    it("falls back to document.title, stripped, when data-en and og:title are absent", () => {
        document.title = "Watch Tomb Raider King Episode 1 Anime Online | Anichi";
        setLocation("https://anichi.to/watch/tomb-raider-king-91d21/ep-1");
        expect(watchPage.extractAnime()?.animeTitle).toBe("Tomb Raider King");
    });

    it("falls back to the slug when nothing usable is present", () => {
        document.title = "";
        setLocation("https://anichi.to/watch/tomb-raider-king-91d21/ep-1");
        expect(watchPage.extractAnime()?.animeTitle).toBe("tomb-raider-king-91d21");
    });

    it("prefers data-en even when og:title and document.title are also present and different", () => {
        document.body.innerHTML = `<h1 class="series-title d-title" data-en="Correct Title">Wrong</h1>`;
        appendOgTitleMeta("Different Title");
        document.title = "Yet Another Title - Anichi";
        setLocation("https://anichi.to/anime/tomb-raider-king-91d21");
        expect(watchPage.extractAnime()?.animeTitle).toBe("Correct Title");
    });

    it("captures the og:image poster URL when the meta tag is present", () => {
        setLocation("https://anichi.to/watch/some-slug-abcde/ep-1");
        appendOgImageMeta("https://cdn.anipixcdn.co/poster/some-slug.jpg");
        expect(watchPage.extractAnime()?.posterUrl).toBe("https://cdn.anipixcdn.co/poster/some-slug.jpg");
    });

    it("omits posterUrl when no og:image meta tag is present", () => {
        setLocation("https://anichi.to/watch/some-slug-abcde/ep-1");
        expect(watchPage.extractAnime()?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the og:image meta tag has empty content", () => {
        setLocation("https://anichi.to/watch/some-slug-abcde/ep-1");
        appendOgImageMeta("");
        expect(watchPage.extractAnime()?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the og:image content uses a javascript: scheme", () => {
        setLocation("https://anichi.to/watch/some-slug-abcde/ep-1");
        appendOgImageMeta("javascript:alert(1)");
        expect(watchPage.extractAnime()?.posterUrl).toBeUndefined();
    });

    it("omits posterUrl when the og:image content uses a data: scheme", () => {
        setLocation("https://anichi.to/watch/some-slug-abcde/ep-1");
        appendOgImageMeta("data:image/png;base64,iVBORw0KGgo=");
        expect(watchPage.extractAnime()?.posterUrl).toBeUndefined();
    });
});

describe("anichi adapter — page metadata", () => {
    const watchPage = anichiAdapter.watchPage!;

    const nextEpisodeBlock = `
        <div class="watch-next-ep" id="watch-next-ep" data-manga-id="9016" data-air-at="1791729000">
            <div class="watch-next-ep__copy">
                <span class="watch-next-ep__eyebrow">Next episode</span>
                <strong class="watch-next-ep__ep"> Episode 3 </strong>
            </div>
        </div>`;

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("reads ids, slug and next episode from the anime page", () => {
        document.body.innerHTML = `
            <main class="page page-anime series-page" id="series-page" data-id="9016"
                data-url="https://anichi.to/watch/overgeared-rah7b" data-mal-id="64340" data-anilist-id="212888">
                ${nextEpisodeBlock}
            </main>`;

        expect(watchPage.extractMetadata!()).toEqual({
            animeId: "overgeared-rah7b",
            anilistId: 212888,
            malId: 64340,
            nextEpisode: { episode: 3, airingAt: 1791729000 },
        });
    });

    it("reads ids, slug and next episode from the watch page", () => {
        document.body.innerHTML = `
            <div class="watch-wrap" id="watch-main" data-id="9016" data-mal-id="64340" data-anilist-id="212888"
                data-ep-num="1" data-url="https://anichi.to/watch/overgeared-rah7b">
                ${nextEpisodeBlock}
            </div>`;

        expect(watchPage.extractMetadata!()).toEqual({
            animeId: "overgeared-rah7b",
            anilistId: 212888,
            malId: 64340,
            nextEpisode: { episode: 3, airingAt: 1791729000 },
        });
    });

    it("omits the next episode when the show is not airing", () => {
        document.body.innerHTML = `
            <main id="series-page" data-url="https://anichi.to/watch/overgeared-rah7b" data-mal-id="64340"
                data-anilist-id="212888"></main>`;

        expect(watchPage.extractMetadata!()?.nextEpisode).toBeUndefined();
    });

    it("treats empty or non-numeric ids as missing", () => {
        document.body.innerHTML = `
            <main id="series-page" data-url="https://anichi.to/watch/overgeared-rah7b" data-mal-id=""
                data-anilist-id="-"></main>`;

        const metadata = watchPage.extractMetadata!();
        expect(metadata?.anilistId).toBeUndefined();
        expect(metadata?.malId).toBeUndefined();
    });

    it("falls back to the URL slug when data-url is missing", () => {
        vi.spyOn(window, "location", "get").mockReturnValue({ pathname: "/anime/overgeared-rah7b" } as Location);
        document.body.innerHTML = `<main id="series-page" data-anilist-id="212888"></main>`;

        expect(watchPage.extractMetadata!()?.animeId).toBe("overgeared-rah7b");
    });

    it("returns null on pages without the anime root element", () => {
        document.body.innerHTML = `<div id="list-items"></div>`;

        expect(watchPage.extractMetadata!()).toBeNull();
    });
});
