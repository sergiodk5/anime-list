/**
 * Content script specific TypeScript types and interfaces
 * Provides type definitions for the modular content script architecture
 */

// Export all interfaces and types used across content script modules
export interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
    element: HTMLDivElement;
}

export interface AnimeControls {
    container: HTMLElement;
    buttons: HTMLElement[];
}

export enum PageType {
    LIST_PAGE = "LIST_PAGE",
    SINGLE_PAGE = "SINGLE_PAGE",
    UNKNOWN = "UNKNOWN",
}

export enum ContentFeature {
    LIST_PAGE_LOGIC = "LIST_PAGE_LOGIC",
    SINGLE_PAGE_MODAL = "SINGLE_PAGE_MODAL",
}

// DOM Selectors constants
export const SELECTORS = {
    CONTAINER: ".film_list-wrap",
    ITEM: ".flw-item",
    POSTER: ".film-poster",
    TITLE_LINK: ".film-name a",
} as const;

// Re-export common types from commons for convenience
export type { AnimeData, AnimeStatus } from "@/commons/models";
