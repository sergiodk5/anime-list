import type { AnimeData, EpisodeProgress, PlanToWatch } from "@/commons/models";
import { EpisodeProgressUtil } from "./episodeProgressUtil";
import { HiddenAnimeUtil } from "./hiddenAnimeUtil";
import { PlanToWatchUtil } from "./planToWatchUtil";

/**
 * High-level utility for anime management
 * Provides comprehensive anime tracking operations
 */
export class AnimeUtil {
    /**
     * Get the status of an anime (tracked, planned, hidden, or none)
     */
    static async getAnimeStatus(animeId: string): Promise<{
        isTracked: boolean;
        isPlanned: boolean;
        isHidden: boolean;
        progress?: EpisodeProgress;
        plan?: PlanToWatch;
    }> {
        const [isTracked, isPlanned, isHidden, progress, plan] = await Promise.all([
            EpisodeProgressUtil.isTracked(animeId),
            PlanToWatchUtil.isPlanned(animeId),
            HiddenAnimeUtil.isHidden(animeId),
            EpisodeProgressUtil.getByAnimeId(animeId),
            PlanToWatchUtil.getByAnimeId(animeId),
        ]);

        return {
            isTracked,
            isPlanned,
            isHidden,
            progress: progress || undefined,
            plan: plan || undefined,
        };
    }

    /**
     * Start tracking an anime (moves from plan to progress)
     */
    static async startTracking(animeData: AnimeData, episodeId?: string): Promise<void> {
        // Remove from plan to watch if it exists
        await PlanToWatchUtil.remove(animeData.animeId);

        // Add to episode progress
        const progress: EpisodeProgress = {
            ...animeData,
            currentEpisode: 1,
            episodeId: episodeId || "",
            lastWatched: new Date().toISOString(),
        };

        await EpisodeProgressUtil.save(progress);
    }

    /**
     * Add anime to plan to watch
     */
    static async addToPlan(animeData: AnimeData): Promise<void> {
        const plan: PlanToWatch = {
            ...animeData,
            addedAt: new Date().toISOString(),
        };

        await PlanToWatchUtil.add(plan);
    }

    /**
     * Remove anime from tracking (removes from both progress and plan)
     */
    static async stopTracking(animeId: string): Promise<void> {
        await Promise.all([EpisodeProgressUtil.remove(animeId), PlanToWatchUtil.remove(animeId)]);
    }

    /**
     * Hide an anime
     */
    static async hide(animeId: string): Promise<void> {
        await HiddenAnimeUtil.add(animeId);
    }

    /**
     * Unhide an anime
     */
    static async unhide(animeId: string): Promise<void> {
        await HiddenAnimeUtil.remove(animeId);
    }

    /**
     * Toggle anime hidden status
     */
    static async toggleHidden(animeId: string): Promise<boolean> {
        return HiddenAnimeUtil.toggle(animeId);
    }

    /**
     * Update episode progress
     */
    static async updateEpisode(animeId: string, episodeNumber: number): Promise<void> {
        await EpisodeProgressUtil.updateEpisode(animeId, episodeNumber);
    }

    /**
     * Get all anime data organized by status
     */
    static async getAllAnimeByStatus(): Promise<{
        tracked: EpisodeProgress[];
        planned: PlanToWatch[];
        hidden: string[];
    }> {
        const [tracked, planned, hidden] = await Promise.all([
            EpisodeProgressUtil.getAllAsArray(),
            PlanToWatchUtil.getAllAsArray(),
            HiddenAnimeUtil.getAll(),
        ]);

        return { tracked, planned, hidden };
    }

    /**
     * Search across all anime lists
     */
    static async searchAnime(searchTerm: string): Promise<{
        tracked: EpisodeProgress[];
        planned: PlanToWatch[];
    }> {
        const [tracked, planned] = await Promise.all([
            EpisodeProgressUtil.getAllAsArray(),
            PlanToWatchUtil.searchByTitle(searchTerm),
        ]);

        const lowerSearchTerm = searchTerm.toLowerCase();
        const filteredTracked = tracked.filter((anime) => anime.animeTitle.toLowerCase().includes(lowerSearchTerm));

        return { tracked: filteredTracked, planned };
    }

    /**
     * Get statistics about anime collection
     */
    static async getStatistics(): Promise<{
        totalTracked: number;
        totalPlanned: number;
        totalHidden: number;
        recentlyWatched: EpisodeProgress[];
        recentlyPlanned: PlanToWatch[];
    }> {
        const [tracked, planned, hiddenCount, recentlyWatched, recentlyPlanned] = await Promise.all([
            EpisodeProgressUtil.getAllAsArray(),
            PlanToWatchUtil.getAllAsArray(),
            HiddenAnimeUtil.getCount(),
            EpisodeProgressUtil.getRecentlyWatched(5),
            PlanToWatchUtil.getRecentlyAdded(5),
        ]);

        return {
            totalTracked: tracked.length,
            totalPlanned: planned.length,
            totalHidden: hiddenCount,
            recentlyWatched,
            recentlyPlanned,
        };
    }

    /**
     * Clear all anime data
     */
    static async clearAll(): Promise<void> {
        await Promise.all([EpisodeProgressUtil.clear(), PlanToWatchUtil.clear(), HiddenAnimeUtil.clear()]);
    }

    /**
     * Export all anime data
     */
    static async exportData(): Promise<{
        episodeProgress: Record<string, EpisodeProgress>;
        planToWatch: Record<string, PlanToWatch>;
        hiddenAnime: string[];
        exportedAt: string;
    }> {
        const [episodeProgress, planToWatch, hiddenAnime] = await Promise.all([
            EpisodeProgressUtil.getAll(),
            PlanToWatchUtil.getAll(),
            HiddenAnimeUtil.getAll(),
        ]);

        return {
            episodeProgress,
            planToWatch,
            hiddenAnime,
            exportedAt: new Date().toISOString(),
        };
    }
}
