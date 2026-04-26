import type { AnimeData } from "@/commons/models";
import type { SiteAdapter } from "./types";

const HOST = "animetsu.live";

// Anchors to anime cards on browse / list pages. The :has() filter excludes
// non-card anchors (nav links, breadcrumbs, etc.) that may also point at /anime/.
const CARD_SELECTOR = 'a[href^="/anime/"]:has(.aspect-cover)';
const TITLE_SELECTOR = ".line-clamp-2";

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
    watchPage: null,
    supportsClearHiddenButton: false,
    supportsDragAndDrop: false,
};
