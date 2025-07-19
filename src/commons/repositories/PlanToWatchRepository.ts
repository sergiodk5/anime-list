import type { PlanToWatch } from "@/commons/models";
import { StorageKeys } from "@/commons/models";
import { BaseRepository } from "./BaseRepository";

/**
 * Repository for managing plan to watch data
 * Handles anime that user plans to watch in the future
 */
export class PlanToWatchRepository extends BaseRepository<PlanToWatch> {
    constructor() {
        super(StorageKeys.PLAN_TO_WATCH);
    }

    /**
     * Create a new plan to watch record
     */
    async create(plan: PlanToWatch): Promise<void> {
        const allPlans = await this.getAllAsRecord();
        allPlans[plan.animeId] = plan;
        await this.setAllAsRecord(allPlans);
    }

    /**
     * Find plan to watch by anime ID
     */
    async findById(animeId: string): Promise<PlanToWatch | null> {
        const allPlans = await this.getAllAsRecord();
        return allPlans[animeId] || null;
    }

    /**
     * Find all plan to watch records
     */
    async findAll(): Promise<PlanToWatch[]> {
        const allPlans = await this.getAllAsRecord();
        return Object.values(allPlans);
    }

    /**
     * Update an existing plan to watch record
     */
    async update(animeId: string, data: Partial<PlanToWatch>): Promise<void> {
        const allPlans = await this.getAllAsRecord();
        if (allPlans[animeId]) {
            allPlans[animeId] = { ...allPlans[animeId], ...data };
            await this.setAllAsRecord(allPlans);
        }
    }

    /**
     * Delete plan to watch by anime ID
     */
    async delete(animeId: string): Promise<void> {
        const allPlans = await this.getAllAsRecord();
        delete allPlans[animeId];
        await this.setAllAsRecord(allPlans);
    }

    /**
     * Check if anime is planned
     */
    async exists(animeId: string): Promise<boolean> {
        const allPlans = await this.getAllAsRecord();
        return animeId in allPlans;
    }

    /**
     * Clear all plan to watch records
     */
    async clear(): Promise<void> {
        await this.clearStorage();
    }

    /**
     * Get count of planned anime
     */
    async count(): Promise<number> {
        const allPlans = await this.getAllAsRecord();
        return Object.keys(allPlans).length;
    }

    // Specific methods for plan to watch

    /**
     * Add anime to plan to watch
     */
    async add(plan: PlanToWatch): Promise<void> {
        await this.create(plan); // create handles upsert logic
    }

    /**
     * Get recently added planned anime (sorted by addedAt)
     */
    async getRecentlyAdded(limit: number = 5): Promise<PlanToWatch[]> {
        const allPlans = await this.findAll();
        return allPlans.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()).slice(0, limit);
    }

    /**
     * Search planned anime by title
     */
    async searchByTitle(searchTerm: string): Promise<PlanToWatch[]> {
        const allPlans = await this.findAll();
        const lowerSearchTerm = searchTerm.toLowerCase();
        return allPlans.filter((plan) => plan.animeTitle.toLowerCase().includes(lowerSearchTerm));
    }

    // Compatibility methods with existing code

    /**
     * Check if anime is planned (alias for exists)
     */
    async isPlanned(animeId: string): Promise<boolean> {
        return this.exists(animeId);
    }

    /**
     * Remove anime from plan (alias for delete)
     */
    async remove(animeId: string): Promise<void> {
        await this.delete(animeId);
    }

    /**
     * Get plan by anime ID (alias for findById)
     */
    async getByAnimeId(animeId: string): Promise<PlanToWatch | null> {
        return this.findById(animeId);
    }

    /**
     * Get all plans as a record (for compatibility with existing code)
     */
    async getAll(): Promise<Record<string, PlanToWatch>> {
        return this.getAllAsRecord();
    }

    /**
     * Get all plans as array (for compatibility with existing code)
     */
    async getAllAsArrayCompat(): Promise<PlanToWatch[]> {
        return this.findAll();
    }
}
