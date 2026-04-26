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
    watchPage: WatchPageAdapter | null;
    /**
     * Whether the host has a dedicated anime-list container suitable for
     * the "Clear Hidden" management button. Defaults to true.
     */
    supportsClearHiddenButton?: boolean;
    /**
     * Whether the host's tile layout supports tile drag-and-drop / folders.
     * Currently both features are tightly coupled to the HiAnime DOM, so any
     * additional adapter must opt in explicitly. Defaults to true.
     */
    supportsDragAndDrop?: boolean;
}
