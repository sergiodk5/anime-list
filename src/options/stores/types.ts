import type { AnimeData, EpisodeProgress, PlanToWatch } from "@/commons/models";

/**
 * Generic async state wrapper for store data
 *
 * @template T The type of data being stored
 */
export interface AsyncState<T> {
    /** The actual data */
    data: T;
    /** Loading state indicator */
    loading: boolean;
    /** Error message if any operation failed */
    error: string | null;
}

/**
 * Store state for anime lists (watching, planned, hidden)
 * Uses both array for iteration and map for O(1) lookups
 */
export interface AnimeListState {
    /** Array of anime items for iteration */
    items: AnimeData[];
    /** Map for O(1) lookup by animeId */
    itemsMap: Record<string, AnimeData>;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: string | null;
    /** Whether the store has been initialized */
    initialized: boolean;
}

/**
 * Episode progress specific state extending AnimeListState
 */
export interface EpisodeProgressState extends Omit<AnimeListState, "items" | "itemsMap"> {
    /** Array of episode progress items */
    items: EpisodeProgress[];
    /** Map for O(1) lookup by animeId */
    itemsMap: Record<string, EpisodeProgress>;
}

/**
 * Plan to watch specific state extending AnimeListState
 */
export interface PlanToWatchState extends Omit<AnimeListState, "items" | "itemsMap"> {
    /** Array of plan to watch items */
    items: PlanToWatch[];
    /** Map for O(1) lookup by animeId */
    itemsMap: Record<string, PlanToWatch>;
}

/**
 * Hidden anime state - uses basic AnimeData since we only need ID and title
 */
export interface HiddenAnimeState extends AnimeListState {
    // Uses the base AnimeListState as-is
}

/**
 * Store action result for optimistic updates
 */
export interface StoreActionResult {
    /** Whether the action succeeded */
    success: boolean;
    /** Error message if action failed */
    error?: string;
    /** Updated item data if applicable */
    data?: unknown;
}
