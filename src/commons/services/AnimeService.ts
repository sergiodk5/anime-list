import type {
    ActionResult,
    AnimeData,
    AnimeStatus,
    EpisodeProgress,
    PlanToWatch,
    ValidationResult,
} from "@/commons/models";
import { AnimeAction } from "@/commons/models";
import { EpisodeProgressRepository, HiddenAnimeRepository, PlanToWatchRepository } from "@/commons/repositories";
import { AnimeStateValidator } from "./AnimeStateValidator";

/**
 * Service class that coordinates anime-related operations across multiple repositories
 * Implements high-level business logic for anime state management
 */
export class AnimeService {
    private readonly episodeProgressRepository: EpisodeProgressRepository;
    private readonly planToWatchRepository: PlanToWatchRepository;
    private readonly hiddenAnimeRepository: HiddenAnimeRepository;
    private readonly stateValidator: AnimeStateValidator;

    constructor(
        episodeProgressRepository?: EpisodeProgressRepository,
        planToWatchRepository?: PlanToWatchRepository,
        hiddenAnimeRepository?: HiddenAnimeRepository,
    ) {
        this.episodeProgressRepository = episodeProgressRepository ?? new EpisodeProgressRepository();
        this.planToWatchRepository = planToWatchRepository ?? new PlanToWatchRepository();
        this.hiddenAnimeRepository = hiddenAnimeRepository ?? new HiddenAnimeRepository();
        this.stateValidator = new AnimeStateValidator();
    }

    /**
     * Get the current status of an anime
     */
    async getAnimeStatus(animeId: string): Promise<AnimeStatus> {
        const [episodeProgress, planToWatch, isHidden] = await Promise.all([
            this.episodeProgressRepository.findById(animeId),
            this.planToWatchRepository.findById(animeId),
            this.hiddenAnimeRepository.exists(animeId),
        ]);

        return {
            isTracked: !!episodeProgress,
            isPlanned: !!planToWatch,
            isHidden,
            progress: episodeProgress || undefined,
            plan: planToWatch || undefined,
        };
    }

    /**
     * Validate if an action is allowed for an anime
     */
    private async validateAction(animeId: string, action: AnimeAction): Promise<ValidationResult> {
        const currentStatus = await this.getAnimeStatus(animeId);
        return AnimeStateValidator.validateTransition(currentStatus, action);
    }

