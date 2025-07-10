import { StorageKeys } from "@/commons/models";
import { ArrayStorageUtil } from "./storageUtil";

/**
 * Utility for managing hidden anime storage
 * Handles CRUD operations for anime hiding system
 */
export class HiddenAnimeUtil {
    private static readonly STORAGE_KEY = StorageKeys.HIDDEN_ANIME;

    /**
     * Get all hidden anime IDs
     */
    static async getAll(): Promise<string[]> {
        return ArrayStorageUtil.getAll<string>(this.STORAGE_KEY);
    }

    /**
     * Add anime to hidden list
     */
    static async add(animeId: string): Promise<void> {
        const isAlreadyHidden = await this.isHidden(animeId);
        if (!isAlreadyHidden) {
            await ArrayStorageUtil.add<string>(this.STORAGE_KEY, animeId);
        }
    }

    /**
     * Remove anime from hidden list
     */
    static async remove(animeId: string): Promise<void> {
        await ArrayStorageUtil.remove<string>(this.STORAGE_KEY, (id) => id === animeId);
    }

    /**
     * Check if anime is hidden
     */
    static async isHidden(animeId: string): Promise<boolean> {
        return ArrayStorageUtil.exists<string>(this.STORAGE_KEY, (id) => id === animeId);
    }

    /**
     * Toggle anime hidden status
     */
    static async toggle(animeId: string): Promise<boolean> {
        const isCurrentlyHidden = await this.isHidden(animeId);
        if (isCurrentlyHidden) {
            await this.remove(animeId);
            return false;
        } else {
            await this.add(animeId);
            return true;
        }
    }

    /**
     * Clear all hidden anime
     */
    static async clear(): Promise<void> {
        await ArrayStorageUtil.clear(this.STORAGE_KEY);
    }

    /**
     * Get count of hidden anime
     */
    static async getCount(): Promise<number> {
        const hiddenList = await this.getAll();
        return hiddenList.length;
    }

    /**
     * Add multiple anime to hidden list
     */
    static async addMultiple(animeIds: string[]): Promise<void> {
        const currentHidden = await this.getAll();
        const newIds = animeIds.filter((id) => !currentHidden.includes(id));

        if (newIds.length > 0) {
            const updatedList = [...currentHidden, ...newIds];
            await ArrayStorageUtil.clear(this.STORAGE_KEY);
            for (const id of updatedList) {
                await ArrayStorageUtil.add<string>(this.STORAGE_KEY, id);
            }
        }
    }

    /**
     * Remove multiple anime from hidden list
     */
    static async removeMultiple(animeIds: string[]): Promise<void> {
        for (const animeId of animeIds) {
            await this.remove(animeId);
        }
    }

    /**
     * Check if any of the provided anime IDs are hidden
     */
    static async hasAnyHidden(animeIds: string[]): Promise<boolean> {
        const hiddenList = await this.getAll();
        return animeIds.some((id) => hiddenList.includes(id));
    }

    /**
     * Filter out hidden anime from a list of anime IDs
     */
    static async filterHidden(animeIds: string[]): Promise<string[]> {
        const hiddenList = await this.getAll();
        return animeIds.filter((id) => !hiddenList.includes(id));
    }
}
