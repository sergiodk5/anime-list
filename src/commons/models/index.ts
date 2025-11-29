export interface Link {
    name: string;
    url: string;
    malId?: string | number;
}

export enum StorageKeys {
    EPISODE_PROGRESS = "episodeProgress",
    PLAN_TO_WATCH = "planToWatch",
    HIDDEN_ANIME = "hiddenAnime",
    TILE_ORDER = "tileOrder",
}

export interface EpisodeProgress {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
    currentEpisode: number;
    episodeId: string;
    lastWatched: string;
    totalEpisodes?: number;
}

export interface PlanToWatch {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
    addedAt: string;
}

export interface AnimeData {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
}

export interface TileOrder {
    animeIds: string[];
    lastUpdated: string;
}

// Export architecture types
export * from "./architecture";
