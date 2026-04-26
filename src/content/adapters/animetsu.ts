import type { AnimeData } from "@/commons/models";
import type { SiteAdapter } from "./types";

const HOST = "animetsu.live";

// Anchors to anime cards on browse / list pages. The :has() filter excludes
// non-card anchors (nav links, breadcrumbs, etc.) that may also point at /anime/.
const CARD_SELECTOR = 'a[href^="/anime/"]:has(.aspect-cover)';
const TITLE_SELECTOR = ".line-clamp-2";

// Path shape: /anime/{mongoId}, optionally followed by extra segments
// (episode pages reuse the same prefix). Hex Mongo IDs are 24 chars, but we
// accept any non-empty segment for forward compatibility.
const WATCH_PATH_RE = /^\/anime\/([^/?#]+)/;

// Watch-page header candidates, ordered most- to least- specific. Used as a
// visible-DOM fallback when document.title hasn't been hydrated yet.
const WATCH_TITLE_SELECTORS = ["div.flex-center.font-extrabold", "h1", "h2", "[class*='title']"];

function extractCardAnime(card: Element): AnimeData | null {
    const href = card.getAttribute("href") || "";
    const idMatch = href.match(/^\/anime\/([^/?#]+)/);
    if (!idMatch) return null;

    const animeId = idMatch[1];
    const titleEl = card.querySelector(TITLE_SELECTOR);
    const animeTitle = titleEl?.textContent?.trim() || "";
    if (!animeTitle) return null;

    return {
        animeId,
        animeTitle,
        animeSlug: animeId,
    };
}

function readWatchPageTitle(fallback: string): string {
    const docTitle = document.title?.trim();
    // Animetsu sets document.title to the anime title once the page hydrates.
    // The literal "Animetsu" appears before hydration — treat that as not yet
    // populated and fall back to a DOM scan.
    if (docTitle && docTitle.toLowerCase() !== "animetsu") {
        return docTitle;
    }
    for (const selector of WATCH_TITLE_SELECTORS) {
        const el = document.querySelector(selector);
        const text = el?.textContent?.trim();
        if (text) return text;
    }
    return fallback;
}

function extractWatchPageAnime(): AnimeData | null {
    const idMatch = window.location.pathname.match(WATCH_PATH_RE);
    if (!idMatch) return null;

    const animeId = idMatch[1];
    const animeTitle = readWatchPageTitle(animeId);

    return {
        animeId,
        animeTitle,
        animeSlug: animeId,
    };
}

function getInjectionTarget(card: Element): Element | null {
    // The poster wrapper is the card's first child. Its inner div carries
    // Tailwind's `relative` class, which is the natural container for our
    // absolute-positioned controls overlay.
    const posterWrapper = card.firstElementChild as HTMLElement | null;
    if (!posterWrapper) return null;

    const innerRelative = posterWrapper.querySelector<HTMLElement>(":scope > .relative");
    const target = innerRelative ?? posterWrapper;

    if (target instanceof HTMLElement && target.style.position !== "relative") {
        // Idempotent — keeps overlay positioning predictable across SPA re-renders.
        target.style.position = "relative";
    }
    return target;
}

export const animetsuAdapter: SiteAdapter = {
    id: "animetsu",
    matches: (url) => url.host === HOST || url.host.endsWith(`.${HOST}`),
    // No dedicated list container — cards live inside the page's main grid.
    // The empty selector keeps the container-based code paths inert.
    containerSelector: "body",
    cardSelector: CARD_SELECTOR,
    extractAnime: extractCardAnime,
    getInjectionTarget,
    watchPage: {
        // Match /anime/{id} and any nested path (e.g. /anime/{id}/episode/3)
        // but NOT bare /anime or /browse.
        matches: (url) => WATCH_PATH_RE.test(url.pathname),
        extractAnime: extractWatchPageAnime,
    },
    supportsClearHiddenButton: false,
    supportsDragAndDrop: false,
};
