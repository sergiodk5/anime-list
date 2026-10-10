import type { AnimeData, NextEpisode, PageAnimeMetadata } from "@/commons/models";
import type { SiteAdapter } from "./types";

const SELECTORS = {
    CONTAINER: "#list-items",
    ITEM: ".item",
    POSTER: ".ani.poster",
    TITLE_LINK: "a.name.d-title",
} as const;

// anichi.to has two per-anime URL shapes: a detail page (list/filter cards
// link here) and the episode player (same shape as the old anikototv
// adapter). Slugs are identical across both and may or may not carry a
// trailing hash-like suffix (e.g. "tomb-raider-king-91d21" vs
// "youjo-senki-ii"). Both regexes are anchored at both ends (with an
// optional trailing slash) so paths like `/anime/foo/bar` or
// `/watch/foo/ep-1-extra` don't sneak through.
const ANIME_PATH_RE = /^\/anime\/(?<slug>[^/]+)\/?$/;
const WATCH_PATH_RE = /^\/watch\/(?<slug>[^/]+)\/ep-\d+\/?$/;

// anichi host check used to scope this adapter's site-specific handling to
// anichi hosts, so unrelated pages with similar paths or DOM structures are
// not treated as anichi pages.
const ANICHI_HOST = "anichi.to";

function isAnichiHost(hostname: string): boolean {
    return hostname === ANICHI_HOST || hostname.endsWith(`.${ANICHI_HOST}`);
}

// Tries a single anchored path pattern and returns its named `slug` group,
// or null if the pattern doesn't match. Shared by card-href extraction and
// watch-page slug recovery so both path shapes are matched identically.
function matchSlug(pathname: string, pattern: RegExp): string | null {
    return pattern.exec(pathname)?.groups?.slug ?? null;
}

// Title lookup targets, ordered detail-page first then watch-page. On the
// detail page data-en lives on the h1 itself; on the watch page it lives on
// an inner <a class="d-title"> inside h1.media-title, not on the h1.
const TITLE_ATTR_SELECTORS = ["h1.series-title.d-title", "h1.media-title .d-title"] as const;

function extractSlugFromHref(href: string): string | null {
    if (!href) return null;
    let pathname = href;
    try {
        pathname = new URL(href, "https://anichi.to").pathname;
    } catch {
        // Fall through with the raw href; relative paths still work with the
        // regex below.
    }
    return matchSlug(pathname, ANIME_PATH_RE);
}

function toSafePosterUrl(raw: string | null | undefined): string | undefined {
    // Poster URLs come from an untrusted third-party page and end up bound to
    // <img :src> in the privileged options page, so only absolute http/https
    // URLs are accepted. Resolving against document.baseURI also turns
    // relative src values into absolute ones and rejects javascript:/data:/
    // blob: values, including lazy-load placeholders.
    if (!raw) return undefined;
    try {
        const url = new URL(raw, document.baseURI);
        return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
    } catch {
        return undefined;
    }
}

function extractCardPosterUrl(card: Element): string | undefined {
    // Real card markup nests the poster as `.ani.poster > a > img` with a
    // plain absolute `src`. `data-src` is kept as defense-in-depth in case the
    // site adopts lazy loading; each candidate is validated independently.
    const img = card.querySelector<HTMLImageElement>(`${SELECTORS.POSTER} img`);
    return toSafePosterUrl(img?.getAttribute("src")) ?? toSafePosterUrl(img?.getAttribute("data-src"));
}

function extractCardAnime(card: Element): AnimeData | null {
    const titleLink = card.querySelector(SELECTORS.TITLE_LINK) as HTMLAnchorElement | null;
    if (!titleLink) return null;

    const slug = extractSlugFromHref(titleLink.getAttribute("href") || "");
    if (!slug) return null;

    const animeTitle = titleLink.textContent?.trim() || "";
    if (!animeTitle) return null;

    return {
        animeId: slug,
        animeTitle,
        animeSlug: slug,
        posterUrl: extractCardPosterUrl(card),
    };
}

// Trailing-suffix patterns stripped from the title source string, applied to
// both meta[og:title] and document.title (the watch page's og:title is the
// same noisy SEO string as document.title, unlike the detail page's clean
// og:title). Order matters: brand suffix first, then the episode marker.
const TITLE_SUFFIX_PATTERNS: readonly RegExp[] = [
    /\s*[-|]\s+Anichi\b.*$/i,
    /\s*[-|]?\s*Episode\s+\d+.*$/i,
    /\s*[-|]?\s*Ep\.?\s*\d+.*$/i,
];

