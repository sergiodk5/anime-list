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
}
