/**
 * Hide anime button component
 * Handles hiding anime from lists
 */

import type { AnimeData } from "@/commons/models";
import type { AnimeService } from "@/commons/services";
import { BusinessRules } from "@/content/services/BusinessRules";
import { SELECTORS } from "@/content/types/ContentTypes";
import type { ToastSystem } from "../ui/ToastSystem";

export class HideButton {
    private static instance: HideButton | null = null;
    private animeService: AnimeService;
    private toastSystem: ToastSystem;

    private constructor(animeService: AnimeService, toastSystem: ToastSystem) {
        this.animeService = animeService;
        this.toastSystem = toastSystem;
    }

    public static getInstance(animeService: AnimeService, toastSystem: ToastSystem): HideButton {
        if (!HideButton.instance) {
            HideButton.instance = new HideButton(animeService, toastSystem);
        }
        return HideButton.instance;
    }

    /**
     * Resets the singleton instance.
     * **NOTE:** This method should only be used for testing purposes.
     */
    public static _resetInstanceForTesting(): void {
        HideButton.instance = null as any;
    }

    /**
     * Create a hide button element
     */
    public create(animeData: AnimeData): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = "anime-list-hide-btn";
        button.setAttribute("data-testid", "anime-hide-button");
        button.setAttribute("data-anime-id", animeData.animeId);
        button.setAttribute("title", `Hide "${animeData.animeTitle}" from listings`);
        button.innerHTML = `
            <span class="button-icon">👁️</span>
            <span class="button-text">Hide</span>
        `;

        // Add click handler
        button.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleClick(button, animeData.animeId);
        });

        return button;
    }

    /**
     * Handle hide button click
     */
    public async handleClick(button: HTMLButtonElement, animeId: string): Promise<void> {
        try {
            const status = await this.animeService.getAnimeStatus(animeId);

            // Validate business rules for hiding
            if (!BusinessRules.canHide(status)) {
                const message = BusinessRules.getBlockedActionMessage("hide", status);
                this.toastSystem.showToast(message, "error");
                return;
            }

            // Add to hidden list
            const result = await this.animeService.hideAnime(animeId);

            if (result.success) {
                // Find the parent anime item and hide it
                const animeItem = button.closest(SELECTORS.ITEM);
                if (animeItem) {
                    animeItem.classList.add("anime-hidden");
                    // Use CSS transition for smooth hiding
                    setTimeout(() => {
                        (animeItem as HTMLElement).style.display = "none";
                    }, 300);
                    const titleEl = animeItem.querySelector<HTMLElement>(SELECTORS.TITLE_LINK);
                    const title = titleEl?.textContent?.trim() ?? "this anime";
                    this.toastSystem.showToast(`Hidden "${title}"`, "success");
                }
            } else {
                this.toastSystem.showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Error handling hide click:", error);
            this.toastSystem.showToast("Error occurred", "error");
        }
    }

    /**
     * Create clear hidden button
     */
    public createClearHiddenButton(): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = "anime-list-clear-hidden-btn";
        button.setAttribute("data-testid", "anime-clear-hidden-button");
        button.setAttribute("title", "Show all previously hidden anime");
        button.innerHTML = `
            <span class="button-icon">🔄</span>
            <span class="button-text">Clear Hidden</span>
        `;

        // Add click handler
        button.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleClearHiddenClick();
        });

        return button;
    }

    /**
     * Handle clear hidden button click
     */
    public async handleClearHiddenClick(): Promise<void> {
        try {
            // Use the optimized clearAllHidden method
            const result = await this.animeService.clearAllHidden();

            if (result?.success) {
                // Show all previously hidden items in the DOM
                document.querySelectorAll(".anime-hidden").forEach((item) => {
                    item.classList.remove("anime-hidden");
                    (item as HTMLElement).style.display = "";
                });
                this.toastSystem.showToast(result.message, "success");
            } else {
                this.toastSystem.showToast(result?.message ?? "Failed to clear hidden anime", "error");
            }
        } catch (error) {
            console.error("Error handling clear hidden click:", error);
            this.toastSystem.showToast("Failed to clear hidden anime", "error");
        }
    }
}
