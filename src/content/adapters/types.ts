import type { AnimeData } from "@/commons/models";

export interface WatchPageAdapter {
    matches(url: URL): boolean;
    extractAnime(): AnimeData | null;
}

export interface SiteAdapter {
    id: string;
    matches(url: URL): boolean;
    containerSelector: string;
    cardSelector: string;
    extractAnime(card: Element): AnimeData | null;
    getInjectionTarget(card: Element): Element | null;
    /**
     * Element treated as the user-visible tile for hide/reorder operations.
     * Some sites wrap each card in a grid-slot element (Animetsu) — those
     * must return the wrapper so hiding it collapses the slot rather than
     * leaving an empty padded gap. Defaults to the card itself.
     */
    getTileElement?(card: Element): Element;
    watchPage: WatchPageAdapter | null;
    /**
     * Whether the host has a dedicated anime-list container suitable for
     * the "Clear Hidden" management button. Defaults to true.
     */
    supportsClearHiddenButton?: boolean;
    /**
     * Whether the host's tile layout supports tile drag-and-drop / folders.
     * Defaults to true.
     */
    supportsDragAndDrop?: boolean;
}
