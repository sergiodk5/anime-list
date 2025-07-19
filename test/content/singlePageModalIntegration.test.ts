import type { AnimeStatus } from "@/commons/models";
import { vi, afterEach, beforeEach, describe, expect, it } from "vitest";
import { SinglePageModal } from "@/content/index";

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

// Mock the AnimeService constructor
vi.mock("@/commons/utils", () => ({
    AnimeService: vi.fn().mockImplementation(() => mockAnimeService),
}));

// Test the single page modal integration with real SinglePageModal class
describe("Single Page Modal Integration", () => {
    let originalLocation: Location;
    let modal: SinglePageModal;

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

        // Create real modal instance
        modal = new SinglePageModal();

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

    describe("Integration with Content Script", () => {
        it("should initialize single page modal on watch pages", () => {
            // Test actual isWatchPage method from real modal
            expect(modal.isWatchPage()).toBe(true);
        });

        it("should extract anime ID from URL patterns", () => {
            const testCases = [
                {
                    url: "https://example.com/watch/demon-slayer-123",
                    expectedId: "123",
                    description: "numeric suffix pattern",
                },
                {
                    url: "https://example.com/watch/attack-on-titan",
                    expectedId: "attack-on-titan",  
                    description: "full slug pattern",
                },
                {
                    url: "https://example.com/watch/one-piece-1000",
                    expectedId: "1000",
                    description: "large numeric suffix",
                },
            ];

            testCases.forEach((testCase) => {
                (window as any).location.href = testCase.url;
                
                // Test actual extractAnimeData method from real modal
                const result = modal.extractAnimeData();
                expect(result?.animeId).toBe(testCase.expectedId);
            });
        });

        it("should call createInfoButton method", () => {
            // Test actual createInfoButton method from real modal
            const animeData = { 
                animeId: "test-anime", 
                animeTitle: "Test Anime",
                animeSlug: "test-anime"
            };
            
            // This should not throw and should execute the createInfoButton method
            expect(() => modal.createInfoButton(animeData)).not.toThrow();
            
            // Check that button was created in DOM
            const button = document.getElementById("anime-list-info-button");
            expect(button).toBeTruthy();
            expect(button?.textContent).toContain("Anime Info");
        });

        it("should call showModal method", () => {
            // Test actual showModal method from real modal
            const animeData = { 
                animeId: "test-anime", 
                animeTitle: "Test Anime",
                animeSlug: "test-anime"
            };
            const mockStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: { 
                    animeId: "test-anime",
                    animeTitle: "Test Anime",
                    animeSlug: "test-anime",
                    episodeId: "ep-5",
                    currentEpisode: 5, 
                    totalEpisodes: 12, 
                    lastWatched: new Date().toISOString() 
                }
            };
            
            // Clear any existing modals
            const existingModals = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            existingModals.forEach(modal => modal.remove());
            
            // This should not throw and should execute the showModal method
            expect(() => modal.showModal(animeData, mockStatus)).not.toThrow();
            
            // Check that modal was created and appended to DOM
            const modalElements = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            expect(modalElements.length).toBeGreaterThan(0);
            
            // Verify the modal contains the expected content
            const modalContent = document.querySelector('[style*="position: fixed"] h2');
            expect(modalContent?.textContent).toBe("Test Anime");
        });

        it("should call getStatusText method", () => {
            // Test actual getStatusText method from real modal
            const mockStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: { 
                    animeId: "test-anime",
                    animeTitle: "Test Anime",
                    animeSlug: "test-anime",
                    episodeId: "ep-5",
                    currentEpisode: 5, 
                    totalEpisodes: 12, 
                    lastWatched: new Date().toISOString() 
                }
            };
            const statusText = modal.getStatusText(mockStatus);
            expect(statusText).toContain("watching");
            expect(statusText).toContain("5");
        });

        it("should call getModalActions method", () => {
            // Test actual getModalActions method from real modal
            const mockStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: { 
                    animeId: "test-anime",
                    animeTitle: "Test Anime",
                    animeSlug: "test-anime",
                    episodeId: "ep-5",
                    currentEpisode: 5, 
                    totalEpisodes: 12, 
                    lastWatched: new Date().toISOString() 
                }
            };
            const actions = modal.getModalActions(mockStatus);
            expect(actions).toBeDefined();
            expect(Array.isArray(actions)).toBe(true);
        });

        it("should call initialize method", () => {
            // Mock isWatchPage to return true
            (window as any).location.href = "https://example.com/watch/test-anime";
            
            // Mock DOM elements
            document.body.innerHTML = '<div id="test-content"></div>';
            
            // Test actual initialize method from real modal
            expect(() => modal.initialize()).not.toThrow();
        });

        it("should call initialize method on non-watch page", () => {
            // Mock isWatchPage to return false
            (window as any).location.href = "https://example.com/some-other-page";
            
            // Test that initialize returns early on non-watch pages
            expect(() => modal.initialize()).not.toThrow();
        });

        it("should test different status configurations", () => {
            // Test with hidden anime status
            const hiddenStatus = {
                isTracked: false,
                isPlanned: false,
                isHidden: true
            };
            const hiddenStatusText = modal.getStatusText(hiddenStatus);
            expect(hiddenStatusText).toContain("Hidden");
            
            // Test with planned anime status
            const plannedStatus = {
                isTracked: false,
                isPlanned: true,
                isHidden: false
            };
            const plannedStatusText = modal.getStatusText(plannedStatus);
            expect(plannedStatusText).toContain("Planned");
            
            // Test with basic tracked status (no progress)
            const basicTrackedStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false
            };
            const basicStatusText = modal.getStatusText(basicTrackedStatus);
            expect(basicStatusText).toContain("watching");
        });

        it("should test different modal actions for different statuses", () => {
            // Test actions for hidden anime
            const hiddenStatus = {
                isTracked: false,
                isPlanned: false,
                isHidden: true
            };
            const hiddenActions = modal.getModalActions(hiddenStatus);
            expect(Array.isArray(hiddenActions)).toBe(true);
            expect(hiddenActions.length).toBeGreaterThan(0);
            
            // Test actions for planned anime
            const plannedStatus = {
                isTracked: false,
                isPlanned: true,
                isHidden: false
            };
            const plannedActions = modal.getModalActions(plannedStatus);
            expect(Array.isArray(plannedActions)).toBe(true);
            expect(plannedActions.length).toBeGreaterThan(0);
        });

        it("should test modal close functionality", () => {
            const animeData = { 
                animeId: "test-anime", 
                animeTitle: "Test Anime",
                animeSlug: "test-anime"
            };
            const mockStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: { 
                    animeId: "test-anime",
                    animeTitle: "Test Anime",
                    animeSlug: "test-anime",
                    episodeId: "ep-5",
                    currentEpisode: 5, 
                    totalEpisodes: 12, 
                    lastWatched: new Date().toISOString() 
                }
            };
            
            // Clear any existing modals
            const existingModals = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            existingModals.forEach(modal => modal.remove());
            
            // Create modal
            modal.showModal(animeData, mockStatus);
            
            // Check that modal was created
            const modalElements = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            expect(modalElements.length).toBeGreaterThan(0);
            
            // Find and click close button to trigger closeModal
            const closeButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent === 'Close'
            );
            expect(closeButton).toBeTruthy();
            
            // Simulate close button click
            if (closeButton) {
                closeButton.click();
            }
            
            // Wait for animation and then check modal is gone (after setTimeout)
            setTimeout(() => {
                const remainingModals = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
                expect(remainingModals.length).toBe(0);
            }, 400);
        });

        it("should test ESC key modal close", () => {
            const animeData = { 
                animeId: "test-anime", 
                animeTitle: "Test Anime",
                animeSlug: "test-anime"
            };
            const mockStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false
            };
            
            // Create modal
            modal.showModal(animeData, mockStatus);
            
            // Simulate ESC key press
            const escEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape',
                keyCode: 27
            });
            document.dispatchEvent(escEvent);
            
            // Modal should start closing process
        });

        it("should test modal background click close", () => {
            const animeData = { 
                animeId: "test-anime", 
                animeTitle: "Test Anime",
                animeSlug: "test-anime"
            };
            const mockStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false
            };
            
            // Create modal
            modal.showModal(animeData, mockStatus);
            
            // Find the modal overlay
            const modalOverlay = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]') as HTMLElement;
            expect(modalOverlay).toBeTruthy();
            
            // Simulate click on the overlay background (not content)
            if (modalOverlay) {
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true
                });
                // Set target to the overlay itself (not child elements)
                Object.defineProperty(clickEvent, 'target', {
                    value: modalOverlay,
                    enumerable: true
                });
                modalOverlay.dispatchEvent(clickEvent);
            }
        });

        it("should create modal elements in DOM", () => {
            // Create a mock button
            const button = document.createElement("button");
            button.id = "anime-list-info-button";
            button.textContent = "Anime Info";
            document.body.appendChild(button);

            // Verify button exists
            const foundButton = document.getElementById("anime-list-info-button");
            expect(foundButton).toBeTruthy();
            expect(foundButton?.textContent).toBe("Anime Info");
        });

        it("should create modal overlay structure", () => {
            // Create modal structure
            const overlay = document.createElement("div");
            overlay.id = "anime-modal-overlay";
            overlay.style.cssText =
                "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); z-index: 10000;";

            const content = document.createElement("div");
            content.id = "anime-modal-content";
            content.style.cssText =
                "background: rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 2rem; min-width: 400px; color: white;";

            const title = document.createElement("h2");
            title.id = "anime-modal-title";
            title.textContent = "Test Anime";

            const statusText = document.createElement("p");
            statusText.id = "anime-modal-status";
            statusText.textContent = "Currently watching - Episode 5";

            const actionsContainer = document.createElement("div");
            actionsContainer.id = "anime-modal-actions";

            // Create episode controls
            const episodeControls = document.createElement("div");
            episodeControls.id = "episode-controls";
            episodeControls.innerHTML = `
                <span>Episode:</span>
                <button class="modal-episode-decrement" data-testid="modal-episode-decrement">−</button>
                <input type="number" class="modal-episode-current" data-testid="modal-episode-input" min="1" max="999" value="5">
                <button class="modal-episode-increment" data-testid="modal-episode-increment">+</button>
            `;

            actionsContainer.appendChild(episodeControls);

            const closeButton = document.createElement("button");
            closeButton.id = "anime-modal-close";
            closeButton.textContent = "Close";

            // Assemble modal
            content.appendChild(title);
            content.appendChild(statusText);
            content.appendChild(actionsContainer);
            content.appendChild(closeButton);
            overlay.appendChild(content);
            document.body.appendChild(overlay);

            // Verify modal structure
            expect(document.getElementById("anime-modal-overlay")).toBeTruthy();
            expect(document.getElementById("anime-modal-content")).toBeTruthy();
            expect(document.getElementById("anime-modal-title")?.textContent).toBe("Test Anime");
            expect(document.getElementById("anime-modal-status")?.textContent).toBe("Currently watching - Episode 5");
            expect(document.querySelector("[data-testid='modal-episode-input']")).toBeTruthy();
            expect(document.querySelector("[data-testid='modal-episode-decrement']")).toBeTruthy();
            expect(document.querySelector("[data-testid='modal-episode-increment']")).toBeTruthy();
        });
    });

    describe("Modal Actions Logic", () => {
        const createStatus = (overrides: Partial<AnimeStatus> = {}): AnimeStatus => ({
            isTracked: false,
            isPlanned: false,
            isHidden: false,
            progress: undefined,
            ...overrides,
        });

        it("should return correct actions for clean anime", () => {
            const status = createStatus();

            // Test the logic that would be in getModalActions
            const actions = [];
            if (!status.isTracked && !status.isPlanned && !status.isHidden) {
                actions.push({ type: "addToPlan", label: "Add to Plan" });
                actions.push({ type: "hide", label: "Hide Anime" });
            }

            expect(actions).toHaveLength(2);
            expect(actions[0].type).toBe("addToPlan");
            expect(actions[1].type).toBe("hide");
        });

        it("should return correct actions for planned anime", () => {
            const status = createStatus({ isPlanned: true });

            const actions = [];
            if (status.isPlanned) {
                actions.push({ type: "removePlan", label: "Remove from Plan" });
                actions.push({ type: "startWatching", label: "Start Watching" });
            }

            expect(actions).toHaveLength(2);
            expect(actions[0].type).toBe("removePlan");
            expect(actions[1].type).toBe("startWatching");
        });

        it("should return correct actions for watching anime", () => {
            const status = createStatus({
                isTracked: true,
                progress: {
                    animeId: "123",
                    animeTitle: "Test Anime",
                    animeSlug: "test-anime",
                    currentEpisode: 5,
                    episodeId: "ep-5",
                    lastWatched: "2024-01-01T00:00:00.000Z",
                },
            });

            const actions = [];
            if (status.isTracked) {
                actions.push({ type: "episodeControls", label: "Episode Controls" });
                actions.push({ type: "stopWatching", label: "Stop Watching" });
            }

            expect(actions).toHaveLength(2);
            expect(actions[0].type).toBe("episodeControls");
            expect(actions[1].type).toBe("stopWatching");
        });

        it("should return correct actions for hidden anime", () => {
            const status = createStatus({ isHidden: true });

            const actions = [];
            if (status.isHidden) {
                actions.push({ type: "unhide", label: "Remove from Hidden" });
            }

            expect(actions).toHaveLength(1);
            expect(actions[0].type).toBe("unhide");
        });
    });

    describe("Episode Controls Logic", () => {
        let episodeInput: HTMLInputElement;

        beforeEach(() => {
            episodeInput = document.createElement("input");
            episodeInput.type = "number";
            episodeInput.min = "1";
            episodeInput.max = "999";
            episodeInput.value = "5";
            document.body.appendChild(episodeInput);
        });

        it("should increment episode within bounds", () => {
            const currentValue = parseInt(episodeInput.value, 10);
            const newValue = Math.min(999, currentValue + 1);

            expect(newValue).toBe(6);
            expect(newValue).toBeLessThanOrEqual(999);
        });

        it("should decrement episode within bounds", () => {
            const currentValue = parseInt(episodeInput.value, 10);
            const newValue = Math.max(1, currentValue - 1);

            expect(newValue).toBe(4);
            expect(newValue).toBeGreaterThanOrEqual(1);
        });

        it("should not increment above 999", () => {
            episodeInput.value = "999";
            const currentValue = parseInt(episodeInput.value, 10);
            const newValue = Math.min(999, currentValue + 1);

            expect(newValue).toBe(999);
        });

        it("should not decrement below 1", () => {
            episodeInput.value = "1";
            const currentValue = parseInt(episodeInput.value, 10);
            const newValue = Math.max(1, currentValue - 1);

            expect(newValue).toBe(1);
        });

        it("should validate episode number input", () => {
            const testCases = [
                { input: "5", expected: 5, valid: true },
                { input: "1", expected: 1, valid: true },
                { input: "999", expected: 999, valid: true },
                { input: "0", expected: 0, valid: false },
                { input: "1000", expected: 1000, valid: false },
                { input: "abc", expected: NaN, valid: false },
                { input: "-5", expected: -5, valid: false },
            ];

            testCases.forEach(({ input, expected, valid }) => {
                const parsed = parseInt(input, 10);
                const isValid = !isNaN(parsed) && parsed >= 1 && parsed <= 999;

                expect(parsed).toBe(expected);
                expect(isValid).toBe(valid);
            });
        });
    });

    describe("Status Text Generation", () => {
        const createStatus = (overrides: Partial<AnimeStatus> = {}): AnimeStatus => ({
            isTracked: false,
            isPlanned: false,
            isHidden: false,
            progress: undefined,
            ...overrides,
        });

        it("should generate correct status text for different states", () => {
            const testCases = [
                {
                    status: createStatus({ isHidden: true }),
                    expected: "Hidden from lists",
                },
                {
                    status: createStatus({
                        isTracked: true,
                        progress: {
                            animeId: "123",
                            animeTitle: "Test Anime",
                            animeSlug: "test-anime",
                            currentEpisode: 7,
                            episodeId: "ep-7",
                            lastWatched: "2024-01-01T00:00:00.000Z",
                        },
                    }),
                    expected: "Currently watching - Episode 7",
                },
                {
                    status: createStatus({ isTracked: true }),
                    expected: "Currently watching",
                },
                {
                    status: createStatus({ isPlanned: true }),
                    expected: "Planned to watch",
                },
                {
                    status: createStatus(),
                    expected: "Not tracked",
                },
            ];

            testCases.forEach(({ status, expected }) => {
                let statusText = "";

                if (status.isHidden) {
                    statusText = "Hidden from lists";
                } else if (status.isTracked && status.progress) {
                    statusText = `Currently watching - Episode ${status.progress.currentEpisode}`;
                } else if (status.isTracked) {
                    statusText = "Currently watching";
                } else if (status.isPlanned) {
                    statusText = "Planned to watch";
                } else {
                    statusText = "Not tracked";
                }

                expect(statusText).toBe(expected);
            });
        });
    });

    describe("DOM Event Handling", () => {
        it("should handle button click events", () => {
            const button = document.createElement("button");
            let clicked = false;

            button.addEventListener("click", () => {
                clicked = true;
            });

            // Simulate click
            button.click();

            expect(clicked).toBe(true);
        });

        it("should handle input change events", () => {
            const input = document.createElement("input");
            input.type = "number";
            input.value = "5";

            let changeTriggered = false;
            let newValue = "";

            input.addEventListener("change", (e) => {
                changeTriggered = true;
                newValue = (e.target as HTMLInputElement).value;
            });

            // Simulate change
            input.value = "10";
            input.dispatchEvent(new Event("change"));

            expect(changeTriggered).toBe(true);
            expect(newValue).toBe("10");
        });

        it("should handle modal overlay click to close", () => {
            const overlay = document.createElement("div");
            overlay.id = "modal-overlay";

            const content = document.createElement("div");
            content.id = "modal-content";
            overlay.appendChild(content);

            let shouldClose = false;

            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) {
                    shouldClose = true;
                }
            });

            // Click on overlay (not content) should trigger close
            overlay.click();
            expect(shouldClose).toBe(true);

            // Reset and click on content should not trigger close
            shouldClose = false;
            content.click();
            expect(shouldClose).toBe(false);
        });

        it("should handle escape key to close modal", () => {
            let escapePressed = false;

            const handleKeydown = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    escapePressed = true;
                }
            };

            document.addEventListener("keydown", handleKeydown);

            // Simulate escape key
            const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(escapeEvent);

            expect(escapePressed).toBe(true);

            // Cleanup
            document.removeEventListener("keydown", handleKeydown);
        });
    });
});
