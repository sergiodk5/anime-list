import type { CompletedAnime } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { BaseRepository } from "./BaseRepository";

/**
 * Repository for managing completed anime data
 * Handles anime that user has finished watching
 */
export class CompletedAnimeRepository extends BaseRepository<CompletedAnime> {
    constructor() {
        super(StorageKeys.COMPLETED_ANIME);
    }

    async create(completed: CompletedAnime): Promise<void> {
        const allCompleted = await this.getAllAsRecord();
        allCompleted[completed.animeId] = completed;
        await this.setAllAsRecord(allCompleted);
    }

    async findById(animeId: string): Promise<CompletedAnime | null> {
        const allCompleted = await this.getAllAsRecord();
        return allCompleted[animeId] || null;
    }

    async findAll(): Promise<CompletedAnime[]> {
        const allCompleted = await this.getAllAsRecord();
        return Object.values(allCompleted);
    }

    async update(animeId: string, data: Partial<CompletedAnime>): Promise<void> {
        const allCompleted = await this.getAllAsRecord();
        if (allCompleted[animeId]) {
            allCompleted[animeId] = { ...allCompleted[animeId], ...data };
            await this.setAllAsRecord(allCompleted);
        }
    }

    async delete(animeId: string): Promise<void> {
        const allCompleted = await this.getAllAsRecord();
        delete allCompleted[animeId];
        await this.setAllAsRecord(allCompleted);
    }

    async exists(animeId: string): Promise<boolean> {
        const allCompleted = await this.getAllAsRecord();
        return animeId in allCompleted;
    }

    async clear(): Promise<void> {
        await this.clearStorage();
    }

    async count(): Promise<number> {
        const allCompleted = await this.getAllAsRecord();
        return Object.keys(allCompleted).length;
    }
}
