import type { AnimeStatus, ValidationResult } from "@/commons/models/architecture";
import { AnimeAction } from "@/commons/models/architecture";

/**
 * Validates anime state transitions according to business rules
 * Implements the exact state logic requirements:
 *
 * Clean State: Can add to plan, can add to watch, can hide
 * Plan State: Can remove from plan, can add to watch (removes from plan), CANNOT hide
 * Watch State: Can remove from watch, can update episode, CANNOT add to plan, CANNOT hide
 * Hidden State: Can unhide, CANNOT add to plan, CANNOT add to watch
 */
export class AnimeStateValidator {
    /**
     * Validate if an action is allowed for the current anime status
     */
    static validateTransition(currentStatus: AnimeStatus, action: AnimeAction): ValidationResult {
        // Hidden State - only unhide is allowed
        if (currentStatus.isHidden) {
            switch (action) {
                case AnimeAction.UNHIDE:
                    return { allowed: true };
                case AnimeAction.ADD_TO_PLAN:
                    return { allowed: false, reason: "Cannot add hidden anime to plan list" };
                case AnimeAction.ADD_TO_WATCH:
                    return { allowed: false, reason: "Cannot add hidden anime to watch list" };
                case AnimeAction.HIDE:
                    return { allowed: false, reason: "Anime is already hidden" };
                default:
                    return { allowed: false, reason: "Action not available for hidden anime" };
            }
        }

        // Watch State - can remove from watch, update episode, but cannot plan or hide
        if (currentStatus.isTracked) {
            switch (action) {
                case AnimeAction.REMOVE_FROM_WATCH:
                    return { allowed: true };
                case AnimeAction.UPDATE_EPISODE:
                    return { allowed: true };
                case AnimeAction.ADD_TO_PLAN:
                    return { allowed: false, reason: "Cannot add to plan while watching" };
                case AnimeAction.HIDE:
                    return { allowed: false, reason: "Cannot hide while watching" };
                case AnimeAction.ADD_TO_WATCH:
                    return { allowed: false, reason: "Anime is already being watched" };
                default:
                    return { allowed: false, reason: "Action not available for watched anime" };
            }
        }

        // Plan State - can remove from plan, add to watch (removes from plan), but cannot hide
        if (currentStatus.isPlanned) {
            switch (action) {
                case AnimeAction.REMOVE_FROM_PLAN:
                    return { allowed: true };
                case AnimeAction.ADD_TO_WATCH:
                    return {
                        allowed: true,
                        removesFromPlan: true,
                        requiresEpisodeInput: true,
                    };
                case AnimeAction.HIDE:
                    return { allowed: false, reason: "Cannot hide planned anime" };
                case AnimeAction.ADD_TO_PLAN:
                    return { allowed: false, reason: "Anime is already in plan list" };
                default:
                    return { allowed: false, reason: "Action not available for planned anime" };
            }
        }

        // Clean State - can add to plan, add to watch, or hide
        if (!currentStatus.isPlanned && !currentStatus.isTracked && !currentStatus.isHidden) {
            switch (action) {
                case AnimeAction.ADD_TO_PLAN:
                    return { allowed: true };
                case AnimeAction.ADD_TO_WATCH:
                    return { allowed: true, requiresEpisodeInput: true };
                case AnimeAction.HIDE:
                    return { allowed: true };
                case AnimeAction.REMOVE_FROM_PLAN:
                    return { allowed: false, reason: "Anime is not in plan list" };
                case AnimeAction.REMOVE_FROM_WATCH:
                    return { allowed: false, reason: "Anime is not being watched" };
                case AnimeAction.UPDATE_EPISODE:
                    return { allowed: false, reason: "Anime is not being watched" };
                case AnimeAction.UNHIDE:
                    return { allowed: false, reason: "Anime is not hidden" };
                default:
                    return { allowed: false, reason: "Unknown action" };
            }
        }

        // Should not reach here, but handle edge cases
        return { allowed: false, reason: "Invalid anime state" };
    }

    /**
     * Get available actions for the current status
     */
    static getAvailableActions(currentStatus: AnimeStatus): AnimeAction[] {
        const availableActions: AnimeAction[] = [];

        // Test each possible action
        Object.values(AnimeAction).forEach((action) => {
            const validation = this.validateTransition(currentStatus, action);
            if (validation.allowed) {
                availableActions.push(action);
            }
        });

        return availableActions;
    }

    /**
     * Get user-friendly state description
     */
    static getStateDescription(currentStatus: AnimeStatus): string {
        if (currentStatus.isHidden) {
            return "Hidden";
        }
        if (currentStatus.isTracked) {
            return `Watching (Episode ${currentStatus.progress?.currentEpisode || 1})`;
        }
        if (currentStatus.isPlanned) {
            return "Planned to Watch";
        }
        return "Not in any list";
    }

    /**
     * Get recommended actions for current state
     */
    static getRecommendedActions(currentStatus: AnimeStatus): AnimeAction[] {
        if (currentStatus.isHidden) {
            return [AnimeAction.UNHIDE];
        }
        if (currentStatus.isTracked) {
            return [AnimeAction.UPDATE_EPISODE, AnimeAction.REMOVE_FROM_WATCH];
        }
        if (currentStatus.isPlanned) {
            return [AnimeAction.ADD_TO_WATCH, AnimeAction.REMOVE_FROM_PLAN];
        }
        return [AnimeAction.ADD_TO_PLAN, AnimeAction.ADD_TO_WATCH, AnimeAction.HIDE];
    }
}
