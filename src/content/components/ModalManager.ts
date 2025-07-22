import { AnimeService } from "@/commons/services";
import type { AnimeData, AnimeStatus } from "../types/ContentTypes";
import { toastSystem } from "./ui/ToastSystem";

/**
 * ModalManager - Modular component for managing anime modals
 * Handles single-page modal creation and management
 */
export class ModalManager {
    private static animeService = new AnimeService();
    private static activeModal: HTMLElement | null = null;

    /**
     * Shows a modal for single-page anime interactions
     */
    static showModal(animeData: AnimeData, status: AnimeStatus): void {
        // Close any existing modal first
        this.closeModal();

        const modal = this.createModal(animeData, status);
        document.body.appendChild(modal);
        this.activeModal = modal;

        // Focus the modal for accessibility
        modal.focus();

        // Add event listeners
        this.attachModalEvents(modal, animeData);

        // Show with animation
        setTimeout(() => {
            modal.style.opacity = "1";
        }, 10);
    }

    /**
     * Closes the active modal
     */
    static closeModal(): void {
        if (!this.activeModal) return;

        const modalToRemove = this.activeModal;
        this.activeModal = null; // Prevent race conditions with subsequent calls

        modalToRemove.style.opacity = "0";
        setTimeout(() => {
            if (modalToRemove.parentNode) {
                modalToRemove.parentNode.removeChild(modalToRemove);
            }
        }, 300);
    }

    /**
     * Creates the modal element structure
     */
    private static createModal(animeData: AnimeData, status: AnimeStatus): HTMLElement {
        const modal = document.createElement("div");
        modal.className = "anime-list-single-page-modal";
        modal.setAttribute("data-testid", "anime-modal");
        modal.setAttribute("tabindex", "-1");
        modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

        const modalContent = document.createElement("div");
        modalContent.className = "anime-modal-content";
        modalContent.style.cssText = `
      background: rgba(17, 25, 40, 0.95);
      backdrop-filter: blur(16px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      color: white;
    `;

        modalContent.innerHTML = this.getModalContent(animeData, status);
        modal.appendChild(modalContent);

        return modal;
    }

