import { AnimeService } from "@/commons/services";
import type { AnimeData } from "../../types/ContentTypes";
import { toastSystem } from "../ui/ToastSystem";

/**
 * WatchingControls - Modular component for episode watching controls
 * Handles episode increment/decrement, direct episode input, and stop watching
 */
export class WatchingControls {
    private static animeService = new AnimeService();

    /**
     * Creates watching controls (increment/decrement buttons and episode input)
     */
    static create(animeData: AnimeData, currentEpisode: number): HTMLElement {
        const controlsDiv = document.createElement("div");
        controlsDiv.className = "anime-list-watching-controls";
        controlsDiv.setAttribute("data-testid", "anime-watching-controls");
        controlsDiv.setAttribute("data-anime-id", animeData.animeId);

        controlsDiv.innerHTML = `
      <div class="episode-display">
        <span class="episode-label">Ep:</span>
        <button class="episode-btn episode-decrement" data-testid="episode-decrement" title="Previous episode">−</button>
        <input type="number" class="episode-current" min="1" max="999" value="${currentEpisode}" title="Current episode">
        <button class="episode-btn episode-increment" data-testid="episode-increment" title="Next episode">+</button>
      </div>
    `;

        // Add event handlers
        const decrementBtn = controlsDiv.querySelector(".episode-decrement") as HTMLButtonElement;
        const incrementBtn = controlsDiv.querySelector(".episode-increment") as HTMLButtonElement;
        const episodeInput = controlsDiv.querySelector(".episode-current") as HTMLInputElement;

        decrementBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleEpisodeDecrement(animeData, controlsDiv);
        });

        incrementBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleEpisodeIncrement(animeData, controlsDiv);
        });

        episodeInput.addEventListener("change", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleDirectEpisodeInput(animeData, controlsDiv);
        });

        // Prevent input from triggering parent click
        episodeInput.addEventListener("click", (e) => e.stopPropagation());

        return controlsDiv;
    }

    /**
     * Creates a start watching button
     */
    static createStartButton(animeData: AnimeData): HTMLElement {
        const button = document.createElement("button");
        button.className = "anime-list-start-watching-btn";
        button.setAttribute("data-testid", "anime-start-watching-button");
        button.setAttribute("data-anime-id", animeData.animeId);
        button.innerHTML = `
      <span class="button-icon">▶️</span>
      <span class="button-text">Start Watching</span>
    `;

        button.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleStartWatching(animeData);
        });

        return button;
    }

    /**
     * Creates a stop watching button
     */
    static createStopButton(animeData: AnimeData): HTMLElement {
        const button = document.createElement("button");
        button.className = "anime-list-stop-watching-btn";
        button.setAttribute("data-testid", "anime-stop-watching-button");
        button.setAttribute("data-anime-id", animeData.animeId);
        button.setAttribute("title", `Stop watching "${animeData.animeTitle}"`);
        button.innerHTML = `
      <span class="button-icon">⏹️</span>
      <span class="button-text">Stop</span>
    `;

        button.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleStopWatching(animeData);
        });

        return button;
    }

    /**
     * Creates combined watching controls with episode display
     */
    static createCombined(animeData: AnimeData, currentEpisode: number): HTMLElement {
        const container = document.createElement("div");
        container.className = "anime-list-combined-watching-controls";
        container.setAttribute("data-testid", "anime-combined-watching-controls");
        container.setAttribute("data-anime-id", animeData.animeId);

        container.innerHTML = `
      <div class="episode-display">
        <span class="episode-label">Ep:</span>
        <button class="episode-btn episode-decrement" data-testid="episode-decrement" title="Previous episode">−</button>
        <input type="number" class="episode-current" min="1" max="999" value="${currentEpisode}" title="Current episode">
        <button class="episode-btn episode-increment" data-testid="episode-increment" title="Next episode">+</button>
      </div>
      <button class="stop-watching-btn" data-testid="combined-stop-watching-button" title="Stop watching ${animeData.animeTitle}">
        <span class="button-icon">⏹️</span>
        <span class="button-text">Stop</span>
      </button>
    `;

        // Add event handlers
        const decrementBtn = container.querySelector(".episode-decrement") as HTMLButtonElement;
        const incrementBtn = container.querySelector(".episode-increment") as HTMLButtonElement;
        const episodeInput = container.querySelector(".episode-current") as HTMLInputElement;
        const stopBtn = container.querySelector(".stop-watching-btn") as HTMLButtonElement;

        decrementBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleEpisodeDecrement(animeData, container);
        });

        incrementBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleEpisodeIncrement(animeData, container);
        });

        episodeInput.addEventListener("change", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleDirectEpisodeInput(animeData, container);
        });

        stopBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleStopWatching(animeData);
        });

        // Prevent input from triggering parent click
        episodeInput.addEventListener("click", (e) => e.stopPropagation());

        return container;
    }

    /**
     * Handles episode increment
     */
    private static async handleEpisodeIncrement(animeData: AnimeData, container: HTMLElement): Promise<void> {
        try {
            const episodeInput = container.querySelector(".episode-current") as HTMLInputElement;
            const currentEpisode = parseInt(episodeInput.value, 10);
            const newEpisode = currentEpisode + 1;

            if (newEpisode > 999) {
                toastSystem.showToast("Maximum episode number is 999", "error");
                return;
            }

            const result = await this.animeService.updateEpisodeProgress(animeData.animeId, newEpisode);

            if (result.success) {
                episodeInput.value = newEpisode.toString();
                toastSystem.showToast(`Updated to episode ${newEpisode}`, "success");
            } else {
                toastSystem.showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Error incrementing episode:", error);
            toastSystem.showToast("Error updating episode", "error");
        }
    }

    /**
     * Handles episode decrement
     */
    private static async handleEpisodeDecrement(animeData: AnimeData, container: HTMLElement): Promise<void> {
        try {
            const episodeInput = container.querySelector(".episode-current") as HTMLInputElement;
            const currentEpisode = parseInt(episodeInput.value, 10);
            const newEpisode = currentEpisode - 1;

            if (newEpisode < 1) {
                toastSystem.showToast("Minimum episode number is 1", "error");
                return;
            }

            const result = await this.animeService.updateEpisodeProgress(animeData.animeId, newEpisode);

            if (result.success) {
                episodeInput.value = newEpisode.toString();
                toastSystem.showToast(`Updated to episode ${newEpisode}`, "success");
            } else {
                toastSystem.showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Error decrementing episode:", error);
            toastSystem.showToast("Error updating episode", "error");
        }
    }

    /**
     * Handles direct episode input
     */
    private static async handleDirectEpisodeInput(animeData: AnimeData, container: HTMLElement): Promise<void> {
        try {
            const episodeInput = container.querySelector(".episode-current") as HTMLInputElement;
            const newEpisode = parseInt(episodeInput.value, 10);

            // Validate episode number
            if (isNaN(newEpisode) || newEpisode < 1 || newEpisode > 999) {
                toastSystem.showToast("Please enter a valid episode number (1-999)", "error");
                // Will be reset by potential refresh
                return;
            }

            const result = await this.animeService.updateEpisodeProgress(animeData.animeId, newEpisode);

            if (result.success) {
                toastSystem.showToast(`Updated to episode ${newEpisode}`, "success");
            } else {
                toastSystem.showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Error updating episode:", error);
            toastSystem.showToast("Error updating episode", "error");
        }
    }

    /**
     * Handles start watching action
     */
    private static async handleStartWatching(animeData: AnimeData): Promise<void> {
        try {
            const result = await this.animeService.startWatching(animeData, 1);

            if (result.success) {
                toastSystem.showToast(result.message, "success");

                // Trigger UI update
                window.dispatchEvent(
                    new CustomEvent("animeStatusUpdated", {
                        detail: { animeId: animeData.animeId, status: "watching" },
                    }),
                );
            } else {
                toastSystem.showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Failed to start watching:", error);
            toastSystem.showToast("Failed to start watching", "error");
        }
    }

    /**
     * Handles stop watching action
     */
    private static async handleStopWatching(animeData: AnimeData): Promise<void> {
        try {
            const result = await this.animeService.stopWatching(animeData.animeId);

            if (result.success) {
                toastSystem.showToast(result.message, "success");

                // Trigger UI update
                window.dispatchEvent(
                    new CustomEvent("animeStatusUpdated", {
                        detail: { animeId: animeData.animeId, status: "not_watching" },
                    }),
                );
            } else {
                toastSystem.showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Failed to stop watching:", error);
            toastSystem.showToast("Failed to stop watching", "error");
        }
    }
}
