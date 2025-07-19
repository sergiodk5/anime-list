import type { AnimeData, AnimeStatus, EpisodeProgress } from "@/commons/models";
import { showToast } from "@/content/index";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Extend AnimeData for testing with debug info
interface TestAnimeData extends AnimeData {
    debugInfo?: {
        url: string;
        originalSlug: string;
        extractionStrategy: string;
        titleSelectorUsed: string;
        usedFallbackId?: boolean;
    };
}

// Mock the AnimeService
const mockAnimeService = {
    getAnimeStatus: vi.fn(),
    addToPlanToWatch: vi.fn(),
    removeFromPlanToWatch: vi.fn(),
    startWatching: vi.fn(),
    stopWatching: vi.fn(),
    hideAnime: vi.fn(),
    unhideAnime: vi.fn(),
    updateEpisodeProgress: vi.fn(),
};

// Mock showToast function
vi.mock("@/content/index", async () => {
    const actual = await vi.importActual("@/content/index");
    return {
        ...actual,
        showToast: vi.fn(),
    };
});

// Create a mock SinglePageModal class for testing
class TestSinglePageModal {
    private animeService = mockAnimeService;
    private modalElement: HTMLElement | null = null;

    isWatchPage(): boolean {
        return window.location.href.includes("/watch/");
    }

    extractAnimeData(): TestAnimeData | null {
        try {
            const url = window.location.href;
            const urlMatch = url.match(/\/watch\/([^/?]+)/);
            if (!urlMatch) return null;

            const originalSlug = urlMatch[1];
            let animeId = originalSlug;

            // Strategy 1: Extract numeric ID from end
            const numericIdMatch = originalSlug.match(/-(\d+)$/);
            if (numericIdMatch) {
                animeId = numericIdMatch[1];
            }

            // Try different selectors to get anime title
            const titleSelectors = [
                ".ani_detail-info h2",
                ".watch-detail .title",
                "h1.anime-title",
                "h1",
                "h2",
                "[class*='title']",
                ".film-name",
                ".anime-title",
            ];

            let animeTitle = originalSlug;
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element?.textContent?.trim()) {
                    animeTitle = element.textContent.trim();
                    break;
                }
            }

            const animeData: TestAnimeData = {
                animeId,
                animeTitle,
                animeSlug: originalSlug.toLowerCase(),
                debugInfo: {
                    url,
                    originalSlug,
                    extractionStrategy: numericIdMatch ? "numeric-suffix" : "full-slug",
                    titleSelectorUsed:
                        titleSelectors.find((sel) => document.querySelector(sel)?.textContent?.trim()) || "none",
                },
            };