    /**
     * Add anime to plan to watch list
     * This is the main "add to watch list" functionality
     */
    async addToPlanToWatch(animeData: AnimeData): Promise<ActionResult> {
        try {
            const currentStatus = await this.getAnimeStatus(animeData.animeId);
            const validation = await this.validateAction(animeData.animeId, AnimeAction.ADD_TO_PLAN);

            if (!validation.allowed) {
                return {
                    success: false,
                    message: validation.reason || "Cannot add anime to plan to watch",
                    newStatus: currentStatus,
                };
            }

            // Create plan to watch entry
            const planToWatchEntry: PlanToWatch = {
                animeId: animeData.animeId,
                animeTitle: animeData.animeTitle,
                animeSlug: animeData.animeSlug,
                addedAt: new Date().toISOString(),
            };

            await this.planToWatchRepository.create(planToWatchEntry);

            return {
                success: true,
                message: `Added "${animeData.animeTitle}" to plan to watch`,
                newStatus: {
                    isTracked: false,
                    isPlanned: true,
                    isHidden: false,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to add anime to plan to watch",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Remove anime from plan to watch list
     */
    async removeFromPlanToWatch(animeId: string): Promise<ActionResult> {
        try {
            const currentStatus = await this.getAnimeStatus(animeId);
            const validation = await this.validateAction(animeId, AnimeAction.REMOVE_FROM_PLAN);

            if (!validation.allowed) {
                return {
                    success: false,
                    message: validation.reason || "Cannot remove anime from plan to watch",
                    newStatus: currentStatus,
                };
            }

            // Get the anime title before removing
            const planEntry = await this.planToWatchRepository.findById(animeId);
            const animeTitle = planEntry?.animeTitle || "Unknown anime";

            await this.planToWatchRepository.delete(animeId);

            return {
                success: true,
                message: `Removed "${animeTitle}" from plan to watch`,
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to remove anime from plan to watch",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Start watching an anime (adds episode progress)
     */
    async startWatching(animeData: AnimeData, episodeNumber: number = 1): Promise<ActionResult> {
        try {
            const currentStatus = await this.getAnimeStatus(animeData.animeId);
            const validation = await this.validateAction(animeData.animeId, AnimeAction.ADD_TO_WATCH);

            if (!validation.allowed) {
                return {
                    success: false,
                    message: validation.reason || "Cannot start watching anime",
                    newStatus: currentStatus,
                };
            }

            // Create episode progress entry
            const episodeProgress: EpisodeProgress = {
                animeId: animeData.animeId,
                animeTitle: animeData.animeTitle,
                animeSlug: animeData.animeSlug,
                currentEpisode: episodeNumber,
                episodeId: `${animeData.animeSlug}-episode-${episodeNumber}`,
                lastWatched: new Date().toISOString(),
            };

            await this.episodeProgressRepository.create(episodeProgress);

            // Remove from plan to watch if it was there
            if (validation.removesFromPlan) {
                await this.planToWatchRepository.delete(animeData.animeId);
            }

            return {
                success: true,
                message: `Started watching "${animeData.animeTitle}" from episode ${episodeNumber}`,
                newStatus: {
                    isTracked: true,
                    isPlanned: false,
                    isHidden: false,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to start watching anime",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Update episode progress for currently watching anime
     */
    async updateEpisodeProgress(animeId: string, episodeNumber: number, totalEpisodes?: number): Promise<ActionResult> {
        try {
            const currentStatus = await this.getAnimeStatus(animeId);
            const validation = await this.validateAction(animeId, AnimeAction.UPDATE_EPISODE);

            if (!validation.allowed) {
                return {
                    success: false,
                    message: validation.reason || "Cannot update episode progress",
                    newStatus: currentStatus,
                };
            }

            const existingProgress = await this.episodeProgressRepository.findById(animeId);
            if (!existingProgress) {
                return {
                    success: false,
                    message: "No episode progress found for this anime",
                    newStatus: currentStatus,
                };
            }

            // Update the episode progress
            const updatedProgress: Partial<EpisodeProgress> = {
                currentEpisode: episodeNumber,
                episodeId: `${existingProgress.animeSlug}-episode-${episodeNumber}`,
                lastWatched: new Date().toISOString(),
            };

            if (totalEpisodes !== undefined) {
                updatedProgress.totalEpisodes = totalEpisodes;
            }

            await this.episodeProgressRepository.update(animeId, updatedProgress);

            return {
                success: true,
                message: `Updated "${existingProgress.animeTitle}" to episode ${episodeNumber}`,
                newStatus: {
                    isTracked: true,
                    isPlanned: false,
                    isHidden: false,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to update episode progress",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Stop watching an anime (removes from episode progress)
     */
    async stopWatching(animeId: string): Promise<ActionResult> {
        try {
            const currentStatus = await this.getAnimeStatus(animeId);
            const validation = await this.validateAction(animeId, AnimeAction.REMOVE_FROM_WATCH);

            if (!validation.allowed) {
                return {
                    success: false,
                    message: validation.reason || "Cannot stop watching anime",
                    newStatus: currentStatus,
                };
            }

            // Get the anime title before removing
            const progressEntry = await this.episodeProgressRepository.findById(animeId);
            const animeTitle = progressEntry?.animeTitle || "Unknown anime";

            await this.episodeProgressRepository.delete(animeId);

            return {
                success: true,
                message: `Stopped watching "${animeTitle}"`,
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to stop watching anime",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Hide an anime from all listings
     */
    async hideAnime(animeId: string): Promise<ActionResult> {
        try {
            const currentStatus = await this.getAnimeStatus(animeId);
            const validation = await this.validateAction(animeId, AnimeAction.HIDE);

            if (!validation.allowed) {
                return {
                    success: false,
                    message: validation.reason || "Cannot hide anime",
                    newStatus: currentStatus,
                };
            }

            // Get anime title for the message
            let animeTitle = "Unknown anime";
            const progressEntry = await this.episodeProgressRepository.findById(animeId);
            const planEntry = await this.planToWatchRepository.findById(animeId);

            if (progressEntry) {
                animeTitle = progressEntry.animeTitle;
            } else if (planEntry) {
                animeTitle = planEntry.animeTitle;
            }

            await this.hiddenAnimeRepository.add(animeId);

            return {
                success: true,
                message: `Hidden "${animeTitle}" from listings`,
                newStatus: {
                    isTracked: currentStatus.isTracked,
                    isPlanned: currentStatus.isPlanned,
                    isHidden: true,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to hide anime",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Unhide an anime (restore to previous status)
     */
    async unhideAnime(animeId: string): Promise<ActionResult> {
        try {
            const currentStatus = await this.getAnimeStatus(animeId);
            const validation = await this.validateAction(animeId, AnimeAction.UNHIDE);

            if (!validation.allowed) {
                return {
                    success: false,
                    message: validation.reason || "Cannot unhide anime",
                    newStatus: currentStatus,
                };
            }

            await this.hiddenAnimeRepository.remove(animeId);

            // Determine new status after unhiding
            const newStatus = await this.getAnimeStatus(animeId);

            return {
                success: true,
                message: "Anime unhidden from listings",
                newStatus,
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to unhide anime",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Get detailed anime information including status and progress
     */
    async getAnimeDetails(animeId: string): Promise<{
        status: AnimeStatus;
        episodeProgress?: EpisodeProgress;
        planToWatch?: PlanToWatch;
        isHidden: boolean;
    }> {
        const [status, episodeProgress, planToWatch, isHidden] = await Promise.all([
            this.getAnimeStatus(animeId),
            this.episodeProgressRepository.findById(animeId),
            this.planToWatchRepository.findById(animeId),
            this.hiddenAnimeRepository.exists(animeId),
        ]);

        return {
            status,
            episodeProgress: episodeProgress || undefined,
            planToWatch: planToWatch || undefined,
            isHidden,
        };
    }

    /**
     * Get all anime across different states (dashboard view)
     */
    async getAllAnime(): Promise<{
        currentlyWatching: EpisodeProgress[];
        planToWatch: PlanToWatch[];
        hiddenAnime: string[];
        totalCount: number;
    }> {
        const [currentlyWatching, planToWatch, hiddenAnime] = await Promise.all([
            this.episodeProgressRepository.findAll(),
            this.planToWatchRepository.findAll(),
            this.hiddenAnimeRepository.findAll(),
        ]);

        return {
            currentlyWatching,
            planToWatch,
            hiddenAnime,
            totalCount: currentlyWatching.length + planToWatch.length + hiddenAnime.length,
        };
    }

    /**
     * Clear all data for an anime (removes from all repositories)
     */
    async clearAnimeData(animeId: string): Promise<ActionResult> {
        try {
            // Get anime title before clearing
            let animeTitle = "Unknown anime";
            const progressEntry = await this.episodeProgressRepository.findById(animeId);
            const planEntry = await this.planToWatchRepository.findById(animeId);

            if (progressEntry) {
                animeTitle = progressEntry.animeTitle;
            } else if (planEntry) {
                animeTitle = planEntry.animeTitle;
            }

            // Remove from all repositories
            await Promise.all([
                this.episodeProgressRepository.delete(animeId).catch(() => {}), // Ignore errors if not found
                this.planToWatchRepository.delete(animeId).catch(() => {}),
                this.hiddenAnimeRepository.remove(animeId).catch(() => {}),
            ]);

            return {
                success: true,
                message: `Cleared all data for "${animeTitle}"`,
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to clear anime data",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Clear all hidden anime (unhide all previously hidden anime)
     * This is more efficient than unhiding each anime individually
     */
    async clearAllHidden(): Promise<ActionResult> {
        try {
            // Get count before clearing for the message
            const hiddenAnime = await this.hiddenAnimeRepository.findAll();
            const count = hiddenAnime.length;

            if (count === 0) {
                return {
                    success: true,
                    message: "No hidden anime to restore",
                    newStatus: {
                        isTracked: false,
                        isPlanned: false,
                        isHidden: false,
                    },
                };
            }

            // Clear all hidden anime at once
            await this.hiddenAnimeRepository.clear();

            return {
                success: true,
                message: `Restored ${count} hidden anime`,
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to clear hidden anime",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
