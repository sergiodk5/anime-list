import type { AnimeData } from "@/commons/models";
import type { SiteAdapter } from "./types";

const SELECTORS = {
    CONTAINER: ".film_list-wrap",
    ITEM: ".flw-item",
    POSTER: ".film-poster",
    TITLE_LINK: ".film-name a",
} as const;

const WATCH_PAGE_TITLE_SELECTORS = [
    ".ani_detail-info h2",
    ".watch-detail .title",
    "h1.anime-title",
    "h1",
    "h2",
    "[class*='title']",
    ".film-name",
    ".anime-title",
];

function extractCardAnime(card: Element): AnimeData | null {
    const titleLink = card.querySelector(SELECTORS.TITLE_LINK) as HTMLAnchorElement | null;
    if (!titleLink) return null;

    const href = titleLink.getAttribute("href") || "";
    const title = titleLink.getAttribute("title") || titleLink.textContent?.trim() || "";

    const idMatch = href.match(/\/(?:watch\/)?([^/]+)$/);
    if (!idMatch) return null;

    const slug = idMatch[1];
    const numericIdMatch = slug.match(/-(\d+)$/);
    const animeId = numericIdMatch ? numericIdMatch[1] : slug;

    return {
        animeId,
        animeTitle: title,
        animeSlug: slug,
    };
}

function extractWatchPageAnime(): AnimeData | null {
    const url = window.location.href;
    const urlMatch = url.match(/\/watch\/([^/?]+)/);
    if (!urlMatch) return null;

    const originalSlug = urlMatch[1];

    let animeId = originalSlug;
    const numericIdMatch = originalSlug.match(/-(\d+)$/);
    if (numericIdMatch) {
        animeId = numericIdMatch[1];
    }

    let animeTitle = originalSlug;
    let titleSelectorUsed = "none";
    for (const selector of WATCH_PAGE_TITLE_SELECTORS) {
        const element = document.querySelector(selector);
        if (element?.textContent?.trim()) {
            animeTitle = element.textContent.trim();
            titleSelectorUsed = selector;
            break;
        }
    }

    const animeData: AnimeData = {
        animeId,
        animeTitle,
        animeSlug: originalSlug.toLowerCase(),
    };

    (animeData as AnimeData & { debugInfo?: unknown }).debugInfo = {
        url,
        originalSlug,
        extractionStrategy: numericIdMatch ? "numeric-suffix" : "full-slug",
        titleSelectorUsed,
    };

    return animeData;
}

export const hianimeAdapter: SiteAdapter = {
    id: "hianime",
    matches: () => true,
    containerSelector: SELECTORS.CONTAINER,
    cardSelector: SELECTORS.ITEM,
    extractAnime: extractCardAnime,
    getInjectionTarget: (card) => card.querySelector(SELECTORS.POSTER),
    watchPage: {
        matches: (url) => url.href.includes("/watch/"),
        extractAnime: extractWatchPageAnime,
    },
};