            return animeData;
        } catch (error) {
            console.error("Error extracting anime data:", error);
            return null;
        }
    }

    createInfoButton(animeData: AnimeData): void {
        // Remove existing button
        const existingButton = document.getElementById("anime-list-info-button");
        if (existingButton) {
            existingButton.remove();
        }

        // Create button
        const button = document.createElement("button");
        button.id = "anime-list-info-button";
        button.textContent = "Anime Info";

        // Add styles
        const style = document.createElement("style");
        style.id = "anime-list-button-styles";
        style.textContent = `
            #anime-list-info-button {
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 9999;
                padding: 12px 20px;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9));
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
            }
        `;

        if (!document.querySelector("#anime-list-button-styles")) {
            document.head.appendChild(style);
        }

        button.addEventListener("click", () => this.openModal(animeData));
        document.body.appendChild(button);
    }

    async openModal(animeData: AnimeData): Promise<void> {
        try {
            let status = await this.animeService.getAnimeStatus(animeData.animeId);

            // If not found and we used numeric extraction, try with full slug as backup
            const debug = (animeData as any).debugInfo || {};
            if (
                !status.isTracked &&
                !status.isPlanned &&
                !status.isHidden &&
                debug.extractionStrategy === "numeric-suffix" &&
                debug.originalSlug
            ) {
                const alternativeStatus = await this.animeService.getAnimeStatus(debug.originalSlug);
                if (alternativeStatus.isTracked || alternativeStatus.isPlanned || alternativeStatus.isHidden) {
                    status = alternativeStatus;
                    animeData.animeId = debug.originalSlug;
                    debug.usedFallbackId = true;
                }
            }

            this.showModal(animeData, status);
        } catch (error) {
            console.error("Error opening modal:", error);
            showToast("Error loading anime information", "error");
        }
    }

    showModal(animeData: AnimeData, status: AnimeStatus): void {
        if (this.modalElement) {
            this.closeModal();
        }

        // Create modal overlay
        this.modalElement = document.createElement("div");
        this.modalElement.id = "anime-modal-overlay";
        this.modalElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create modal content
        const modalContent = document.createElement("div");
        modalContent.id = "anime-modal-content";
        modalContent.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 2rem;
            min-width: 400px;
            color: white;
        `;

        // Add title
        const title = document.createElement("h2");
        title.textContent = animeData.animeTitle;
        title.id = "anime-modal-title";

        // Add status
        const statusText = document.createElement("p");
        statusText.textContent = this.getStatusText(status);
        statusText.id = "anime-modal-status";

        // Add actions
        const actions = this.getModalActions(status);
        const actionsContainer = document.createElement("div");
        actionsContainer.id = "anime-modal-actions";

        actions.forEach((action, index) => {
            if (action.type === "episodeControls") {
                const episodeControls = this.createEpisodeControls(status, animeData);
                actionsContainer.appendChild(episodeControls);
            } else {
                const button = document.createElement("button");
                button.textContent = action.label;
                button.setAttribute("data-action", action.type);
                button.setAttribute("data-testid", `modal-action-${action.type}`);
                button.addEventListener("click", () => this.handleAction(action.type, animeData));
                actionsContainer.appendChild(button);
            }
        });

        // Close button
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.id = "anime-modal-close";
        closeButton.setAttribute("data-testid", "modal-close-button");
        closeButton.addEventListener("click", () => this.closeModal());

        // Assemble modal
        modalContent.appendChild(title);
        modalContent.appendChild(statusText);
        modalContent.appendChild(actionsContainer);
        modalContent.appendChild(closeButton);
        this.modalElement.appendChild(modalContent);

        document.body.appendChild(this.modalElement);
    }

    createEpisodeControls(status: AnimeStatus, animeData: AnimeData): HTMLElement {
        const container = document.createElement("div");
        container.id = "episode-controls";
        container.setAttribute("data-testid", "modal-episode-controls");

        const currentEpisode = status.progress?.currentEpisode || 1;

        container.innerHTML = `
            <span>Episode:</span>
            <button class="modal-episode-decrement" data-testid="modal-episode-decrement">−</button>
            <input type="number" class="modal-episode-current" data-testid="modal-episode-input" min="1" max="999" value="${currentEpisode}">
            <button class="modal-episode-increment" data-testid="modal-episode-increment">+</button>
        `;

        // Add event listeners
        const decrementBtn = container.querySelector(".modal-episode-decrement") as HTMLButtonElement;
        const incrementBtn = container.querySelector(".modal-episode-increment") as HTMLButtonElement;
        const episodeInput = container.querySelector(".modal-episode-current") as HTMLInputElement;

        decrementBtn.addEventListener("click", async () => {
            const current = parseInt(episodeInput.value, 10);
            const newEpisode = Math.max(1, current - 1);
            if (newEpisode !== current) {
                episodeInput.value = newEpisode.toString();
                await this.updateEpisode(animeData.animeId, newEpisode);
            }
        });

        incrementBtn.addEventListener("click", async () => {
            const current = parseInt(episodeInput.value, 10);
            const newEpisode = Math.min(999, current + 1);
            if (newEpisode !== current) {
                episodeInput.value = newEpisode.toString();
                await this.updateEpisode(animeData.animeId, newEpisode);
            }
        });

        episodeInput.addEventListener("change", async () => {
            const newEpisode = parseInt(episodeInput.value, 10);
            if (!isNaN(newEpisode) && newEpisode >= 1 && newEpisode <= 999) {
                await this.updateEpisode(animeData.animeId, newEpisode);
            } else {
                episodeInput.value = (status.progress?.currentEpisode || 1).toString();
            }
        });

        return container;
    }

    getStatusText(status: AnimeStatus): string {
        if (status.isHidden) return "Hidden from lists";
        if (status.isTracked && status.progress) {
            return `Currently watching - Episode ${status.progress.currentEpisode}`;
        }
        if (status.isTracked) return "Currently watching";
        if (status.isPlanned) return "Planned to watch";
        return "Not tracked";
    }

    getModalActions(status: AnimeStatus) {
        if (status.isHidden) {
            return [{ type: "unhide", label: "Remove from Hidden", style: "success" }];
        } else if (status.isPlanned) {
            return [
                { type: "removePlan", label: "Remove from Plan", style: "danger" },
                { type: "startWatching", label: "Start Watching", style: "primary" },
            ];
        } else if (status.isTracked) {
            return [
                { type: "episodeControls", label: "Episode Controls", style: "primary" },
                { type: "stopWatching", label: "Stop Watching", style: "danger" },
            ];
        } else {
            return [
                { type: "addToPlan", label: "Add to Plan", style: "primary" },
                { type: "hide", label: "Hide Anime", style: "warning" },
            ];
        }
    }

    async handleAction(actionType: string, animeData: AnimeData): Promise<void> {
        try {
            switch (actionType) {
                case "addToPlan":
                    await this.animeService.addToPlanToWatch(animeData);
                    showToast("Added to plan to watch", "success");
                    break;
                case "removePlan":
                    await this.animeService.removeFromPlanToWatch(animeData.animeId);
                    showToast("Removed from plan to watch", "info");
                    break;
                case "startWatching":
                    await this.animeService.startWatching(animeData, 1);
                    showToast("Started watching", "success");
                    break;
                case "stopWatching":
                    await this.animeService.stopWatching(animeData.animeId);
                    showToast("Stopped watching", "info");
                    break;
                case "hide":
                    await this.animeService.hideAnime(animeData.animeId);
                    showToast("Anime hidden", "info");
                    break;
                case "unhide":
                    await this.animeService.unhideAnime(animeData.animeId);
                    showToast("Removed from hidden", "success");
                    break;
            }
            this.closeModal();
        } catch (error) {
            console.error(`Error handling action ${actionType}:`, error);
            showToast("An error occurred", "error");
        }
    }

    async updateEpisode(animeId: string, newEpisode: number): Promise<void> {
        try {
            const result = await this.animeService.updateEpisodeProgress(animeId, newEpisode);
            if (result.success) {
                showToast(`Updated to episode ${newEpisode}`, "success");
            } else {
                showToast(result.message || "Error updating episode", "error");
            }
        } catch (error) {
            console.error("Error updating episode:", error);
            showToast("Error updating episode", "error");
        }
    }

    closeModal(): void {
        if (this.modalElement && this.modalElement.parentNode) {
            this.modalElement.parentNode.removeChild(this.modalElement);
            this.modalElement = null;
        }
    }

    initialize(): void {
        if (!this.isWatchPage()) return;

        const animeData = this.extractAnimeData();
        if (animeData) {
            this.createInfoButton(animeData);
        }
    }
}

describe("SinglePageModal", () => {
    let modal: TestSinglePageModal;
    let originalLocation: Location;

    // Helper function to create proper EpisodeProgress objects
    const createEpisodeProgress = (currentEpisode: number, animeId = "123"): EpisodeProgress => ({
        animeId,
        animeTitle: "Test Anime",
        animeSlug: "test-anime",
        currentEpisode,
        episodeId: `ep-${currentEpisode}`,
        lastWatched: "2024-01-01T00:00:00.000Z",
    });

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = "";
        document.head.innerHTML = "";

        // Mock window.location
        originalLocation = window.location;
        delete (window as any).location;
        (window as any).location = {
            href: "https://example.com/watch/test-anime-123",
        };

        // Create modal instance
        modal = new TestSinglePageModal();

        // Reset mocks
        vi.clearAllMocks();
        mockAnimeService.getAnimeStatus.mockResolvedValue({
            isTracked: false,
            isPlanned: false,
            isHidden: false,
            progress: undefined,
        });
    });

    afterEach(() => {
        // Restore window.location
        (window as any).location = originalLocation;

        // Clean up DOM
        document.body.innerHTML = "";
        document.head.innerHTML = "";
    });

    describe("isWatchPage", () => {
        it("should return true for watch pages", () => {
            expect(modal.isWatchPage()).toBe(true);
        });

        it("should return false for non-watch pages", () => {
            (window as any).location.href = "https://example.com/search";
            expect(modal.isWatchPage()).toBe(false);
        });
    });

    describe("extractAnimeData", () => {
        it("should extract anime data from numeric suffix URL", () => {
            (window as any).location.href = "https://example.com/watch/demon-slayer-123";

            const data = modal.extractAnimeData();

            expect(data).toEqual({
                animeId: "123",
                animeTitle: "demon-slayer-123",
                animeSlug: "demon-slayer-123",
                debugInfo: {
                    url: "https://example.com/watch/demon-slayer-123",
                    originalSlug: "demon-slayer-123",
                    extractionStrategy: "numeric-suffix",
                    titleSelectorUsed: "none",
                },
            });
        });

        it("should extract anime data from full slug URL", () => {
            (window as any).location.href = "https://example.com/watch/demon-slayer";

            const data = modal.extractAnimeData();

            expect(data).toEqual({
                animeId: "demon-slayer",
                animeTitle: "demon-slayer",
                animeSlug: "demon-slayer",
                debugInfo: {
                    url: "https://example.com/watch/demon-slayer",
                    originalSlug: "demon-slayer",
                    extractionStrategy: "full-slug",
                    titleSelectorUsed: "none",
                },
            });
        });

        it("should extract title from DOM elements", () => {
            (window as any).location.href = "https://example.com/watch/test-anime";

            // Add title element to DOM
            const titleElement = document.createElement("h1");
            titleElement.textContent = "Attack on Titan";
            document.body.appendChild(titleElement);

            const data = modal.extractAnimeData();

            expect(data?.animeTitle).toBe("Attack on Titan");
            expect(data?.debugInfo?.titleSelectorUsed).toBe("h1");
        });

        it("should return null for invalid URLs", () => {
            (window as any).location.href = "https://example.com/invalid";

            const data = modal.extractAnimeData();

            expect(data).toBeNull();
        });
    });

    describe("createInfoButton", () => {
        it("should create anime info button", () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };

            modal.createInfoButton(animeData);

            const button = document.getElementById("anime-list-info-button");
            expect(button).toBeTruthy();
            expect(button?.textContent).toBe("Anime Info");
        });

        it("should remove existing button before creating new one", () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };

            // Create first button
            modal.createInfoButton(animeData);
            const firstButton = document.getElementById("anime-list-info-button");

            // Create second button
            modal.createInfoButton(animeData);
            const secondButton = document.getElementById("anime-list-info-button");

            // Should only have one button
            expect(document.querySelectorAll("#anime-list-info-button")).toHaveLength(1);
            expect(firstButton).not.toBe(secondButton);
        });

        it("should add styles to head", () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };

            modal.createInfoButton(animeData);

            const styles = document.getElementById("anime-list-button-styles");
            expect(styles).toBeTruthy();
            expect(styles?.textContent).toContain("#anime-list-info-button");
        });
    });

    describe("getStatusText", () => {
        it("should return correct text for hidden anime", () => {
            const status: AnimeStatus = {
                isHidden: true,
                isTracked: false,
                isPlanned: false,
                progress: undefined,
            };

            expect(modal.getStatusText(status)).toBe("Hidden from lists");
        });

        it("should return correct text for currently watching anime with progress", () => {
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: {
                    animeId: "123",
                    animeTitle: "Test Anime",
                    animeSlug: "test-anime",
                    currentEpisode: 5,
                    episodeId: "ep-5",
                    lastWatched: "2024-01-01T00:00:00.000Z",
                },
            };

            expect(modal.getStatusText(status)).toBe("Currently watching - Episode 5");
        });

        it("should return correct text for currently watching anime without progress", () => {
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: undefined,
            };

            expect(modal.getStatusText(status)).toBe("Currently watching");
        });

        it("should return correct text for planned anime", () => {
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: false,
                isPlanned: true,
                progress: undefined,
            };

            expect(modal.getStatusText(status)).toBe("Planned to watch");
        });

        it("should return correct text for not tracked anime", () => {
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: false,
                isPlanned: false,
                progress: undefined,
            };

            expect(modal.getStatusText(status)).toBe("Not tracked");
        });
    });

    describe("getModalActions", () => {
        it("should return unhide action for hidden anime", () => {
            const status: AnimeStatus = {
                isHidden: true,
                isTracked: false,
                isPlanned: false,
                progress: undefined,
            };

            const actions = modal.getModalActions(status);

            expect(actions).toEqual([{ type: "unhide", label: "Remove from Hidden", style: "success" }]);
        });

        it("should return plan actions for planned anime", () => {
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: false,
                isPlanned: true,
                progress: undefined,
            };

            const actions = modal.getModalActions(status);

            expect(actions).toEqual([
                { type: "removePlan", label: "Remove from Plan", style: "danger" },
                { type: "startWatching", label: "Start Watching", style: "primary" },
            ]);
        });

        it("should return watching actions for tracked anime", () => {
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: createEpisodeProgress(3),
            };

            const actions = modal.getModalActions(status);

            expect(actions).toEqual([
                { type: "episodeControls", label: "Episode Controls", style: "primary" },
                { type: "stopWatching", label: "Stop Watching", style: "danger" },
            ]);
        });

        it("should return default actions for clean anime", () => {
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: false,
                isPlanned: false,
                progress: undefined,
            };

            const actions = modal.getModalActions(status);

            expect(actions).toEqual([
                { type: "addToPlan", label: "Add to Plan", style: "primary" },
                { type: "hide", label: "Hide Anime", style: "warning" },
            ]);
        });
    });

    describe("showModal", () => {
        it("should create modal overlay and content", () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: false,
                isPlanned: false,
                progress: undefined,
            };

            modal.showModal(animeData, status);

            const overlay = document.getElementById("anime-modal-overlay");
            const content = document.getElementById("anime-modal-content");
            const title = document.getElementById("anime-modal-title");
            const statusEl = document.getElementById("anime-modal-status");

            expect(overlay).toBeTruthy();
            expect(content).toBeTruthy();
            expect(title?.textContent).toBe("Test Anime");
            expect(statusEl?.textContent).toBe("Not tracked");
        });

        it("should create episode controls for watching anime", () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: createEpisodeProgress(5),
            };

            modal.showModal(animeData, status);

            const episodeControls = document.querySelector("[data-testid='modal-episode-controls']");
            const episodeInput = document.querySelector("[data-testid='modal-episode-input']") as HTMLInputElement;

            expect(episodeControls).toBeTruthy();
            expect(episodeInput?.value).toBe("5");
        });

        it("should close existing modal before showing new one", () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: false,
                isPlanned: false,
                progress: undefined,
            };

            // Show first modal
            modal.showModal(animeData, status);
            const firstOverlay = document.getElementById("anime-modal-overlay");

            // Show second modal
            modal.showModal(animeData, status);
            const secondOverlay = document.getElementById("anime-modal-overlay");

            // Should only have one modal
            expect(document.querySelectorAll("#anime-modal-overlay")).toHaveLength(1);
            expect(firstOverlay).not.toBe(secondOverlay);
        });
    });

    describe("handleAction", () => {
        const animeData: AnimeData = {
            animeId: "123",
            animeTitle: "Test Anime",
            animeSlug: "test-anime",
        };

        it("should handle addToPlan action", async () => {
            mockAnimeService.addToPlanToWatch.mockResolvedValue({ success: true });

            await modal.handleAction("addToPlan", animeData);

            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalledWith(animeData);
            expect(showToast).toHaveBeenCalledWith("Added to plan to watch", "success");
        });

        it("should handle removePlan action", async () => {
            mockAnimeService.removeFromPlanToWatch.mockResolvedValue({ success: true });

            await modal.handleAction("removePlan", animeData);

            expect(mockAnimeService.removeFromPlanToWatch).toHaveBeenCalledWith("123");
            expect(showToast).toHaveBeenCalledWith("Removed from plan to watch", "info");
        });

        it("should handle startWatching action", async () => {
            mockAnimeService.startWatching.mockResolvedValue({ success: true });

            await modal.handleAction("startWatching", animeData);

            expect(mockAnimeService.startWatching).toHaveBeenCalledWith(animeData, 1);
            expect(showToast).toHaveBeenCalledWith("Started watching", "success");
        });

        it("should handle stopWatching action", async () => {
            mockAnimeService.stopWatching.mockResolvedValue({ success: true });

            await modal.handleAction("stopWatching", animeData);

            expect(mockAnimeService.stopWatching).toHaveBeenCalledWith("123");
            expect(showToast).toHaveBeenCalledWith("Stopped watching", "info");
        });

        it("should handle hide action", async () => {
            mockAnimeService.hideAnime.mockResolvedValue({ success: true });

            await modal.handleAction("hide", animeData);

            expect(mockAnimeService.hideAnime).toHaveBeenCalledWith("123");
            expect(showToast).toHaveBeenCalledWith("Anime hidden", "info");
        });

        it("should handle unhide action", async () => {
            mockAnimeService.unhideAnime.mockResolvedValue({ success: true });

            await modal.handleAction("unhide", animeData);

            expect(mockAnimeService.unhideAnime).toHaveBeenCalledWith("123");
            expect(showToast).toHaveBeenCalledWith("Removed from hidden", "success");
        });

        it("should handle errors gracefully", async () => {
            mockAnimeService.addToPlanToWatch.mockRejectedValue(new Error("Service error"));

            await modal.handleAction("addToPlan", animeData);

            expect(showToast).toHaveBeenCalledWith("An error occurred", "error");
        });
    });

    describe("updateEpisode", () => {
        it("should update episode successfully", async () => {
            mockAnimeService.updateEpisodeProgress.mockResolvedValue({
                success: true,
                message: "Updated",
            });

            await modal.updateEpisode("123", 5);

            expect(mockAnimeService.updateEpisodeProgress).toHaveBeenCalledWith("123", 5);
            expect(showToast).toHaveBeenCalledWith("Updated to episode 5", "success");
        });

        it("should handle update failure", async () => {
            mockAnimeService.updateEpisodeProgress.mockResolvedValue({
                success: false,
                message: "Update failed",
            });

            await modal.updateEpisode("123", 5);

            expect(showToast).toHaveBeenCalledWith("Update failed", "error");
        });

        it("should handle update error", async () => {
            mockAnimeService.updateEpisodeProgress.mockRejectedValue(new Error("Service error"));

            await modal.updateEpisode("123", 5);

            expect(showToast).toHaveBeenCalledWith("Error updating episode", "error");
        });
    });

    describe("episode controls", () => {
        it("should increment episode", async () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: createEpisodeProgress(5),
            };

            mockAnimeService.updateEpisodeProgress.mockResolvedValue({ success: true });

            modal.showModal(animeData, status);

            const incrementBtn = document.querySelector("[data-testid='modal-episode-increment']") as HTMLButtonElement;
            const episodeInput = document.querySelector("[data-testid='modal-episode-input']") as HTMLInputElement;

            incrementBtn.click();
            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async

            expect(episodeInput.value).toBe("6");
            expect(mockAnimeService.updateEpisodeProgress).toHaveBeenCalledWith("123", 6);
        });

        it("should decrement episode", async () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: createEpisodeProgress(5),
            };

            mockAnimeService.updateEpisodeProgress.mockResolvedValue({ success: true });

            modal.showModal(animeData, status);

            const decrementBtn = document.querySelector("[data-testid='modal-episode-decrement']") as HTMLButtonElement;
            const episodeInput = document.querySelector("[data-testid='modal-episode-input']") as HTMLInputElement;

            decrementBtn.click();
            await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for async

            expect(episodeInput.value).toBe("4");
            expect(mockAnimeService.updateEpisodeProgress).toHaveBeenCalledWith("123", 4);
        });

        it("should not decrement below 1", async () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: createEpisodeProgress(1),
            };

            modal.showModal(animeData, status);

            const decrementBtn = document.querySelector("[data-testid='modal-episode-decrement']") as HTMLButtonElement;
            const episodeInput = document.querySelector("[data-testid='modal-episode-input']") as HTMLInputElement;

            decrementBtn.click();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(episodeInput.value).toBe("1");
            expect(mockAnimeService.updateEpisodeProgress).not.toHaveBeenCalled();
        });

        it("should not increment above 999", async () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: createEpisodeProgress(999),
            };

            modal.showModal(animeData, status);

            const incrementBtn = document.querySelector("[data-testid='modal-episode-increment']") as HTMLButtonElement;
            const episodeInput = document.querySelector("[data-testid='modal-episode-input']") as HTMLInputElement;

            // Set value to 999
            episodeInput.value = "999";

            incrementBtn.click();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(episodeInput.value).toBe("999");
            expect(mockAnimeService.updateEpisodeProgress).not.toHaveBeenCalled();
        });

        it("should handle direct input", async () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: createEpisodeProgress(5),
            };

            mockAnimeService.updateEpisodeProgress.mockResolvedValue({ success: true });

            modal.showModal(animeData, status);

            const episodeInput = document.querySelector("[data-testid='modal-episode-input']") as HTMLInputElement;

            episodeInput.value = "10";
            episodeInput.dispatchEvent(new Event("change"));
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockAnimeService.updateEpisodeProgress).toHaveBeenCalledWith("123", 10);
        });

        it("should reset invalid input", async () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: createEpisodeProgress(5),
            };

            modal.showModal(animeData, status);

            const episodeInput = document.querySelector("[data-testid='modal-episode-input']") as HTMLInputElement;

            episodeInput.value = "invalid";
            episodeInput.dispatchEvent(new Event("change"));
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(episodeInput.value).toBe("5"); // Reset to original
            expect(mockAnimeService.updateEpisodeProgress).not.toHaveBeenCalled();
        });
    });

    describe("openModal", () => {
        it("should try fallback ID when primary ID not found", async () => {
            const animeData: TestAnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime-123",
                debugInfo: {
                    url: "https://example.com/watch/test-anime-123",
                    originalSlug: "test-anime-123",
                    extractionStrategy: "numeric-suffix",
                    titleSelectorUsed: "none",
                },
            };

            // Primary ID returns clean status
            mockAnimeService.getAnimeStatus
                .mockResolvedValueOnce({
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                    progress: undefined,
                })
                .mockResolvedValueOnce({
                    isTracked: true,
                    isPlanned: false,
                    isHidden: false,
                    progress: createEpisodeProgress(3, "test-anime-123"),
                });

            await modal.openModal(animeData);

            expect(mockAnimeService.getAnimeStatus).toHaveBeenCalledTimes(2);
            expect(mockAnimeService.getAnimeStatus).toHaveBeenCalledWith("123");
            expect(mockAnimeService.getAnimeStatus).toHaveBeenCalledWith("test-anime-123");

            // Should update animeData to use working ID
            expect(animeData.animeId).toBe("test-anime-123");
        });

        it("should handle errors during modal opening", async () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };

            mockAnimeService.getAnimeStatus.mockRejectedValue(new Error("Service error"));

            await modal.openModal(animeData);

            expect(showToast).toHaveBeenCalledWith("Error loading anime information", "error");
        });
    });

    describe("closeModal", () => {
        it("should remove modal from DOM", () => {
            const animeData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };
            const status: AnimeStatus = {
                isHidden: false,
                isTracked: false,
                isPlanned: false,
                progress: undefined,
            };

            modal.showModal(animeData, status);

            expect(document.getElementById("anime-modal-overlay")).toBeTruthy();

            modal.closeModal();

            expect(document.getElementById("anime-modal-overlay")).toBeFalsy();
        });

        it("should handle closing when no modal exists", () => {
            expect(() => modal.closeModal()).not.toThrow();
        });
    });

    describe("initialize", () => {
        it("should initialize on watch page", () => {
            // Mock extractAnimeData to return valid data
            const mockData: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };

            const spy = vi.spyOn(modal, "extractAnimeData").mockReturnValue(mockData);
            const createButtonSpy = vi.spyOn(modal, "createInfoButton");

            modal.initialize();

            expect(spy).toHaveBeenCalled();
            expect(createButtonSpy).toHaveBeenCalledWith(mockData);
        });

        it("should not initialize on non-watch page", () => {
            (window as any).location.href = "https://example.com/search";

            const spy = vi.spyOn(modal, "extractAnimeData");

            modal.initialize();

            expect(spy).not.toHaveBeenCalled();
        });

        it("should not create button if no anime data", () => {
            const spy = vi.spyOn(modal, "extractAnimeData").mockReturnValue(null);
            const createButtonSpy = vi.spyOn(modal, "createInfoButton");

            modal.initialize();

            expect(spy).toHaveBeenCalled();
            expect(createButtonSpy).not.toHaveBeenCalled();
        });
    });
});
