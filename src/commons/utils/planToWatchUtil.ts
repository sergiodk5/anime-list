import type { PlanToWatch } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { RecordStorageUtil } from "./storageUtil";

/**
 * Utility for managing plan to watch storage
 * Handles CRUD operations for anime planning system
 */
export class PlanToWatchUtil {
    private static readonly STORAGE_KEY = StorageKeys.PLAN_TO_WATCH;

    /**
     * Get all plan to watch records
     */
    static async getAll(): Promise<Record<string, PlanToWatch>> {
        return RecordStorageUtil.getAll<PlanToWatch>(this.STORAGE_KEY);
    }

    /**
     * Get all plan to watch as an array
     */
    static async getAllAsArray(): Promise<PlanToWatch[]> {
        return RecordStorageUtil.getAllAsArray<PlanToWatch>(this.STORAGE_KEY);
    }

    /**
     * Get plan to watch by anime ID
     */
    static async getByAnimeId(animeId: string): Promise<PlanToWatch | null> {
        return RecordStorageUtil.getById<PlanToWatch>(this.STORAGE_KEY, animeId);
    }

    /**
     * Add anime to plan to watch
     */
    static async add(plan: PlanToWatch): Promise<void> {
        await RecordStorageUtil.save<PlanToWatch>(this.STORAGE_KEY, plan.animeId, plan);
    }

    /**
     * Remove anime from plan to watch
     */
    static async remove(animeId: string): Promise<void> {
        await RecordStorageUtil.delete(this.STORAGE_KEY, animeId);
    }

    /**
     * Check if anime is planned to watch
     */
    static async isPlanned(animeId: string): Promise<boolean> {
        return RecordStorageUtil.exists(this.STORAGE_KEY, animeId);
    }

    /**
     * Clear all plan to watch
     */
    static async clear(): Promise<void> {
        await RecordStorageUtil.clear(this.STORAGE_KEY);
    }

    /**
     * Get recently added plans (sorted by addedAt)
     */
    static async getRecentlyAdded(limit?: number): Promise<PlanToWatch[]> {
        const allPlans = await this.getAllAsArray();
        const sorted = allPlans.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        return limit ? sorted.slice(0, limit) : sorted;
    }

    /**
     * Get plans added within a date range
     */
    static async getByDateRange(startDate: Date, endDate: Date): Promise<PlanToWatch[]> {
        const allPlans = await this.getAllAsArray();
        return allPlans.filter((plan) => {
            const addedDate = new Date(plan.addedAt);
            return addedDate >= startDate && addedDate <= endDate;
        });
    }

    /**
     * Search plans by title
     */
    static async searchByTitle(searchTerm: string): Promise<PlanToWatch[]> {
        const allPlans = await this.getAllAsArray();
        const lowerSearchTerm = searchTerm.toLowerCase();
        return allPlans.filter((plan) => plan.animeTitle.toLowerCase().includes(lowerSearchTerm));
    }
}
