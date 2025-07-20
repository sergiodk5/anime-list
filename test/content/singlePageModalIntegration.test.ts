import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the AnimeService before importing the modules
vi.mock("@/commons/services", () => {
    const mockAnimeService = {
        getAnimeStatus: vi.fn(),
        addToPlanToWatch: vi.fn(),
        removeFromPlanToWatch: vi.fn(),
        startWatching: vi.fn(),
        stopWatching: vi.fn(),
        hideAnime: vi.fn(),
        unhideAnime: vi.fn(),
        updateEpisodeProgress: vi.fn(),
        clearAllHidden: vi.fn(),
    };

    return {
        AnimeService: vi.fn(() => mockAnimeService),
        __mockAnimeService: mockAnimeService, // Export for test usage with a different name
    };
});

import {
    createSinglePageInfoButton,
    extractSinglePageAnimeData,
    getSinglePageModalActions,
    getSinglePageStatusText,
    initializeSinglePage,
    isWatchPage,
    resetSinglePageAnimeService,
    showSinglePageModal,
    updateSinglePageEpisode,
} from "@/content";

// Get the mock from the mocked module
const mockAnimeServiceModule = await import("@/commons/services");
const mockAnimeService = (mockAnimeServiceModule as any).__mockAnimeService;

// Test the single page modal integration with plain functions
describe("Single Page Modal Integration", () => {
    let originalLocation: Location;

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

        // Reset the single page anime service to force mock usage
        resetSinglePageAnimeService();

        // Reset mocks
        vi.clearAllMocks();

        // Set up default mock return values
        mockAnimeService.getAnimeStatus.mockResolvedValue({
            isTracked: false,
            isPlanned: false,
            isHidden: false,
            progress: undefined,
        });
        mockAnimeService.addToPlanToWatch.mockResolvedValue({ success: true });
        mockAnimeService.removeFromPlanToWatch.mockResolvedValue({ success: true });
        mockAnimeService.startWatching.mockResolvedValue({ success: true });
        mockAnimeService.stopWatching.mockResolvedValue({ success: true });
        mockAnimeService.hideAnime.mockResolvedValue({ success: true });
        mockAnimeService.unhideAnime.mockResolvedValue({ success: true });
        mockAnimeService.updateEpisodeProgress.mockResolvedValue({ success: true });
        mockAnimeService.clearAllHidden.mockResolvedValue({ success: true });
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
            // Test actual isWatchPage function
            expect(isWatchPage()).toBe(true);
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

                // Test actual extractSinglePageAnimeData function
                const result = extractSinglePageAnimeData();
                expect(result?.animeId).toBe(testCase.expectedId);
            });
        });

        it("should call createSinglePageInfoButton function", () => {
            // Test actual createSinglePageInfoButton function
            const animeData = {
                animeId: "test-anime",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };

            // This should not throw and should execute the createSinglePageInfoButton function
            expect(() => createSinglePageInfoButton(animeData)).not.toThrow();

            // Check that button was created in DOM
            const button = document.getElementById("anime-list-info-button");
            expect(button).toBeTruthy();
            expect(button?.textContent).toContain("Anime Info");
        });

        it("should call showSinglePageModal function", () => {
            // Test actual showSinglePageModal function
            const animeData = {
                animeId: "test-anime",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
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
                    lastWatched: new Date().toISOString(),
                },
            };

            // Clear any existing modals
            const existingModals = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            existingModals.forEach((modal) => modal.remove());

            // This should not throw and should execute the showSinglePageModal function
            expect(() => showSinglePageModal(animeData, mockStatus)).not.toThrow();

            // Check that modal was created and appended to DOM
            const modalElements = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            expect(modalElements.length).toBeGreaterThan(0);

            // Verify the modal contains the expected content
            const modalContent = document.querySelector('[style*="position: fixed"] h2');
            expect(modalContent?.textContent).toBe("Test Anime");
        });

        it("should handle modal close operations", async () => {
            // Test modal close functionality
            const animeData = {
                animeId: "close-test",
                animeTitle: "Close Test Anime",
                animeSlug: "close-test-anime",
            };
            const mockStatus = {
                isTracked: false,
                isPlanned: false,
                isHidden: false,
                progress: undefined,
            };

            // Clear any existing modals
            const existingModals = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            existingModals.forEach((modal) => modal.remove());

            // Show modal first
            showSinglePageModal(animeData, mockStatus);

            // Find the modal
            const modalElement = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');
            expect(modalElement).toBeTruthy();

            // Find and click the close button that says "Close"
            const closeButton = Array.from(modalElement?.querySelectorAll("button") || []).find((btn) =>
                btn.textContent?.includes("Close"),
            );

            if (closeButton) {
                // Simulate clicking the close button
                (closeButton as HTMLElement).click();

                // Wait for the opacity transition and setTimeout
                await new Promise((resolve) => setTimeout(resolve, 350));
            } else {
                // If no explicit close button, test modal background click
                (modalElement as HTMLElement).click();
                await new Promise((resolve) => setTimeout(resolve, 350));
            }
        });

        it("should handle modal action button clicks", async () => {
            // Test modal action buttons that trigger closeModal
            const animeData = {
                animeId: "action-test",
                animeTitle: "Action Test Anime",
                animeSlug: "action-test-anime",
            };
            const mockStatus = {
                isTracked: false,
                isPlanned: false,
                isHidden: false,
                progress: undefined,
            };

            // Clear any existing modals
            const existingModals = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            existingModals.forEach((modal) => modal.remove());

            // Show modal
            showSinglePageModal(animeData, mockStatus);

            const modalElement = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');
            expect(modalElement).toBeTruthy();

            // Find action buttons - these should trigger closeModal when clicked
            const actionButtons = modalElement?.querySelectorAll("button");

            if (actionButtons && actionButtons.length > 0) {
                // Find a non-close button (action button)
                const actionButton = Array.from(actionButtons).find((btn) => !btn.textContent?.includes("Close"));

                if (actionButton) {
                    // Mock the AnimeService method that will be called
                    mockAnimeService.addToPlanToWatch.mockResolvedValue({ success: true });

                    // Simulate clicking the action button
                    (actionButton as HTMLElement).click();

                    // Wait for the async action and modal close
                    await new Promise((resolve) => setTimeout(resolve, 100));

                    // The modal should be closed after the action
                    // Check that the modal element is no longer visible
                    setTimeout(() => {
                        const visibleModal = document.querySelector(
                            '[style*="position: fixed"][style*="z-index: 10000"][style*="opacity: 1"]',
                        );
                        // The modal should either be removed or have opacity 0
                        if (visibleModal) {
                            expect(visibleModal.getAttribute("style")).toContain("opacity: 0");
                        }
                    }, 350);
                }
            }
        });

        it("should handle episode controls functionality", async () => {
            const animeData = {
                animeId: "episode-test",
                animeTitle: "Episode Test Anime",
                animeSlug: "episode-test-anime",
            };
            const mockStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: {
                    animeId: "episode-test",
                    animeTitle: "Episode Test Anime",
                    animeSlug: "episode-test-anime",
                    episodeId: "ep-5",
                    currentEpisode: 5,
                    totalEpisodes: 12,
                    lastWatched: new Date().toISOString(),
                },
            };

            // Clear any existing modals
            const existingModals = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            existingModals.forEach((modal) => modal.remove());

            // Show modal
            showSinglePageModal(animeData, mockStatus);

            // Find the episode controls
            const modalElement = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');
            const episodeInput = modalElement?.querySelector(".modal-episode-current") as HTMLInputElement;
            const incrementBtn = modalElement?.querySelector(".modal-episode-increment") as HTMLButtonElement;
            const decrementBtn = modalElement?.querySelector(".modal-episode-decrement") as HTMLButtonElement;

            expect(episodeInput).toBeTruthy();
            expect(incrementBtn).toBeTruthy();
            expect(decrementBtn).toBeTruthy();

            // Test initial value
            expect(episodeInput?.value).toBe("5");

            // Mock the updateEpisodeProgress call
            mockAnimeService.updateEpisodeProgress.mockResolvedValue({ success: true });

            // Test increment button
            if (incrementBtn) {
                (incrementBtn as HTMLElement).click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(episodeInput?.value).toBe("6");
            }

            // Test decrement button
            if (decrementBtn) {
                (decrementBtn as HTMLElement).click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(episodeInput?.value).toBe("5");
            }
        });

        it("should test getSinglePageStatusText function", () => {
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
                    lastWatched: new Date().toISOString(),
                },
            };

            const statusText = getSinglePageStatusText(mockStatus);
            expect(statusText).toContain("Currently watching - Episode 5");
        });

        it("should test getSinglePageModalActions function", () => {
            const mockStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: undefined,
            };

            const actions = getSinglePageModalActions(mockStatus);
            expect(actions).toHaveLength(2);
            expect(actions[0].type).toBe("episodeControls");
            expect(actions[1].type).toBe("stopWatching");
        });

        it("should test initializeSinglePage function", () => {
            // Non-watch page should do nothing
            (window as any).location.href = "https://example.com/home";
            expect(() => initializeSinglePage()).not.toThrow();
        });

        it("should test initializeSinglePage on watch page", () => {
            // Watch page should initialize
            (window as any).location.href = "https://example.com/watch/test-anime";
            expect(() => initializeSinglePage()).not.toThrow();
        });

        it("should return correct status text for different states", () => {
            const hiddenStatus = { isHidden: true, isTracked: false, isPlanned: false, progress: undefined };
            const hiddenStatusText = getSinglePageStatusText(hiddenStatus);
            expect(hiddenStatusText).toBe("Hidden from lists");

            const plannedStatus = { isHidden: false, isTracked: false, isPlanned: true, progress: undefined };
            const plannedStatusText = getSinglePageStatusText(plannedStatus);
            expect(plannedStatusText).toBe("Planned to watch");

            const basicTrackedStatus = { isHidden: false, isTracked: true, isPlanned: false, progress: undefined };
            const basicStatusText = getSinglePageStatusText(basicTrackedStatus);
            expect(basicStatusText).toBe("Currently watching");
        });

        it("should return correct modal actions for different states", () => {
            const hiddenStatus = { isHidden: true, isTracked: false, isPlanned: false, progress: undefined };
            const hiddenActions = getSinglePageModalActions(hiddenStatus);
            expect(hiddenActions).toEqual([{ type: "unhide", label: "Remove from Hidden", style: "success" }]);

            const plannedStatus = { isHidden: false, isTracked: false, isPlanned: true, progress: undefined };
            const plannedActions = getSinglePageModalActions(plannedStatus);
            expect(plannedActions).toEqual([
                { type: "removePlan", label: "Remove from Plan", style: "danger" },
                { type: "startWatching", label: "Start Watching", style: "primary" },
            ]);
        });

        it("should test updateSinglePageEpisode function", async () => {
            // Mock successful update
            mockAnimeService.updateEpisodeProgress.mockResolvedValue({ success: true });

            const result = await updateSinglePageEpisode("test-anime", 10);
            expect(result).toBe(true);
            expect(mockAnimeService.updateEpisodeProgress).toHaveBeenCalledWith("test-anime", 10);
        });

        it("should handle updateSinglePageEpisode errors", async () => {
            // Mock failed update
            mockAnimeService.updateEpisodeProgress.mockResolvedValue({ success: false, message: "Test error" });

            const result = await updateSinglePageEpisode("test-anime", 10);
            expect(result).toBe(false);
        });

        it("should handle updateSinglePageEpisode exception", async () => {
            // Mock exception thrown
            mockAnimeService.updateEpisodeProgress.mockRejectedValue(new Error("Service error"));

            const result = await updateSinglePageEpisode("test-anime", 10);
            expect(result).toBe(false);
        });

        it("should handle non-watch page in initializeSinglePage", () => {
            // Non-watch page should return early
            (window as any).location.href = "https://example.com/home";
            expect(() => initializeSinglePage()).not.toThrow();
        });

        it("should handle null anime data in initializeSinglePage", () => {
            // Watch page but no anime data extracted
            (window as any).location.href = "https://example.com/watch/invalid";

            expect(() => initializeSinglePage()).not.toThrow();
        });

        it("should handle URL without watch pattern in extractSinglePageAnimeData", () => {
            (window as any).location.href = "https://example.com/other/page";

            const result = extractSinglePageAnimeData();
            expect(result).toBeNull();
        });

        it("should handle error in extractSinglePageAnimeData", () => {
            // Save original location
            const savedLocation = (window as any).location;

            // Mock location to throw error by replacing with a getter that throws
            delete (window as any).location;
            Object.defineProperty(window, "location", {
                get: () => {
                    throw new Error("Location error");
                },
                configurable: true,
            });

            const result = extractSinglePageAnimeData();
            expect(result).toBeNull();

            // Restore location
            delete (window as any).location;
            (window as any).location = savedLocation;
        });

        it("should test all status text combinations", () => {
            // Test all possible status combinations
            const hiddenStatus = { isHidden: true, isTracked: false, isPlanned: false, progress: undefined };
            expect(getSinglePageStatusText(hiddenStatus)).toBe("Hidden from lists");

            const plannedStatus = { isHidden: false, isTracked: false, isPlanned: true, progress: undefined };
            expect(getSinglePageStatusText(plannedStatus)).toBe("Planned to watch");

            const basicTrackedStatus = { isHidden: false, isTracked: true, isPlanned: false, progress: undefined };
            expect(getSinglePageStatusText(basicTrackedStatus)).toBe("Currently watching");

            const trackedWithProgress = {
                isHidden: false,
                isTracked: true,
                isPlanned: false,
                progress: {
                    currentEpisode: 8,
                    animeId: "test",
                    animeTitle: "Test",
                    animeSlug: "test",
                    episodeId: "ep-8",
                    totalEpisodes: 12,
                    lastWatched: new Date().toISOString(),
                },
            };
            expect(getSinglePageStatusText(trackedWithProgress)).toBe("Currently watching - Episode 8");

            const notTrackedStatus = { isHidden: false, isTracked: false, isPlanned: false, progress: undefined };
            expect(getSinglePageStatusText(notTrackedStatus)).toBe("Not tracked");
        });

        it("should test all modal action combinations", () => {
            // Test hidden status actions
            const hiddenStatus = { isHidden: true, isTracked: false, isPlanned: false, progress: undefined };
            const hiddenActions = getSinglePageModalActions(hiddenStatus);
            expect(hiddenActions).toEqual([{ type: "unhide", label: "Remove from Hidden", style: "success" }]);

            // Test planned status actions
            const plannedStatus = { isHidden: false, isTracked: false, isPlanned: true, progress: undefined };
            const plannedActions = getSinglePageModalActions(plannedStatus);
            expect(plannedActions).toEqual([
                { type: "removePlan", label: "Remove from Plan", style: "danger" },
                { type: "startWatching", label: "Start Watching", style: "primary" },
            ]);

            // Test tracked status actions
            const trackedStatus = { isHidden: false, isTracked: true, isPlanned: false, progress: undefined };
            const trackedActions = getSinglePageModalActions(trackedStatus);
            expect(trackedActions).toEqual([
                { type: "episodeControls", label: "Episode Controls", style: "primary" },
                { type: "stopWatching", label: "Stop Watching", style: "danger" },
            ]);

            // Test not tracked status actions
            const notTrackedStatus = { isHidden: false, isTracked: false, isPlanned: false, progress: undefined };
            const notTrackedActions = getSinglePageModalActions(notTrackedStatus);
            expect(notTrackedActions).toEqual([
                { type: "addToPlan", label: "Add to Plan", style: "primary" },
                { type: "hide", label: "Hide Anime", style: "warning" },
            ]);
        });
    });

    describe("Modal Service Integration", () => {
        it("should test modal with service fallback logic", async () => {
            const animeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
                debugInfo: {
                    extractionStrategy: "numeric-suffix",
                    originalSlug: "test-anime-123",
                },
            };

            // Mock first call to return not found, second call to return found
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
                    progress: {
                        currentEpisode: 5,
                        animeId: "test-anime-123",
                        animeTitle: "Test",
                        animeSlug: "test",
                        episodeId: "ep-5",
                        totalEpisodes: 12,
                        lastWatched: new Date().toISOString(),
                    },
                });

            // Clear any existing modals
            const existingModals = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            existingModals.forEach((modal) => modal.remove());

            // Create info button and click it to trigger openModal
            createSinglePageInfoButton(animeData);
            const button = document.getElementById("anime-list-info-button");
            expect(button).toBeTruthy();

            // Click the button to open modal
            button?.click();

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Check that modal was created
            const modalElements = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            expect(modalElements.length).toBeGreaterThan(0);

            // Verify both service calls were made (original ID and fallback)
            expect(mockAnimeService.getAnimeStatus).toHaveBeenCalledTimes(2);
        });

        it("should handle service errors gracefully", async () => {
            const animeData = {
                animeId: "error-test",
                animeTitle: "Error Test Anime",
                animeSlug: "error-test",
            };

            // Mock service to throw error
            mockAnimeService.getAnimeStatus.mockRejectedValue(new Error("Service error"));

            // Create and click button
            createSinglePageInfoButton(animeData);
            const button = document.getElementById("anime-list-info-button");

            // This should not throw despite service error
            expect(() => button?.click()).not.toThrow();

            // Wait for async error handling
            await new Promise((resolve) => setTimeout(resolve, 10));
        });
    });

    describe("Additional Coverage Tests", () => {
        it("should handle different URL patterns in extractSinglePageAnimeData", () => {
            const testCases = [
                {
                    url: "https://example.com/watch/anime-with-special-chars-@#$",
                    expectedId: "anime-with-special-chars-@#$",
                },
                {
                    url: "https://example.com/watch/simple",
                    expectedId: "simple",
                },
                {
                    url: "https://example.com/watch/multiple-123-numbers-456",
                    expectedId: "456",
                },
            ];

            testCases.forEach((testCase) => {
                (window as any).location.href = testCase.url;
                const result = extractSinglePageAnimeData();
                expect(result?.animeId).toBe(testCase.expectedId);
            });
        });

        it("should handle different DOM title scenarios", () => {
            // Test with different DOM structures for title extraction
            const testTitleCases = [
                {
                    name: "ani_detail-info h2",
                    setupDOM: () => {
                        const container = document.createElement("div");
                        container.className = "ani_detail-info";
                        const title = document.createElement("h2");
                        title.textContent = "Title from ani_detail";
                        container.appendChild(title);
                        document.body.appendChild(container);
                    },
                    expectedTitle: "Title from ani_detail",
                },
                {
                    name: "watch-detail title",
                    setupDOM: () => {
                        const container = document.createElement("div");
                        container.className = "watch-detail";
                        const title = document.createElement("div");
                        title.className = "title";
                        title.textContent = "Title from watch-detail";
                        container.appendChild(title);
                        document.body.appendChild(container);
                    },
                    expectedTitle: "Title from watch-detail",
                },
                {
                    name: "h1 with class",
                    setupDOM: () => {
                        const title = document.createElement("h1");
                        title.className = "anime-title";
                        title.textContent = "Title from h1.anime-title";
                        document.body.appendChild(title);
                    },
                    expectedTitle: "Title from h1.anime-title",
                },
                {
                    name: "generic h1",
                    setupDOM: () => {
                        const title = document.createElement("h1");
                        title.textContent = "Generic H1 title";
                        document.body.appendChild(title);
                    },
                    expectedTitle: "Generic H1 title",
                },
            ];

            (window as any).location.href = "https://example.com/watch/title-test-123";

            testTitleCases.forEach((testCase) => {
                // Clear previous elements
                document.body.innerHTML = "";

                // Set up the DOM for this test case
                testCase.setupDOM();

                const result = extractSinglePageAnimeData();
                expect(result?.animeTitle).toBe(testCase.expectedTitle);
            });
        });
    });

    describe("DOM Event Handling", () => {
        it("should handle episode input change events", async () => {
            const animeData = {
                animeId: "input-test",
                animeTitle: "Input Test Anime",
                animeSlug: "input-test-anime",
            };
            const mockStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: {
                    animeId: "input-test",
                    animeTitle: "Input Test Anime",
                    animeSlug: "input-test-anime",
                    episodeId: "ep-1",
                    currentEpisode: 1,
                    totalEpisodes: 12,
                    lastWatched: new Date().toISOString(),
                },
            };

            // Clear any existing modals
            const existingModals = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            existingModals.forEach((modal) => modal.remove());

            // Show modal
            showSinglePageModal(animeData, mockStatus);

            // Find the episode input
            const modalElement = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');
            const episodeInput = modalElement?.querySelector(".modal-episode-current") as HTMLInputElement;

            expect(episodeInput).toBeTruthy();

            // Mock the updateEpisodeProgress call
            mockAnimeService.updateEpisodeProgress.mockResolvedValue({ success: true });

            // Test valid input change
            if (episodeInput) {
                episodeInput.value = "3";
                const changeEvent = new Event("change");
                episodeInput.dispatchEvent(changeEvent);

                // Wait a bit for the async operation
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(mockAnimeService.updateEpisodeProgress).toHaveBeenCalledWith("input-test", 3);
            }
        });

        it("should handle invalid episode input values", async () => {
            const animeData = {
                animeId: "invalid-test",
                animeTitle: "Invalid Test Anime",
                animeSlug: "invalid-test-anime",
            };
            const mockStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: {
                    animeId: "invalid-test",
                    animeTitle: "Invalid Test Anime",
                    animeSlug: "invalid-test-anime",
                    episodeId: "ep-5",
                    currentEpisode: 5,
                    totalEpisodes: 12,
                    lastWatched: new Date().toISOString(),
                },
            };

            // Clear any existing modals
            const existingModals = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 10000"]');
            existingModals.forEach((modal) => modal.remove());

            // Show modal
            showSinglePageModal(animeData, mockStatus);

            // Find the episode input
            const modalElement = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');
            const episodeInput = modalElement?.querySelector(".modal-episode-current") as HTMLInputElement;

            expect(episodeInput).toBeTruthy();

            // Test invalid input (should reset to original value)
            if (episodeInput) {
                episodeInput.value = "invalid";
                const changeEvent = new Event("change");
                episodeInput.dispatchEvent(changeEvent);

                // Wait a bit for the reset
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(episodeInput.value).toBe("5"); // Should reset to original
            }
        });
    });

    describe("Modal UI Interactions", () => {
        it("should handle escape key to close modal", async () => {
            const animeData = {
                animeId: "escape-test",
                animeTitle: "Escape Test Anime",
                animeSlug: "escape-test-anime",
            };
            const mockStatus = {
                isTracked: false,
                isPlanned: false,
                isHidden: false,
                progress: undefined,
            };

            // Show modal
            showSinglePageModal(animeData, mockStatus);

            // Wait for modal to be fully initialized (including opacity set to "1")
            await new Promise((resolve) => setTimeout(resolve, 20));

            // Find the modal
            const modalElement = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');
            expect(modalElement).toBeTruthy();

            // Verify modal is initially visible
            expect((modalElement as HTMLElement).style.opacity).toBe("1");

            // Simulate escape key press
            const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(escapeEvent);

            // Wait for modal closing animation and verify
            await new Promise((resolve) => setTimeout(resolve, 20));

            if (modalElement) {
                expect((modalElement as HTMLElement).style.opacity).toBe("0");
            }
        });

        it("should handle modal backdrop click to close", async () => {
            const animeData = {
                animeId: "backdrop-test",
                animeTitle: "Backdrop Test Anime",
                animeSlug: "backdrop-test-anime",
            };
            const mockStatus = {
                isTracked: false,
                isPlanned: false,
                isHidden: false,
                progress: undefined,
            };

            // Show modal
            showSinglePageModal(animeData, mockStatus);

            // Wait for modal to be fully initialized
            await new Promise((resolve) => setTimeout(resolve, 20));

            // Find the modal
            const modalElement = document.querySelector('[style*="position: fixed"][style*="z-index: 10000"]');
            expect(modalElement).toBeTruthy();

            // Verify modal is initially visible
            expect((modalElement as HTMLElement).style.opacity).toBe("1");

            // Simulate clicking the backdrop (modal itself, not its content)
            if (modalElement) {
                const clickEvent = new MouseEvent("click", { bubbles: true });
                Object.defineProperty(clickEvent, "target", { value: modalElement });
                modalElement.dispatchEvent(clickEvent);

                // Wait for modal closing animation and verify
                await new Promise((resolve) => setTimeout(resolve, 20));
                expect((modalElement as HTMLElement).style.opacity).toBe("0");
            }
        });
    });
});
