import { StorageKeys } from "@/commons/models";
import { BaseRepository } from "./BaseRepository";

/**
 * Repository for managing hidden anime data
 * Handles anime that user wants to hide from listings
 * Note: Hidden anime is stored as an array of anime IDs, not objects
 */
export class HiddenAnimeRepository extends BaseRepository<string> {
    constructor() {
        super(StorageKeys.HIDDEN_ANIME);
    }

    /**
     * Create/Add an anime ID to hidden list
     */
    async create(animeId: string): Promise<void> {
        const hiddenList = await this.getAllAsArray();
        if (!hiddenList.includes(animeId)) {
            hiddenList.push(animeId);
            await this.setAllAsArray(hiddenList);
        }
    }

    /**
     * Find if specific anime ID is hidden
     */
    async findById(animeId: string): Promise<string | null> {
        const hiddenList = await this.getAllAsArray();
        return hiddenList.includes(animeId) ? animeId : null;
    }

    /**
     * Find all hidden anime IDs
     */
    async findAll(): Promise<string[]> {
        return this.getAllAsArray();
    }

    /**
     * Update operation is not supported for hidden anime (just IDs).
     * Throws an error if called.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async update(_animeId: string, _data: Partial<string>): Promise<void> {
        throw new Error("Update operation is not supported for HiddenAnimeRepository");
    }

    /**
     * Delete anime ID from hidden list
     */
    async delete(animeId: string): Promise<void> {
        const hiddenList = await this.getAllAsArray();
        const filteredList = hiddenList.filter((id) => id !== animeId);
        await this.setAllAsArray(filteredList);
    }

    /**
     * Check if anime is hidden
     */
    async exists(animeId: string): Promise<boolean> {
        const hiddenList = await this.getAllAsArray();
        return hiddenList.includes(animeId);
    }

    /**
     * Clear all hidden anime
     */
    async clear(): Promise<void> {
        await this.clearStorage();
    }

    /**
     * Get count of hidden anime
     */
    async count(): Promise<number> {
        const hiddenList = await this.getAllAsArray();
        return hiddenList.length;
    }

    // Specific methods for hidden anime

    /**
     * Add anime to hidden list
     */
    async add(animeId: string): Promise<void> {
        await this.create(animeId);
    }

    /**
     * Remove anime from hidden list
     */
    async remove(animeId: string): Promise<void> {
        await this.delete(animeId);
    }

    /**
     * Toggle anime hidden status
     */
    async toggle(animeId: string): Promise<boolean> {
        const isHidden = await this.exists(animeId);
        if (isHidden) {
            await this.remove(animeId);
            return false;
        } else {
            await this.add(animeId);
            return true;
        }
    }

    // Compatibility methods with existing code

    /**
     * Check if anime is hidden (alias for exists)
     */
    async isHidden(animeId: string): Promise<boolean> {
        return this.exists(animeId);
    }

    /**
     * Get all hidden anime IDs (alias for findAll)
     */
    async getAll(): Promise<string[]> {
        return this.findAll();
    }

    /**
     * Get count of hidden anime (alias for count)
     */
    async getCount(): Promise<number> {
        return this.count();
    }
}