    /**
     * Generates the modal content HTML
     */
    private static getModalContent(animeData: AnimeData, status: AnimeStatus): string {
        const title = animeData.animeTitle;
        const currentEpisode = status.progress?.currentEpisode || 1;

        let statusSection = "";
        let actionButtons = "";

        if (status.isTracked) {
            // Currently watching
            statusSection = `
        <div class="modal-section">
          <h3 style="color: #10B981; margin: 0 0 12px 0;">Currently Watching</h3>
          <div class="episode-controls" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <span style="font-size: 14px; font-weight: 500;">Episode:</span>
            <button class="modal-episode-btn modal-episode-decrement" style="
              width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
              background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 6px; color: white; cursor: pointer; font-size: 16px; font-weight: bold;
            ">−</button>
            <input type="number" class="modal-episode-current" min="1" max="999" value="${currentEpisode}" style="
              width: 60px; padding: 8px; background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 6px;
              color: white; font-size: 14px; text-align: center; outline: none;
            ">
            <button class="modal-episode-btn modal-episode-increment" style="
              width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
              background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 6px; color: white; cursor: pointer; font-size: 16px; font-weight: bold;
            ">+</button>
          </div>
        </div>
      `;

            actionButtons = `
        <button class="modal-action-btn modal-stop-btn" style="
          background: linear-gradient(135deg, #EF4444, #DC2626);
          color: white; border: none; border-radius: 8px; padding: 12px 24px;
          font-size: 14px; font-weight: 600; cursor: pointer; margin-right: 12px;
        ">Stop Watching</button>
      `;
        } else if (status.isPlanned) {
            // Planned to watch
            statusSection = `
        <div class="modal-section">
          <h3 style="color: #F59E0B; margin: 0 0 12px 0;">Planned to Watch</h3>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">This anime is in your plan-to-watch list.</p>
        </div>
      `;

            actionButtons = `
        <button class="modal-action-btn modal-start-btn" style="
          background: linear-gradient(135deg, #10B981, #059669);
          color: white; border: none; border-radius: 8px; padding: 12px 24px;
          font-size: 14px; font-weight: 600; cursor: pointer; margin-right: 12px;
        ">Start Watching</button>
        <button class="modal-action-btn modal-remove-plan-btn" style="
          background: rgba(255, 255, 255, 0.1);
          color: white; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 8px; padding: 12px 24px;
          font-size: 14px; font-weight: 600; cursor: pointer; margin-right: 12px;
        ">Remove from Plan</button>
      `;
        } else {
            // Not tracked
            statusSection = `
        <div class="modal-section">
          <h3 style="color: #6B7280; margin: 0 0 12px 0;">Not Tracked</h3>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">This anime is not in your lists.</p>
        </div>
      `;

            actionButtons = `
        <button class="modal-action-btn modal-plan-btn" style="
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: white; border: none; border-radius: 8px; padding: 12px 24px;
          font-size: 14px; font-weight: 600; cursor: pointer; margin-right: 12px;
        ">Add to Plan</button>
        <button class="modal-action-btn modal-start-btn" style="
          background: linear-gradient(135deg, #10B981, #059669);
          color: white; border: none; border-radius: 8px; padding: 12px 24px;
          font-size: 14px; font-weight: 600; cursor: pointer; margin-right: 12px;
        ">Start Watching</button>
      `;
        }

        return `
      <div class="modal-header" style="margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 600;">${title}</h2>
        <button class="modal-close-btn" style="
          position: absolute; top: 16px; right: 16px;
          background: rgba(255, 255, 255, 0.1); border: none; border-radius: 50%;
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          color: white; font-size: 16px; cursor: pointer;
        ">×</button>
      </div>
      
      ${statusSection}
      
      <div class="modal-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${actionButtons}
      </div>
    `;
    }

