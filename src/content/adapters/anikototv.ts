import type { AnimeData } from "@/commons/models";
import type { SiteAdapter } from "./types";

const SELECTORS = {
    CONTAINER: "#list-items",
    ITEM: ".item",
    POSTER: ".ani.poster",
    TITLE_LINK: "a.name.d-title",
} as const;

// Anikoto has a single per-anime URL shape — the episode player at
// /watch/{slug}/ep-{n}. There is no separate anime detail page, so both card
// links and watch-page URLs share this pattern. Anchored at both ends (with
// an optional trailing slash) so paths like `/watch/foo/ep-1-extra` or
// `/watch/foo/ep-1/other` don't sneak through.
const WATCH_PATH_RE = /^\/watch\/([^/]+)\/ep-\d+\/?$/;

// Anikoto host check used to scope this adapter's site-specific handling to
// anikototv hosts, so unrelated pages with similar paths or DOM structures
// are not treated as Anikoto pages.
const ANIKOTOTV_HOST = "anikototv.to";

function isAnikotoHost(hostname: string): boolean {
    return hostname === ANIKOTOTV_HOST || hostname.endsWith(`.${ANIKOTOTV_HOST}`);
}

// Watch-page heading candidates, ordered most- to least- specific. Used to
// recover the anime title from the DOM when document.title isn't usable.
const WATCH_TITLE_SELECTORS = ["h1.anime-title", "h1", "h2", "[class*='title']", ".anime-title"];

function extractSlugFromHref(href: string): string | null {
    if (!href) return null;
    let pathname = href;
    try {
        pathname = new URL(href, "https://anikototv.to").pathname;
    } catch {
        // Fall through with the raw href; relative paths still work with the
        // regex below.
    }
    const match = pathname.match(WATCH_PATH_RE);
    return match ? match[1] : null;
}

function extractCardPosterUrl(card: Element): string | undefined {
    // The real card markup nests the poster as `.ani.poster > a > img` with a
    // plain absolute `src`. `data-src` is a cheap fallback in case the site
    // ever adopts lazy loading; anything else is treated as "no poster".
    const img = card.querySelector<HTMLImageElement>(`${SELECTORS.POSTER} img`);
    const src = img?.getAttribute("src") || img?.getAttribute("data-src");
    return src || undefined;
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

// Trailing-suffix patterns we strip from document.title. Order matters —
// the site brand suffix is removed first, then the episode marker. Each
// pattern optionally absorbs a preceding " - " / " | " separator so a title
// like "Title - Episode 6 - AnikotoTV" collapses cleanly to "Title" instead
// of leaving a dangling "Title -".
const TITLE_SUFFIX_PATTERNS: RegExp[] = [
    /\s*[-|]\s+(?:Watch\s+)?Anikoto(?:TV)?(?:\s+.*)?$/i,
    /(?:\s*[-|])?\s+Episode\s+\d+.*$/i,
    /(?:\s*[-|])?\s+Ep\.?\s*\d+.*$/i,
];

function readWatchPageTitle(fallback: string): string {
    // Anikoto's document.title typically contains the anime name plus episode
    // info, sometimes prefixed with "Watch " and suffixed with the site brand.
    // We strip only those known affixes — splitting on every " - " / " | "
    // would truncate legitimate titles that contain those separators (e.g.
    // "Steins;Gate - The Movie").
    const docTitle = (document.title || "").trim();
    if (docTitle) {
        let stripped = docTitle.replace(/^Watch\s+/i, "");
        for (const pattern of TITLE_SUFFIX_PATTERNS) {
            stripped = stripped.replace(pattern, "");
        }
        stripped = stripped.trim();
        if (stripped) return stripped;
    }
    for (const selector of WATCH_TITLE_SELECTORS) {
        const el = document.querySelector(selector);
        const text = el?.textContent?.trim();
        if (text) return text;
    }
    return fallback;
}

function extractWatchPagePosterUrl(): string | undefined {
    // Best-effort only — there is no captured watch-page DOM to verify an
    // og:image tag exists, so nothing may depend on this returning a value.
    const content = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    return content || undefined;
}

function extractWatchPageAnime(): AnimeData | null {
    const match = window.location.pathname.match(WATCH_PATH_RE);
    if (!match) return null;

    const slug = match[1];
    const animeTitle = readWatchPageTitle(slug);

    return {
        animeId: slug,
        animeTitle,
        animeSlug: slug,
        posterUrl: extractWatchPagePosterUrl(),
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

export const anikototvAdapter: SiteAdapter = {
    id: "anikototv",
    // The content script is loaded on <all_urls> by the manifest, but the
    // adapter scopes itself to anikototv.to so the MutationObserver and other
    // page-wide setup don't run on unrelated sites that happen to use generic
    // `.item` / `#list-items` markup.
    matches: (url) => isAnikotoHost(url.hostname),
    containerSelector: SELECTORS.CONTAINER,
    cardSelector: SELECTORS.ITEM,
    extractAnime: extractCardAnime,
    getInjectionTarget,
    watchPage: {
        matches: (url) => isAnikotoHost(url.hostname) && WATCH_PATH_RE.test(url.pathname),
        extractAnime: extractWatchPageAnime,
    },
};
