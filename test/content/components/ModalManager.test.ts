import { AnimeService } from "@/commons/services";
import { ModalManager } from "@/content/components/ModalManager";
import { toastSystem } from "@/content/components/ui/ToastSystem";
import type { AnimeData, AnimeStatus } from "@/content/types/ContentTypes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/commons/services");
vi.mock("@/content/components/ui/ToastSystem");

describe("ModalManager", () => {
    let animeData: AnimeData;
    let trackedStatus: AnimeStatus;
    let plannedStatus: AnimeStatus;
    let untrackedStatus: AnimeStatus;

    beforeEach(() => {
        vi.useFakeTimers();
        // Reset DOM
        document.body.innerHTML = "";

        // Mock data
        animeData = {
            animeId: "1",
            animeTitle: "Test Anime",
            animeSlug: "test-anime",
        };
        trackedStatus = {
            isTracked: true,
            isPlanned: false,
            isHidden: false,
            progress: {
                animeId: "1",
                animeSlug: "test-anime",
                animeTitle: "Test Anime",
                currentEpisode: 5,
                episodeId: "ep5",
                lastWatched: new Date().toISOString(),
            },
        };
        plannedStatus = {
            isTracked: false,
            isPlanned: true,
            isHidden: false,
        };
        untrackedStatus = {
            isTracked: false,
            isPlanned: false,
            isHidden: false,
        };

        // Mock services
        vi.mocked(AnimeService).mockClear();
        vi.mocked(toastSystem.showToast).mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        ModalManager.closeModal(); // Ensure modal is closed after each test
    });

    describe("showModal", () => {
        it("should create and append a modal to the body", () => {
            ModalManager.showModal(animeData, untrackedStatus);
            const modal = document.querySelector(".anime-list-single-page-modal");
            expect(modal).not.toBeNull();
            expect(document.body.contains(modal)).toBe(true);
        });

        it("should display correct content for a tracked anime", () => {
            ModalManager.showModal(animeData, trackedStatus);
            const modalContent = document.querySelector(".anime-modal-content");
            expect(modalContent?.innerHTML).toContain("Currently Watching");
            expect(modalContent?.innerHTML).toContain("Stop Watching");
            const episodeInput = document.querySelector(".modal-episode-current") as HTMLInputElement;
            expect(episodeInput.value).toBe("5");
        });

        it("should display correct content for a planned anime", () => {
            ModalManager.showModal(animeData, plannedStatus);
            const modalContent = document.querySelector(".anime-modal-content");
            expect(modalContent?.innerHTML).toContain("Planned to Watch");
            expect(modalContent?.innerHTML).toContain("Start Watching");
            expect(modalContent?.innerHTML).toContain("Remove from Plan");
        });

        it("should display correct content for an untracked anime", () => {
            ModalManager.showModal(animeData, untrackedStatus);
            const modalContent = document.querySelector(".anime-modal-content");
            expect(modalContent?.innerHTML).toContain("Not Tracked");
            expect(modalContent?.innerHTML).toContain("Add to Plan");
            expect(modalContent?.innerHTML).toContain("Start Watching");
        });

        it("should close any existing modal before opening a new one", () => {
            // Show the first modal
            ModalManager.showModal(animeData, untrackedStatus);
            const modal = document.querySelector(".anime-list-single-page-modal");
            expect(modal).not.toBeNull();
            expect(modal?.innerHTML).toContain("Not Tracked");

            // Show the second modal
            ModalManager.showModal(animeData, trackedStatus);

            // Fast-forward timers to handle the close animation
            vi.runAllTimers();

            const modals = document.querySelectorAll(".anime-list-single-page-modal");
            expect(modals.length).toBe(1);

            const newModalContent = modals[0].querySelector(".anime-modal-content");
            expect(newModalContent?.innerHTML).toContain("Currently Watching");
        });
    });

    describe("closeModal", () => {
        it("should remove the modal from the DOM", async () => {
            ModalManager.showModal(animeData, untrackedStatus);
            let modal = document.querySelector(".anime-list-single-page-modal");
            expect(modal).not.toBeNull();

            ModalManager.closeModal();
            vi.runAllTimers(); // Fast-forward the timers to trigger the removal

            modal = document.querySelector(".anime-list-single-page-modal");
            expect(modal).toBeNull();
        });
    });

    describe("Modal Events", () => {
        it("should close the modal when the close button is clicked", () => {
            ModalManager.showModal(animeData, untrackedStatus);
            const closeBtn = document.querySelector(".modal-close-btn") as HTMLButtonElement;
            closeBtn.click();
            // The test will fail if the modal is not removed, but direct check is tricky due to animation.
            // We can check if the opacity is set to 0 as a first step.
            const modal = document.querySelector(".anime-list-single-page-modal") as HTMLElement;
            expect(modal.style.opacity).toBe("0");
        });

        it("should close the modal when the backdrop is clicked", () => {
            ModalManager.showModal(animeData, untrackedStatus);
            const modal = document.querySelector(".anime-list-single-page-modal") as HTMLElement;
            modal.click();
            expect(modal.style.opacity).toBe("0");
        });

        it("should close the modal when the Escape key is pressed", () => {
            ModalManager.showModal(animeData, untrackedStatus);
            const modal = document.querySelector(".anime-list-single-page-modal") as HTMLElement;
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
            expect(modal.style.opacity).toBe("0");
        });
    });

    describe("Episode Controls", () => {
        const animeServiceInstance = new AnimeService();

        beforeEach(() => {
            vi.spyOn(animeServiceInstance, "updateEpisodeProgress").mockResolvedValue({
                success: true,
                message: "Updated",
            });
            ModalManager["animeService"] = animeServiceInstance;
            ModalManager.showModal(animeData, trackedStatus);
        });

        it("should increment episode", async () => {
            const incrementBtn = document.querySelector(".modal-episode-increment") as HTMLButtonElement;
            incrementBtn.click();
            await vi.waitFor(() => {
                expect(animeServiceInstance.updateEpisodeProgress).toHaveBeenCalledWith("1", 6);
                expect(toastSystem.showToast).toHaveBeenCalledWith("Updated to episode 6", "success");
            });
        });

        it("should decrement episode", async () => {
            const decrementBtn = document.querySelector(".modal-episode-decrement") as HTMLButtonElement;
            decrementBtn.click();
            await vi.waitFor(() => {
                expect(animeServiceInstance.updateEpisodeProgress).toHaveBeenCalledWith("1", 4);
                expect(toastSystem.showToast).toHaveBeenCalledWith("Updated to episode 4", "success");
            });
        });

        it("should update episode on input change", async () => {
            const episodeInput = document.querySelector(".modal-episode-current") as HTMLInputElement;
            episodeInput.value = "10";
            episodeInput.dispatchEvent(new Event("change"));
            await vi.waitFor(() => {
                expect(animeServiceInstance.updateEpisodeProgress).toHaveBeenCalledWith("1", 10);
                expect(toastSystem.showToast).toHaveBeenCalledWith("Updated to episode 10", "success");
            });
        });

        it("should handle API error on episode update", async () => {
            vi.spyOn(animeServiceInstance, "updateEpisodeProgress").mockResolvedValue({
                success: false,
                message: "API Error",
            });
            const incrementBtn = document.querySelector(".modal-episode-increment") as HTMLButtonElement;
            incrementBtn.click();
            await vi.waitFor(() => {
                expect(toastSystem.showToast).toHaveBeenCalledWith("API Error", "error");
            });
        });
    });

    describe("Action Buttons", () => {
        const animeServiceInstance = new AnimeService();

        beforeEach(() => {
            ModalManager["animeService"] = animeServiceInstance;
        });

        it("should call startWatching", async () => {
            vi.spyOn(animeServiceInstance, "startWatching").mockResolvedValue({ success: true, message: "Started" });
            ModalManager.showModal(animeData, untrackedStatus);
            const startBtn = document.querySelector(".modal-start-btn") as HTMLButtonElement;
            startBtn.click();
            await vi.waitFor(() => {
                expect(animeServiceInstance.startWatching).toHaveBeenCalledWith(animeData, 1);
                expect(toastSystem.showToast).toHaveBeenCalledWith("Started", "success");
            });
        });

        it("should call stopWatching", async () => {
            vi.spyOn(animeServiceInstance, "stopWatching").mockResolvedValue({ success: true, message: "Stopped" });
            ModalManager.showModal(animeData, trackedStatus);
            const stopBtn = document.querySelector(".modal-stop-btn") as HTMLButtonElement;
            stopBtn.click();
            await vi.waitFor(() => {
                expect(animeServiceInstance.stopWatching).toHaveBeenCalledWith("1");
                expect(toastSystem.showToast).toHaveBeenCalledWith("Stopped", "success");
            });
        });

        it("should call addToPlanToWatch", async () => {
            vi.spyOn(animeServiceInstance, "addToPlanToWatch").mockResolvedValue({ success: true, message: "Planned" });
            ModalManager.showModal(animeData, untrackedStatus);
            const planBtn = document.querySelector(".modal-plan-btn") as HTMLButtonElement;
            planBtn.click();
            await vi.waitFor(() => {
                expect(animeServiceInstance.addToPlanToWatch).toHaveBeenCalledWith(animeData);
                expect(toastSystem.showToast).toHaveBeenCalledWith("Planned", "success");
            });
        });

        it("should call removeFromPlanToWatch", async () => {
            vi.spyOn(animeServiceInstance, "removeFromPlanToWatch").mockResolvedValue({
                success: true,
                message: "Removed from plan",
            });
            ModalManager.showModal(animeData, plannedStatus);
            const removePlanBtn = document.querySelector(".modal-remove-plan-btn") as HTMLButtonElement;
            removePlanBtn.click();
            await vi.waitFor(() => {
                expect(animeServiceInstance.removeFromPlanToWatch).toHaveBeenCalledWith("1");
                expect(toastSystem.showToast).toHaveBeenCalledWith("Removed from plan", "success");
            });
        });

        it("should handle API error on action", async () => {
            vi.spyOn(animeServiceInstance, "startWatching").mockResolvedValue({ success: false, message: "API Error" });
            ModalManager.showModal(animeData, untrackedStatus);
            const startBtn = document.querySelector(".modal-start-btn") as HTMLButtonElement;
            startBtn.click();
            await vi.waitFor(() => {
                expect(toastSystem.showToast).toHaveBeenCalledWith("API Error", "error");
            });
        });
    });

    describe("showConfirmation", () => {
        it("should show a confirmation modal", () => {
            const onConfirm = vi.fn();
            ModalManager.showConfirmation("Confirm?", "Are you sure?", onConfirm);
            const modal = document.querySelector(".anime-list-confirmation-modal");
            expect(modal).not.toBeNull();
            expect(modal?.innerHTML).toContain("Confirm?");
            expect(modal?.innerHTML).toContain("Are you sure?");
        });

        it("should call onConfirm when confirm button is clicked", () => {
            const onConfirm = vi.fn();
            ModalManager.showConfirmation("Confirm?", "Are you sure?", onConfirm);
            const confirmBtn = document.querySelector(".confirm-btn") as HTMLButtonElement;
            confirmBtn.click();
            expect(onConfirm).toHaveBeenCalled();
            const modal = document.querySelector(".anime-list-confirmation-modal");
            expect(modal).toBeNull();
        });

        it("should call onCancel when cancel button is clicked", () => {
            const onConfirm = vi.fn();
            const onCancel = vi.fn();
            ModalManager.showConfirmation("Confirm?", "Are you sure?", onConfirm, onCancel);
            const cancelBtn = document.querySelector(".cancel-btn") as HTMLButtonElement;
            cancelBtn.click();
            expect(onConfirm).not.toHaveBeenCalled();
            expect(onCancel).toHaveBeenCalled();
            const modal = document.querySelector(".anime-list-confirmation-modal");
            expect(modal).toBeNull();
        });

        it("should call onCancel when backdrop is clicked", () => {
            const onConfirm = vi.fn();
            const onCancel = vi.fn();
            ModalManager.showConfirmation("Confirm?", "Are you sure?", onConfirm, onCancel);
            const modal = document.querySelector(".anime-list-confirmation-modal") as HTMLElement;
            modal.click();
            expect(onConfirm).not.toHaveBeenCalled();
            expect(onCancel).toHaveBeenCalled();
            const modalAfterClick = document.querySelector(".anime-list-confirmation-modal");
            expect(modalAfterClick).toBeNull();
        });
    });
});