    /**
     * Attaches event listeners to modal elements
     */
    private static attachModalEvents(modal: HTMLElement, animeData: AnimeData): void {
        // Close button
        const closeBtn = modal.querySelector(".modal-close-btn") as HTMLButtonElement;
        closeBtn?.addEventListener("click", () => this.closeModal());

        // Close on backdrop click
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.activeModal) {
                this.closeModal();
            }
        });

        // Episode controls
        const decrementBtn = modal.querySelector(".modal-episode-decrement") as HTMLButtonElement;
        const incrementBtn = modal.querySelector(".modal-episode-increment") as HTMLButtonElement;
        const episodeInput = modal.querySelector(".modal-episode-current") as HTMLInputElement;

        if (episodeInput) {
            episodeInput.defaultValue = episodeInput.value;

            decrementBtn?.addEventListener("click", async () => {
                const current = parseInt(episodeInput.value, 10);
                const newEpisode = Math.max(1, current - 1);
                if (newEpisode !== current) {
                    episodeInput.value = newEpisode.toString();
                    await this.updateEpisode(animeData.animeId, newEpisode);
                    episodeInput.defaultValue = episodeInput.value;
                }
            });

            incrementBtn?.addEventListener("click", async () => {
                const current = parseInt(episodeInput.value, 10);
                const newEpisode = Math.min(999, current + 1);
                if (newEpisode !== current) {
                    episodeInput.value = newEpisode.toString();
                    await this.updateEpisode(animeData.animeId, newEpisode);
                    episodeInput.defaultValue = episodeInput.value;
                }
            });

            episodeInput?.addEventListener("change", async () => {
                const newEpisode = parseInt(episodeInput.value, 10);
                if (!isNaN(newEpisode) && newEpisode >= 1 && newEpisode <= 999) {
                    await this.updateEpisode(animeData.animeId, newEpisode);
                    episodeInput.defaultValue = episodeInput.value;
                } else {
                    episodeInput.value = episodeInput.defaultValue;
                }
            });
        }

        // Action buttons
        const startBtn = modal.querySelector(".modal-start-btn") as HTMLButtonElement;
        const stopBtn = modal.querySelector(".modal-stop-btn") as HTMLButtonElement;
        const planBtn = modal.querySelector(".modal-plan-btn") as HTMLButtonElement;
        const removePlanBtn = modal.querySelector(".modal-remove-plan-btn") as HTMLButtonElement;

        startBtn?.addEventListener("click", () => this.handleAction("start", animeData));
        stopBtn?.addEventListener("click", () => this.handleAction("stop", animeData));
        planBtn?.addEventListener("click", () => this.handleAction("plan", animeData));
        removePlanBtn?.addEventListener("click", () => this.handleAction("remove_plan", animeData));
    }

    /**
     * Updates episode progress
     */
    private static async updateEpisode(animeId: string, newEpisode: number): Promise<void> {
        try {
            const result = await this.animeService.updateEpisodeProgress(animeId, newEpisode);
            if (result.success) {
                toastSystem.showToast(`Updated to episode ${newEpisode}`, "success");
            } else {
                toastSystem.showToast(result.message || "Error updating episode", "error");
            }
        } catch (error) {
            console.error("Error updating episode:", error);
            toastSystem.showToast("Error updating episode", "error");
        }
    }

    /**
     * Handles modal action button clicks
     */
    private static async handleAction(action: string, animeData: AnimeData): Promise<void> {
        try {
            let result;

            switch (action) {
                case "start":
                    result = await this.animeService.startWatching(animeData, 1);
                    break;
                case "stop":
                    result = await this.animeService.stopWatching(animeData.animeId);
                    break;
                case "plan":
                    result = await this.animeService.addToPlanToWatch(animeData);
                    break;
                case "remove_plan":
                    result = await this.animeService.removeFromPlanToWatch(animeData.animeId);
                    break;
                default:
                    console.warn("Unknown action:", action);
                    return;
            }

            if (result.success) {
                toastSystem.showToast(result.message, "success");
                this.closeModal(); // Close modal after successful action

                // Trigger UI update
                window.dispatchEvent(
                    new CustomEvent("animeStatusUpdated", {
                        detail: { animeId: animeData.animeId, action },
                    }),
                );
            } else {
                toastSystem.showToast(result.message, "error");
            }
        } catch (error) {
            console.error("Error handling action:", error);
            toastSystem.showToast("Error performing action", "error");
        }
    }

    /**
     * Creates a simple confirmation modal
     */
    static showConfirmation(title: string, message: string, onConfirm: () => void, onCancel?: () => void): void {
        const modal = document.createElement("div");
        modal.className = "anime-list-confirmation-modal";
        modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center;
      z-index: 10001; opacity: 0; transition: opacity 0.3s ease;
    `;

        modal.innerHTML = `
      <div style="
        background: rgba(17, 25, 40, 0.95); backdrop-filter: blur(16px); border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1); padding: 24px; max-width: 400px; width: 90%;
        color: white; text-align: center;
      ">
        <h3 style="margin: 0 0 16px 0; font-size: 16px;">${title}</h3>
        <p style="margin: 0 0 24px 0; opacity: 0.8;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="confirm-btn" style="
            background: linear-gradient(135deg, #EF4444, #DC2626); color: white; border: none;
            border-radius: 8px; padding: 12px 24px; font-size: 14px; cursor: pointer;
          ">Confirm</button>
          <button class="cancel-btn" style="
            background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px; padding: 12px 24px; font-size: 14px; cursor: pointer;
          ">Cancel</button>
        </div>
      </div>
    `;

        const confirmBtn = modal.querySelector(".confirm-btn") as HTMLButtonElement;
        const cancelBtn = modal.querySelector(".cancel-btn") as HTMLButtonElement;

        confirmBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
            onConfirm();
        });

        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
            onCancel?.();
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                onCancel?.();
            }
        });

        document.body.appendChild(modal);
        requestAnimationFrame(() => {
            modal.style.opacity = "1";
        });
    }
}
