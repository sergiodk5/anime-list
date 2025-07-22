/**
 * Controller for single anime pages (watch pages)
 * Orchestrates modal and single-page functionality
 */

import type { AnimeData, AnimeStatus } from "@/commons/models";
import { AnimeService } from "@/commons/services";
import { InfoButton } from "../components/buttons/InfoButton";
import { ModalManager } from "../components/ModalManager";
import { StyleInjector } from "../components/ui/StyleInjector";
import { ToastSystem } from "../components/ui/ToastSystem";
import { AnimeExtractor } from "../services/AnimeExtractor";
import { PageDetector } from "../services/PageDetector";
import { ContentFeature } from "../types/ContentTypes";

/**
 * Manages the single anime page functionality
 * Handles info buttons, modals, and single-page interactions
 */
export class SinglePageController {
    private static instance: SinglePageController | null = null;
    private animeService: AnimeService;
    private toastSystem: ToastSystem;
    private initialized: boolean = false;
    private currentAnimeData: AnimeData | null = null;

    private constructor(animeService: AnimeService, toastSystem: ToastSystem) {
        this.animeService = animeService;
        this.toastSystem = toastSystem;
    }

    /**
     * Get the singleton instance of the controller
     */
    public static getInstance(animeService: AnimeService, toastSystem: ToastSystem): SinglePageController {
        if (!SinglePageController.instance) {
            SinglePageController.instance = new SinglePageController(animeService, toastSystem);
        }
        return SinglePageController.instance;
    }

    /**
     * Initialize the single page functionality
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            // Check if we're on a single page (watch page)
            if (!PageDetector.shouldRunFeature(ContentFeature.SINGLE_PAGE_MODAL)) {
                return;
            }

            // Extract anime data from the current page
            const animeData = AnimeExtractor.extractFromSinglePage();
            if (!animeData) {
                console.log("Could not extract anime data from single page");
                return;
            }

            // Inject required styles
            StyleInjector.injectStyles();

            this.currentAnimeData = animeData;

            // Create and position the info button
            await this.createInfoButton(animeData);

            // Set up modal functionality
            this.setupModalHandlers(animeData);

            this.initialized = true;
            console.log("Single page controller initialized for:", animeData.animeTitle);
        } catch (error) {
            console.error("Error initializing single page controller:", error);
        }
    }

    /**
     * Create the info button for the single page
     */
    private async createInfoButton(animeData: AnimeData): Promise<void> {
        // Remove any existing info button
        const existingButton = document.querySelector(".anime-list-info-btn");
        if (existingButton) {
            existingButton.remove();
        }

        // Create the new info button
        const infoButton = await InfoButton.create(animeData);

        // Find the best position for the button
        const targetContainer = this.findInfoButtonContainer();
        if (targetContainer) {
            targetContainer.appendChild(infoButton);

            // Set up click handler to show modal
            infoButton.addEventListener("click", () => {
                this.showModal(animeData);
            });
        }
    }

    /**
     * Find the best container for the info button
     */
    private findInfoButtonContainer(): Element | null {
        const selectors = [
            ".video-player-container",
            ".player-container",
            ".watch-container",
            ".video-wrapper",
            "#main-content",
            "body",
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                // Ensure the container is positioned relatively
                (element as HTMLElement).style.position = "relative";
                return element;
            }
        }

        return document.body;
    }

    /**
     * Set up modal-related event handlers
     */
    private setupModalHandlers(animeData: AnimeData): void {
        // Set up keyboard shortcut (e.g., 'M' key to open modal)
        document.addEventListener("keydown", (event) => {
            if (event.key === "m" || event.key === "M") {
                // Only if not typing in an input field
                if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
                    event.preventDefault();
                    this.showModal(animeData);
                }
            }
        });

        // Listen for escape key to close modal
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                ModalManager.closeModal();
            }
        });
    }

    /**
     * Show the modal for the current anime
     */
    public async showModal(animeData: AnimeData): Promise<void> {
        try {
            const status = await this.animeService.getAnimeStatus(animeData.animeId);
            ModalManager.showModal(animeData, status);
        } catch (error) {
            console.error("Error showing modal:", error);
            this.toastSystem.showToast("Failed to open anime modal", "error");
        }
    }

    /**
     * Update episode progress from the modal or other interactions
     */
    public async updateEpisode(animeData: AnimeData, episode: number): Promise<void> {
        try {
            const result = await this.animeService.updateEpisodeProgress(animeData.animeId, episode);

            if (result.success) {
                this.toastSystem.showToast(`Updated to episode ${episode}`, "success");
            } else {
                this.toastSystem.showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Error updating episode:", error);
            this.toastSystem.showToast("Failed to update episode", "error");
        }
    }

    /**
     * Get the current anime status for display
     */
    public async getCurrentStatus(): Promise<AnimeStatus | null> {
        if (!this.currentAnimeData) {
            return null;
        }

        try {
            return await this.animeService.getAnimeStatus(this.currentAnimeData.animeId);
        } catch (error) {
            console.error("Error getting current status:", error);
            return null;
        }
    }

    /**
     * Get status text for display in UI
     */
    public getStatusText(status: AnimeStatus): string {
        if (status.isTracked && status.progress) {
            return `Watching - Episode ${status.progress.currentEpisode}`;
        } else if (status.isPlanned) {
            return "Planned to Watch";
        } else if (status.isHidden) {
            return "Hidden";
        } else {
            return "Not in List";
        }
    }

    /**
     * Handle anime action (start watching, add to plan, etc.)
     */
    public async handleAction(animeData: AnimeData, action: string): Promise<void> {
        try {
            let result;

            switch (action) {
                case "start":
                    result = await this.animeService.startWatching(animeData);
                    break;
                case "plan":
                    result = await this.animeService.addToPlanToWatch(animeData);
                    break;
                case "hide":
                    result = await this.animeService.hideAnime(animeData.animeId);
                    break;
                case "stop":
                    result = await this.animeService.stopWatching(animeData.animeId);
                    break;
                case "unplan":
                    result = await this.animeService.removeFromPlanToWatch(animeData.animeId);
                    break;
                default:
                    console.warn("Unknown action:", action);
                    return;
            }

            if (result.success) {
                this.toastSystem.showToast(result.message, "success");

                // Close modal and refresh if needed
                ModalManager.closeModal();
            } else {
                this.toastSystem.showToast(result.message, "error");
            }
        } catch (error) {
            console.error(`Error handling action ${action}:`, error);
            this.toastSystem.showToast(`Failed to ${action} anime`, "error");
        }
    }

    /**
     * Refresh the current page data
     * Called when storage changes externally
     */
    public async refresh(): Promise<void> {
        if (!this.currentAnimeData) {
            return;
        }

        // Update the info button display
        await this.createInfoButton(this.currentAnimeData);
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        this.initialized = false;
        this.currentAnimeData = null;
        SinglePageController.instance = null;
    }
}
