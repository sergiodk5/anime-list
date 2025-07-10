import type { EpisodeProgress } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { RecordStorageUtil } from "./storageUtil";

/**
 * Utility for managing episode progress storage
 * Handles CRUD operations for anime episode tracking
 */
export class EpisodeProgressUtil {
    private static readonly STORAGE_KEY = StorageKeys.EPISODE_PROGRESS;

    /**
     * Get all episode progress records
     */
    static async getAll(): Promise<Record<string, EpisodeProgress>> {
        return RecordStorageUtil.getAll<EpisodeProgress>(this.STORAGE_KEY);
    }

    /**
     * Get all episode progress as an array
     */
    static async getAllAsArray(): Promise<EpisodeProgress[]> {
        return RecordStorageUtil.getAllAsArray<EpisodeProgress>(this.STORAGE_KEY);
    }

    /**
     * Get episode progress by anime ID
     */
    static async getByAnimeId(animeId: string): Promise<EpisodeProgress | null> {
        return RecordStorageUtil.getById<EpisodeProgress>(this.STORAGE_KEY, animeId);
    }

    /**
     * Save or update episode progress
     */
    static async save(progress: EpisodeProgress): Promise<void> {
        await RecordStorageUtil.save<EpisodeProgress>(this.STORAGE_KEY, progress.animeId, progress);
    }

    /**
     * Remove episode progress by anime ID
     */
    static async remove(animeId: string): Promise<void> {
        await RecordStorageUtil.delete(this.STORAGE_KEY, animeId);
    }

    /**
     * Check if anime is being tracked
     */
    static async isTracked(animeId: string): Promise<boolean> {
        return RecordStorageUtil.exists(this.STORAGE_KEY, animeId);
    }

    /**
     * Update episode number for an anime
     */
    static async updateEpisode(animeId: string, episodeNumber: number): Promise<void> {
        const progress = await this.getByAnimeId(animeId);
        if (progress) {
            const updatedProgress: EpisodeProgress = {
                ...progress,
                currentEpisode: episodeNumber,
                lastWatched: new Date().toISOString(),
            };
            await this.save(updatedProgress);
        }
    }

    /**
     * Clear all episode progress
     */
    static async clear(): Promise<void> {
        await RecordStorageUtil.clear(this.STORAGE_KEY);
    }

    /**
     * Get recently watched anime (sorted by lastWatched)
     */
    static async getRecentlyWatched(limit?: number): Promise<EpisodeProgress[]> {
        const allProgress = await this.getAllAsArray();
        const sorted = allProgress.sort(
            (a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime(),
        );
        return limit ? sorted.slice(0, limit) : sorted;
    }

    /**
     * Get anime by episode count range
     */
    static async getByEpisodeRange(min: number, max: number): Promise<EpisodeProgress[]> {
        const allProgress = await this.getAllAsArray();
        return allProgress.filter((progress) => progress.currentEpisode >= min && progress.currentEpisode <= max);
    }
}
