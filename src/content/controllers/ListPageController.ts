/**
 * Controller for anime list pages
 * Orchestrates components and services for the main anime list functionality
 */

import type { AnimeData, AnimeStatus } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import { StyleInjector } from "@/content/components/ui/StyleInjector";
import { PageDetector } from "@/content/services/PageDetector";
import { HideButton } from "../components/buttons/HideButton";
import { PlanButton } from "../components/buttons/PlanButton";
import { WatchingControls } from "../components/buttons/WatchingControls";
import { ToastSystem } from "../components/ui/ToastSystem";
import { AnimeExtractor } from "../services/AnimeExtractor";
import { ContentFeature } from "../types/ContentTypes";

/**
 * Manages the anime list page functionality
 * Coordinates between UI components and business logic
 */
export class ListPageController {
    private static instance: ListPageController;
    private animeService: AnimeService;
    private toastSystem: ToastSystem;
    private observer: MutationObserver;
    private hideButton: HideButton;

    private constructor(animeService: AnimeService, toastSystem: ToastSystem) {
        this.animeService = animeService;
        this.toastSystem = toastSystem;
        this.observer = new MutationObserver(this.handleMutations.bind(this));
        this.hideButton = HideButton.getInstance(this.animeService, this.toastSystem);
    }

    /**
     * Get the singleton instance of the controller
     */
    public static getInstance(animeService: AnimeService, toastSystem: ToastSystem): ListPageController {
        if (!ListPageController.instance) {
            ListPageController.instance = new ListPageController(animeService, toastSystem);
        }
        return ListPageController.instance;
    }

    /**
     * Initialize the list page functionality
     */
    public async initialize(): Promise<void> {
        try {
            // Check if we're on a list page
            if (!PageDetector.shouldRunFeature(ContentFeature.LIST_PAGE_LOGIC)) {
                return;
            }

            // Inject required styles
            StyleInjector.injectStyles();

            // Find the anime list container
            const container = this.findAnimeListContainer();
            if (!container) {
                console.log("Anime list container not found");
                return;
            }

            // Initialize controls for the list
            await this.initializeListControls(container);

            // Hide already hidden anime items
            await this.hideAlreadyHiddenItems(container);

            // Add clear hidden button
            this.addClearHiddenButton(container);

            console.log("AnimeList controls initialized successfully");
        } catch (error) {
            console.error("Error initializing list page controller:", error);
        }
    }

    /**
     * Find the anime list container element
     */
    private findAnimeListContainer(): Element | null {
        const selectors = [".film_list-wrap", ".anime-list", "[class*='list']", ".items-container", "#main-content"];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }

        return null;
    }

    /**
     * Initialize controls for all anime items in the list
     */
    private async initializeListControls(container: Element): Promise<void> {
        const animeItems = container.querySelectorAll(".flw-item, .anime-item, [class*='item']");

        for (const item of animeItems) {
            await this.addControlsToItem(item as HTMLElement);
        }
    }

    /**
     * Add control buttons to a single anime item
     */
    private async addControlsToItem(item: HTMLElement): Promise<void> {
        try {
            const animeData = AnimeExtractor.extractFromListItem(item);
            if (!animeData) {
                return;
            }

            const status = await this.animeService.getAnimeStatus(animeData.animeId);

            // If status is undefined, treat as not tracked
            const safeStatus: AnimeStatus = status || {
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            };

            if (safeStatus.isHidden) {
                return; // Don't add controls to hidden items
            }

            const controlsContainer = this.getOrCreateControlsContainer(item);
            const buttons = await this.createActionButtons(animeData, safeStatus);
            buttons.forEach((button) => controlsContainer.appendChild(button));
        } catch (error) {
            console.error("Error adding controls to item:", error);
        }
    }

    /**
     * Create action buttons based on anime status
     */
    private async createActionButtons(animeData: AnimeData, status: AnimeStatus): Promise<HTMLElement[]> {
        const buttons: HTMLElement[] = [];

        if (status.isTracked) {
            const currentEpisode = status.progress?.currentEpisode ?? 0;
            buttons.push(await WatchingControls.createCombined(animeData, currentEpisode));
        } else if (status.isPlanned) {
            buttons.push(await WatchingControls.createStartButton(animeData));
            buttons.push(await PlanButton.createRemoveButton(animeData));
        } else {
            buttons.push(await PlanButton.create(animeData));
        }

        buttons.push(this.hideButton.create(animeData));
        return buttons;
    }

    /**
     * Get or create the controls container for an anime item
     */
    private getOrCreateControlsContainer(item: HTMLElement): HTMLElement {
        let controlsContainer = item.querySelector(".anime-list-controls") as HTMLElement;

        if (!controlsContainer) {
            controlsContainer = document.createElement("div");
            controlsContainer.className = "anime-list-controls";

            // Find the best position for the controls (poster or item)
            const poster =
                item.querySelector(".film-poster, .anime-poster, .poster") || item.querySelector("img") || item;

            if (poster && poster.parentElement) {
                poster.parentElement.style.position = "relative";
                poster.parentElement.appendChild(controlsContainer);
            } else {
                item.appendChild(controlsContainer);
            }
        }

        return controlsContainer;
    }

    /**
     * Add the "Clear Hidden" button to the page
     */
    private addClearHiddenButton(container: Element): void {
        const clearButton = this.hideButton.createClearHiddenButton();
        container.parentElement?.insertBefore(clearButton, container.nextSibling);
    }

    /**
     * Hide anime items that are already marked as hidden
     */
    private async hideAlreadyHiddenItems(container: Element): Promise<void> {
        const animeItems = container.querySelectorAll(".flw-item, .anime-item, [class*='item']");

        for (const item of animeItems) {
            const animeData = AnimeExtractor.extractFromListItem(item as HTMLElement);
            if (animeData) {
                const status = await this.animeService.getAnimeStatus(animeData.animeId);
                if (status.isHidden) {
                    (item as HTMLElement).classList.add("anime-hidden");
                    (item as HTMLElement).style.display = "none";
                }
            }
        }
    }

    /**
     * Refresh the controls for all anime items
     * Called when storage changes externally
     */
    public async refreshControls(): Promise<void> {
        const container = this.findAnimeListContainer();
        if (!container) {
            return;
        }

        await this.initializeListControls(container);
        await this.hideAlreadyHiddenItems(container);
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        this.observer.disconnect();
        (window as any).__listPageController = null;
    }

    /**
     * Handle mutations in the DOM
     */
    private handleMutations(mutations: MutationRecord[]): void {
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                // New anime items added or removed
                this.initialize();
            }
        }
    }
}
