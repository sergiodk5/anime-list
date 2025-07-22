/**
 * Business rule validation logic for anime state management
 * Centralizes all business logic for anime actions
 */

import type { AnimeStatus } from "../types/ContentTypes";

export class BusinessRules {
    /**
     * Check if anime can be added to plan list
     * Only if not planned, not watching, and not hidden
     */
    static canAddToPlan(status: AnimeStatus): boolean {
        return !status.isPlanned && !status.isTracked && !status.isHidden;
    }

    /**
     * Check if anime can start watching
     * Only if not already watching and not hidden
     */
    static canStartWatching(status: AnimeStatus): boolean {
        return !status.isTracked && !status.isHidden;
    }

    /**
     * Check if anime can be hidden
     * Only if not planned and not watching
     */
    static canHide(status: AnimeStatus): boolean {
        return !status.isPlanned && !status.isTracked && !status.isHidden;
    }

    /**
     * Check if anime can be removed from plan
     * Only if currently planned
     */
    static canRemoveFromPlan(status: AnimeStatus): boolean {
        return status.isPlanned;
    }

    /**
     * Check if anime can stop watching
     * Only if currently watching
     */
    static canStopWatching(status: AnimeStatus): boolean {
        return status.isTracked;
    }

    /**
     * Check if anime can be unhidden
     * Only if currently hidden
     */
    static canUnhide(status: AnimeStatus): boolean {
        return status.isHidden;
    }

    /**
     * Get user-friendly error messages for blocked actions
     */
    static getBlockedActionMessage(action: string, status: AnimeStatus): string {
        if (action === "hide" && status.isPlanned) {
            return "Cannot hide planned anime. Remove from plan first.";
        }
        if (action === "hide" && status.isTracked) {
            return "Cannot hide currently watching anime. Stop watching first.";
        }
        if (action === "plan" && status.isTracked) {
            return "Cannot add to plan while watching. Stop watching first.";
        }
        if (action === "plan" && status.isHidden) {
            return "Cannot add hidden anime to plan. Remove from hidden first.";
        }
        if (action === "startWatching" && status.isPlanned) {
            return "This anime is already planned. Start watching to begin tracking episodes.";
        }
        if (action === "startWatching" && status.isHidden) {
            return "Cannot start watching hidden anime. Remove from hidden first.";
        }

        // Generic fallback message
        return "This action is not allowed for this anime.";
    }

    /**
     * Get the display priority for actions (lower numbers = higher priority)
     */
    static getActionPriority(action: string, status: AnimeStatus): number {
        if (status.isTracked) {
            if (action === "episodeControls") return 1;
            if (action === "stopWatching") return 2;
        }

        if (status.isPlanned) {
            if (action === "startWatching") return 1;
            if (action === "removePlan") return 2;
        }

        if (status.isHidden) {
            if (action === "unhide") return 1;
        }

        // Default actions for untracked anime
        if (action === "startWatching") return 1;
        if (action === "addToPlan") return 2;
        if (action === "hide") return 3;

        return 99; // Low priority for unknown actions
    }
}