function stripTitleAffixes(raw: string): string {
    let stripped = raw.replace(/^Watch\s+/i, "");
    for (const pattern of TITLE_SUFFIX_PATTERNS) {
        stripped = stripped.replace(pattern, "");
    }
    return stripped.trim();
}

// `??` alone would accept an empty string from `.trim()` as a "found" value,
// so this enforces "non-empty" explicitly instead.
function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
    return values.find((value) => !!value && value.length > 0);
}

function readDataEnTitle(): string | undefined {
    for (const selector of TITLE_ATTR_SELECTORS) {
        const dataEn = document.querySelector(selector)?.getAttribute("data-en")?.trim();
        if (dataEn) return dataEn;
    }
    return undefined;
}

function readWatchPageTitle(fallback: string): string {
    // Precedence: data-en attribute on the page's primary title element ->
    // meta og:title (stripped) -> document.title (stripped) -> slug fallback.
    const fromAttr = readDataEnTitle();
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim();
    const fromMeta = ogTitle ? stripTitleAffixes(ogTitle) : undefined;
    const docTitle = (document.title || "").trim();
    const fromDocTitle = docTitle ? stripTitleAffixes(docTitle) : undefined;

    return firstNonEmpty(fromAttr, fromMeta, fromDocTitle) ?? fallback;
}

function extractWatchPagePosterUrl(): string | undefined {
    // On both single-anime pages, og:image is present and correct (same CDN
    // URL as the list-card poster for the same title).
    const content = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    return toSafePosterUrl(content);
}

function extractWatchPageAnime(): AnimeData | null {
    const { pathname } = window.location;
    const slug = matchSlug(pathname, ANIME_PATH_RE) ?? matchSlug(pathname, WATCH_PATH_RE);
    if (!slug) return null;

    return {
        animeId: slug,
        animeTitle: readWatchPageTitle(slug),
        animeSlug: slug,
        posterUrl: extractWatchPagePosterUrl(),
    };
}

// The anime page (#series-page) and watch page (#watch-main) share these data attributes.
const PAGE_ROOT_SELECTOR = "#series-page, #watch-main";
const WATCH_URL_PATH_RE = /^\/watch\/(?<slug>[^/]+)\/?$/;

function readPositiveInt(value: string | null | undefined): number | undefined {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function readNextEpisode(): NextEpisode | undefined {
    const block = document.querySelector("#watch-next-ep");
    const airingAt = readPositiveInt(block?.getAttribute("data-air-at"));
    const episode = readPositiveInt(block?.querySelector(".watch-next-ep__ep")?.textContent?.match(/\d+/)?.[0]);
    return airingAt && episode ? { episode, airingAt } : undefined;
}

function extractPageMetadata(): PageAnimeMetadata | null {
    const root = document.querySelector(PAGE_ROOT_SELECTOR);
    if (!root) return null;

    let slug: string | null = null;
    try {
        slug = matchSlug(new URL(root.getAttribute("data-url") ?? "", "https://anichi.to").pathname, WATCH_URL_PATH_RE);
    } catch {
        slug = null;
    }
    slug ??= extractWatchPageAnime()?.animeSlug ?? null;
    if (!slug) return null;

    return {
        animeId: slug,
        anilistId: readPositiveInt(root.getAttribute("data-anilist-id")),
        malId: readPositiveInt(root.getAttribute("data-mal-id")),
        nextEpisode: readNextEpisode(),
    };
}

function getInjectionTarget(card: Element): Element | null {
    const poster = card.querySelector<HTMLElement>(SELECTORS.POSTER);
    if (!poster) return null;
    if (poster.style.position !== "relative") {
        // Idempotent — keeps overlay positioning predictable across re-renders.
        poster.style.position = "relative";
    }
    return poster;
}

export const anichiAdapter: SiteAdapter = {
    id: "anichi",
    // The content script is loaded on <all_urls> by the manifest, but the
    // adapter scopes itself to anichi.to so the MutationObserver and other
    // page-wide setup don't run on unrelated sites that happen to use generic
    // `.item` / `#list-items` markup.
    matches: (url) => isAnichiHost(url.hostname),
    containerSelector: SELECTORS.CONTAINER,
    cardSelector: SELECTORS.ITEM,
    extractAnime: extractCardAnime,
    getInjectionTarget,
    watchPage: {
        matches: (url) =>
            isAnichiHost(url.hostname) && (ANIME_PATH_RE.test(url.pathname) || WATCH_PATH_RE.test(url.pathname)),
        extractAnime: extractWatchPageAnime,
        extractMetadata: extractPageMetadata,
    },
};
