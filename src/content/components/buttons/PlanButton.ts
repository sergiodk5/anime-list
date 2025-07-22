/**
 * Plan to watch button component
 * Handles adding/removing anime to/from plan-to-watch list
 */

import { AnimeService } from "@/commons/services";
import { BusinessRules } from "../../services/BusinessRules";
import type { AnimeData } from "../../types/ContentTypes";
import { toastSystem } from "../ui/ToastSystem";

export class PlanButton {
    private static animeService = new AnimeService();

    /**
     * Create a plan button element
     */
    static create(animeData: AnimeData): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = "anime-list-plan-btn";
        button.setAttribute("data-testid", "anime-plan-button");
        button.setAttribute("data-anime-id", animeData.animeId);
        button.setAttribute("title", `Add "${animeData.animeTitle}" to plan-to-watch list`);
        button.innerHTML = `
            <span class="button-icon">📝</span>
            <span class="button-text">Plan</span>
        `;

        // Add click handler
        button.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await PlanButton.handleClick(animeData);
        });

        return button;
    }

    /**
     * Create a remove plan button element
     */
    static createRemoveButton(animeData: AnimeData): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = "anime-list-plan-btn anime-list-remove-plan-btn";
        button.setAttribute("data-testid", "anime-remove-plan-button");
        button.setAttribute("data-anime-id", animeData.animeId);
        button.setAttribute("title", `Remove "${animeData.animeTitle}" from plan-to-watch list`);
        button.innerHTML = `
            <span class="button-icon">❌</span>
            <span class="button-text">Remove</span>
        `;

        // Add click handler
        button.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await PlanButton.handleClick(animeData);
        });

        return button;
    }

    /**
     * Handle plan button click
     */
    private static async handleClick(animeData: AnimeData): Promise<void> {
        try {
            const status = await PlanButton.animeService.getAnimeStatus(animeData.animeId);

            if (status.isPlanned) {
                // Validate business rules for removing from plan
                if (!BusinessRules.canRemoveFromPlan(status)) {
                    toastSystem.showToast("Cannot remove from plan", "error");
                    return;
                }

                // Remove from plan-to-watch list
                const result = await PlanButton.animeService.removeFromPlanToWatch(animeData.animeId);
                if (result.success) {
                    toastSystem.showToast(`Removed "${animeData.animeTitle}" from plan`, "info");
                    await PlanButton.refreshAnimeControls(animeData.animeId);
                } else {
                    toastSystem.showToast(result.message, "error");
                }
            } else {
                // Validate business rules for adding to plan
                if (!BusinessRules.canAddToPlan(status)) {
                    const message = BusinessRules.getBlockedActionMessage("plan", status);
                    toastSystem.showToast(message, "error");
                    return;
                }

                // Add to plan-to-watch list
                const result = await PlanButton.animeService.addToPlanToWatch(animeData);
                if (result.success) {
                    toastSystem.showToast(`Added "${animeData.animeTitle}" to plan`, "success");
                    await PlanButton.refreshAnimeControls(animeData.animeId);
                } else {
                    toastSystem.showToast(result.message, "error");
                }
            }
        } catch (error) {
            console.error("Error handling plan click:", error);
            toastSystem.showToast("Error occurred", "error");
        }
    }

    /**
     * Refresh anime controls after state change
     * TODO: This will be moved to a controller in a later phase
     */
    private static async refreshAnimeControls(animeId: string): Promise<void> {
        // Placeholder for now - will be implemented properly with controllers
        // For now, just trigger a page refresh would be too disruptive
        // This will be properly implemented when we create the ListPageController
        console.log(`Refreshing controls for anime ID: ${animeId}`);
    }
}
