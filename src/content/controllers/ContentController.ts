/**
 * Main ContentScript Controller
 * Orchestrates the entire content script functionality using the modular architecture.
 */

import { PageDetector } from "../services/PageDetector";
import { ContentFeature } from "../types/ContentTypes";
import { ListPageController } from "./ListPageController";
import { SinglePageController } from "./SinglePageController";

/**
 * Main controller that orchestrates all content script functionality
 * This is the primary entry point that replaces the monolithic content script
 */
export class ContentController {
    private static instance: ContentController | null = null;
    private listPageController: ListPageController;
    private singlePageController: SinglePageController;
    private initialized: boolean = false;

    private constructor(singlePageController: SinglePageController, listPageController: ListPageController) {
        this.listPageController = listPageController;
        this.singlePageController = singlePageController;
    }

    /**
     * Get the singleton instance of the main controller
     */
    public static getInstance(
        singlePageController: SinglePageController,
        listPageController: ListPageController,
    ): ContentController {
        if (!ContentController.instance) {
            ContentController.instance = new ContentController(singlePageController, listPageController);
        }
        return ContentController.instance;
    }

    /**
     * Initialize the content script based on page type
     * This is the main entry point for the content script
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            console.log("ContentController: Starting initialization...");
            console.log("ContentController: Current URL:", window.location.href);
            console.log("ContentController: Document ready state:", document.readyState);

            // Ensure DOM is ready
            await this.waitForDOMReady();

            // Debug page detection
            const pageType = PageDetector.detectPageType();
            console.log("ContentController: Detected page type:", pageType);
            console.log(
                "ContentController: Should run list logic:",
                PageDetector.shouldRunFeature(ContentFeature.LIST_PAGE_LOGIC),
            );
            console.log("ContentController: Container found:", !!document.querySelector(".film_list-wrap"));

            // Initialize appropriate controllers based on page type
            if (PageDetector.shouldRunFeature(ContentFeature.LIST_PAGE_LOGIC)) {
                console.log("ContentController: Initializing list page functionality");
                await this.listPageController.initialize();
                console.log("AnimeList controls initialized successfully"); // Legacy test compatibility
            } else {
                console.log("ContentController: Skipping list page initialization - not a list page");
            }

            if (PageDetector.shouldRunFeature(ContentFeature.SINGLE_PAGE_MODAL)) {
                console.log("ContentController: Initializing single page functionality");
                await this.singlePageController.initialize();
            }

            // Set up storage change listeners for real-time updates
            this.setupStorageListeners();

            this.initialized = true;
            console.log("ContentController: Initialization complete");
        } catch (error) {
            console.error("ContentController: Error during initialization:", error);
        }
    }

    /**
     * Wait for DOM to be ready
     */
    private async waitForDOMReady(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", () => resolve());
            } else {
                resolve();
            }
        });
    }

    /**
     * Set up listeners for storage changes to refresh UI when data changes
     */
    private setupStorageListeners(): void {
        // Listen for changes in storage (e.g., from popup or options page)
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === "local") {
                this.handleStorageChange(changes);
            }
        });
    }

    /**
     * Handle storage changes and re-initialize controllers if necessary
     */
    private async handleStorageChange(changes: { [key: string]: chrome.storage.StorageChange }): Promise<void> {
        // Check if any of the tracked anime data has changed
        const hasAnimeDataChanged = Object.keys(changes).some((key) => key.startsWith("anime-"));

        if (hasAnimeDataChanged) {
            console.log("ContentController: Detected storage change, re-initializing controllers...");

            // Re-initialize controllers to reflect the updated data
            if (PageDetector.shouldRunFeature(ContentFeature.LIST_PAGE_LOGIC)) {
                await this.listPageController.initialize();
            }
            if (PageDetector.shouldRunFeature(ContentFeature.SINGLE_PAGE_MODAL)) {
                await this.singlePageController.initialize();
            }
        }
    }

    /**
     * Refresh all controllers when data changes
     */
    private async refreshControllers(): Promise<void> {
        try {
            if (PageDetector.shouldRunFeature(ContentFeature.LIST_PAGE_LOGIC)) {
                await this.listPageController.refreshControls();
            }

            if (PageDetector.shouldRunFeature(ContentFeature.SINGLE_PAGE_MODAL)) {
                await this.singlePageController.refresh();
            }
        } catch (error) {
            console.error("ContentController: Error refreshing controllers:", error);
        }
    }

    /**
     * Handle navigation events by re-initializing controllers
     */
    public async handleNavigation(): Promise<void> {
        // Reset initialization state
        this.initialized = false;

        // Re-initialize controllers for the new page
        await this.initialize();
    } /**
     * Clean up all resources
     */
    public destroy(): void {
        this.listPageController.destroy();
        this.singlePageController.destroy();
        this.initialized = false;
        ContentController.instance = null;
    }

    /**
     * Get status information for debugging
     */
    public getStatus(): {
        initialized: boolean;
        pageType: string;
        listPageActive: boolean;
        singlePageActive: boolean;
    } {
        return {
            initialized: this.initialized,
            pageType: PageDetector.detectPageType(),
            listPageActive: PageDetector.shouldRunFeature(ContentFeature.LIST_PAGE_LOGIC),
            singlePageActive: PageDetector.shouldRunFeature(ContentFeature.SINGLE_PAGE_MODAL),
        };
    }

    /**
     * Reset the controller state (for testing)
     */
    public static reset(): void {
        if (ContentController.instance) {
            ContentController.instance.initialized = false;
            ContentController.instance = null;
        }
    }
}
