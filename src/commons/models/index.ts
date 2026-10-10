export interface Link {
    name: string;
    url: string;
    malId?: string | number;
}

export enum StorageKeys {
    EPISODE_PROGRESS = "episodeProgress",
    PLAN_TO_WATCH = "planToWatch",
    HIDDEN_ANIME = "hiddenAnime",
    COMPLETED_ANIME = "completedAnime",
    ANIME_METADATA = "animeMetadata",
    TILE_ORDER = "tileOrder",
    FOLDER_ORDER = "folderOrder",
}

export interface EpisodeProgress {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
    currentEpisode: number;
    episodeId: string;
    lastWatched: string;
    totalEpisodes?: number;
    posterUrl?: string;
}

export interface PlanToWatch {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
    addedAt: string;
}

export interface CompletedAnime {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
    completedAt: string;
    totalEpisodes?: number;
    posterUrl?: string;
}

export type AiringStatus = "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";

export interface NextEpisode {
    episode: number;
    /** Unix seconds */
    airingAt: number;
}

export interface AnimeMetadata {
    animeId: string;
    anilistId?: number;
    malId?: number;
    /** null when the official total is not known yet */
    totalEpisodes: number | null;
    airingStatus?: AiringStatus;
    nextEpisode?: NextEpisode;
    /** ISO time of the last successful AniList fetch */
    fetchedAt?: string;
    /** Epoch ms when a refresh is due; null means never */
    nextRefreshAt: number | null;
    failureCount?: number;
}

/** IDs and schedule read from an anime or watch page */
export interface PageAnimeMetadata {
    animeId: string;
    anilistId?: number;
    malId?: number;
    nextEpisode?: NextEpisode;
}

export interface AnimeData {
    animeId: string;
    animeTitle: string;
    animeSlug: string;
    posterUrl?: string;
}

export interface TileOrder {
    animeIds: string[];
    lastUpdated: string;
}

export interface Folder {
    id: string;
    name: string;
    borderColor: string;
    createdAt: string;
}

export interface FolderOrder {
    folders: Folder[];
    rootItems: string[];
    folderContents: Record<string, string[]>;
    lastUpdated: string;
}

// Export architecture types
export * from "./architecture";
