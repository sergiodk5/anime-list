/**
 * Core types and enums for the clean architecture implementation
 */

// Action types that can be performed on anime items
export enum AnimeAction {
    ADD_TO_PLAN = "addToPlan",
    REMOVE_FROM_PLAN = "removeFromPlan",
    ADD_TO_WATCH = "addToWatch",
    REMOVE_FROM_WATCH = "removeFromWatch",
    UPDATE_EPISODE = "updateEpisode",
    HIDE = "hide",
    UNHIDE = "unhide",
}

// Validation result for state transitions
export interface ValidationResult {
    allowed: boolean;
    reason?: string;
    removesFromPlan?: boolean;
    requiresEpisodeInput?: boolean;
}

// Result of performing an action
export interface ActionResult {
    success: boolean;
    message: string;
    newStatus?: AnimeStatus;
    error?: string;
}

// Extended anime status with validation context
export interface AnimeStatus {
    isTracked: boolean;
    isPlanned: boolean;
    isHidden: boolean;
    progress?: EpisodeProgress;
    plan?: PlanToWatch;
}

// UI Control configuration
export interface ControlsConfig {
    buttons: ButtonType[];
    episodeNumber?: number;
}

// Button types available in the UI
export enum ButtonType {
    ADD_TO_PLAN = "addToPlan",
    REMOVE_FROM_PLAN = "removeFromPlan",
    ADD_TO_WATCH = "addToWatch",
    REMOVE_FROM_WATCH = "removeFromWatch",
    EPISODE_CONTROLS = "episodeControls",
    HIDE = "hide",
    UNHIDE = "unhide",
}

// Toast notification types
export interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
    duration: number;
}

// Import existing models
import type { AnimeData, EpisodeProgress, PlanToWatch } from "./index";

// Re-export existing models for convenience
export type { AnimeData, EpisodeProgress, PlanToWatch };
