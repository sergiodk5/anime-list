import type { EpisodeProgress } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { BaseRepository } from "./BaseRepository";

/**
 * Repository for managing episode progress data
 * Handles currently watching anime with episode tracking
 */
export class EpisodeProgressRepository extends BaseRepository<EpisodeProgress> {
    constructor() {
        super(StorageKeys.EPISODE_PROGRESS);
    }

    /**
     * Create a new episode progress record
     */
    async create(progress: EpisodeProgress): Promise<void> {
        const allProgress = await this.getAllAsRecord();
        allProgress[progress.animeId] = progress;
        await this.setAllAsRecord(allProgress);
    }

    /**
     * Find episode progress by anime ID
     */
    async findById(animeId: string): Promise<EpisodeProgress | null> {
        const allProgress = await this.getAllAsRecord();
        return allProgress[animeId] || null;
    }

    /**
     * Find all episode progress records
     */
    async findAll(): Promise<EpisodeProgress[]> {
        const allProgress = await this.getAllAsRecord();
        return Object.values(allProgress);
    }

    /**
     * Update an existing episode progress record
     */
    async update(animeId: string, data: Partial<EpisodeProgress>): Promise<void> {
        const allProgress = await this.getAllAsRecord();
        if (allProgress[animeId]) {
            allProgress[animeId] = { ...allProgress[animeId], ...data };
            await this.setAllAsRecord(allProgress);
        }
    }

    /**
     * Delete episode progress by anime ID
     */
    async delete(animeId: string): Promise<void> {
        const allProgress = await this.getAllAsRecord();
        delete allProgress[animeId];
        await this.setAllAsRecord(allProgress);
    }

    /**
     * Check if anime is being tracked
     */
    async exists(animeId: string): Promise<boolean> {
        const allProgress = await this.getAllAsRecord();
        return animeId in allProgress;
    }

    /**
     * Clear all episode progress
     */
    async clear(): Promise<void> {
        await this.clearStorage();
    }

    /**
     * Get count of tracked anime
     */
    async count(): Promise<number> {
        const allProgress = await this.getAllAsRecord();
        return Object.keys(allProgress).length;
    }

    // Specific methods for episode progress

    /**
     * Update episode number for tracked anime
     */
    async updateEpisode(animeId: string, episodeNumber: number): Promise<void> {
        const progress = await this.findById(animeId);
        if (progress) {
            await this.update(animeId, {
                currentEpisode: episodeNumber,
                lastWatched: new Date().toISOString(),
            });
        }
    }

    /**
     * Get recently watched anime (sorted by lastWatched)
     */
    async getRecentlyWatched(limit: number = 5): Promise<EpisodeProgress[]> {
        const allProgress = await this.findAll();
        return allProgress
            .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime())
            .slice(0, limit);
    }

    /**
     * Save or update episode progress (upsert operation)
     */
    async save(progress: EpisodeProgress): Promise<void> {
        await this.create(progress); // create handles upsert logic
    }

    /**
     * Get all progress as a record (for compatibility with existing code)
     */
    async getAll(): Promise<Record<string, EpisodeProgress>> {
        return this.getAllAsRecord();
    }

    /**
     * Get all progress as array (for compatibility with existing code)
     */
    async getAllAsArrayCompat(): Promise<EpisodeProgress[]> {
        return this.findAll();
    }

    /**
     * Check if anime is tracked (alias for exists)
     */
    async isTracked(animeId: string): Promise<boolean> {
        return this.exists(animeId);
    }

    /**
     * Remove anime from tracking (alias for delete)
     */
    async remove(animeId: string): Promise<void> {
        await this.delete(animeId);
    }

    /**
     * Get progress by anime ID (alias for findById)
     */
    async getByAnimeId(animeId: string): Promise<EpisodeProgress | null> {
        return this.findById(animeId);
    }
}
