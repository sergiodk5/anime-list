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
// links and watch-page URLs share this pattern.
const WATCH_PATH_RE = /^\/watch\/([^/]+)\/ep-\d+/;

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
    };
}

function readWatchPageTitle(fallback: string): string {
    // Anikoto's document.title typically contains the anime name plus episode
    // info. The format varies, so we trim any leading "Watch " prefix and any
    // trailing site suffix separated by " - " or " | ".
    const docTitle = (document.title || "").trim();
    if (docTitle) {
        const stripped = docTitle
            .replace(/^Watch\s+/i, "")
            .split(/\s+[-|]\s+/)[0]
            .replace(/\s+Episode\s+\d+.*$/i, "")
            .replace(/\s+Ep\.?\s*\d+.*$/i, "")
            .trim();
        if (stripped) return stripped;
    }
    for (const selector of WATCH_TITLE_SELECTORS) {
        const el = document.querySelector(selector);
        const text = el?.textContent?.trim();
        if (text) return text;
    }
    return fallback;
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
    // Anikoto is currently our only target site, but the content script runs
    // on <all_urls>. Returning true keeps the script functional anywhere a
    // page happens to expose the same DOM shape (e.g. mirrors), and lets the
    // test suite drive the adapter without spoofing a hostname.
    matches: () => true,
    containerSelector: SELECTORS.CONTAINER,
    cardSelector: SELECTORS.ITEM,
    extractAnime: extractCardAnime,
    getInjectionTarget,
    watchPage: {
        matches: (url) => WATCH_PATH_RE.test(url.pathname),
        extractAnime: extractWatchPageAnime,
    },
};
