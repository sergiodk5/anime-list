import { beforeEach, describe, expect, it, vi } from "vitest";

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
        clearAllHidden: vi.fn(), // Add missing method
    };

    return {
        AnimeService: vi.fn().mockImplementation(() => mockAnimeService),
        mockAnimeService, // Export for test usage
    };
});

import {
    createClearHiddenButton,
    createCombinedWatchingControls,
    createHideButton,
    createPlanButton,
    createRemovePlanButton,
    createStartWatchingButton,
    createStopWatchingButton,
    createWatchingControls,
} from "@/content";

// Get the mock from the mocked module
const mockAnimeServiceModule = await import("@/commons/services");
const mockAnimeService = (mockAnimeServiceModule as any).mockAnimeService;

describe("Content Script Button Creation Functions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";

        // Reset all mock implementations
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
        mockAnimeService.updateEpisodeProgress.mockResolvedValue({ success: true });
    });

    describe("Start Watching Button", () => {
        it("should create start watching button", () => {
            const animeData = {
                animeId: "test-anime",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };

            const button = createStartWatchingButton(animeData);
            expect(button).toBeTruthy();
            expect(button.tagName).toBe("BUTTON");
            expect(button.textContent).toContain("Start Watching");
            expect(button.getAttribute("data-testid")).toBe("anime-start-watching-button");
        });

        it("should handle start watching button click", async () => {
            const animeData = {
                animeId: "test-click",
                animeTitle: "Test Click",
                animeSlug: "test-click",
            };

            // Mock the anime status to allow start watching
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false, // Must be false to allow start watching
                isPlanned: false,
                isHidden: false, // Must be false to allow start watching
                progress: undefined,
            });
            mockAnimeService.startWatching.mockResolvedValue({ success: true });

            const button = createStartWatchingButton(animeData);

            // Click the button
            button.click();

            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockAnimeService.startWatching).toHaveBeenCalledWith(animeData, 1);
        });
    });

    describe("Watching Controls", () => {
        it("should create watching controls with episode input", () => {
            const animeData = {
                animeId: "watching-test",
                animeTitle: "Watching Test",
                animeSlug: "watching-test",
            };

            const controls = createWatchingControls(animeData, 5);
            expect(controls).toBeTruthy();
            expect(controls.tagName).toBe("DIV");

            const input = controls.querySelector('input[type="number"]') as HTMLInputElement;
            expect(input).toBeTruthy();
            expect(input.value).toBe("5");
        });

        it("should handle episode increment", async () => {
            const animeData = {
                animeId: "increment-test",
                animeTitle: "Increment Test",
                animeSlug: "increment-test",
            };

            const controls = createWatchingControls(animeData, 3);
            const incrementBtn = controls.querySelector('[data-testid="episode-increment"]') as HTMLButtonElement;
            const input = controls.querySelector('input[type="number"]') as HTMLInputElement;

            expect(incrementBtn).toBeTruthy();
            expect(input).toBeTruthy();

            // Click increment button
            incrementBtn.click();

            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(input.value).toBe("4");
            expect(mockAnimeService.updateEpisodeProgress).toHaveBeenCalledWith("increment-test", 4);
        });

        it("should handle episode decrement", async () => {
            const animeData = {
                animeId: "decrement-test",
                animeTitle: "Decrement Test",
                animeSlug: "decrement-test",
            };

            const controls = createWatchingControls(animeData, 5);
            const decrementBtn = controls.querySelector('[data-testid="episode-decrement"]') as HTMLButtonElement;
            const input = controls.querySelector('input[type="number"]') as HTMLInputElement;

            expect(decrementBtn).toBeTruthy();
            expect(input).toBeTruthy();

            // Click decrement button
            decrementBtn.click();

            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(input.value).toBe("4");
            expect(mockAnimeService.updateEpisodeProgress).toHaveBeenCalledWith("decrement-test", 4);
        });

        it("should handle direct episode input", async () => {
            const animeData = {
                animeId: "input-test",
                animeTitle: "Input Test",
                animeSlug: "input-test",
            };

            const controls = createWatchingControls(animeData, 5);
            const input = controls.querySelector('input[type="number"]') as HTMLInputElement;

            expect(input).toBeTruthy();

            // Change input value
            input.value = "8";
            const changeEvent = new Event("change");
            input.dispatchEvent(changeEvent);

            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockAnimeService.updateEpisodeProgress).toHaveBeenCalledWith("input-test", 8);
        });

        it("should handle minimum episode boundary", async () => {
            const animeData = {
                animeId: "min-test",
                animeTitle: "Min Test",
                animeSlug: "min-test",
            };

            const controls = createWatchingControls(animeData, 1);
            const decrementBtn = controls.querySelector('[data-testid="episode-decrement"]') as HTMLButtonElement;
            const input = controls.querySelector('input[type="number"]') as HTMLInputElement;

            // Try to decrement from 1 (should stay at 1)
            decrementBtn.click();

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(input.value).toBe("1");
            // Should not call service for invalid episode number
            expect(mockAnimeService.updateEpisodeProgress).not.toHaveBeenCalled();
        });
    });

    describe("Stop Watching Button", () => {
        it("should create stop watching button", () => {
            const animeData = {
                animeId: "stop-test",
                animeTitle: "Stop Test",
                animeSlug: "stop-test",
            };

            const button = createStopWatchingButton(animeData);
            expect(button).toBeTruthy();
            expect(button.tagName).toBe("BUTTON");
            expect(button.textContent).toContain("Stop");
            expect(button.getAttribute("data-testid")).toBe("anime-stop-watching-button");
        });

        it("should handle stop watching button click", async () => {
            const animeData = {
                animeId: "stop-click-test",
                animeTitle: "Stop Click Test",
                animeSlug: "stop-click-test",
            };

            // Mock the anime status to allow stopping
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: { currentEpisode: 5 },
            });
            mockAnimeService.stopWatching.mockResolvedValue({ success: true });

            const button = createStopWatchingButton(animeData);

            // Click the button
            button.click();

            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockAnimeService.stopWatching).toHaveBeenCalledWith("stop-click-test");
        });
    });

    describe("Combined Watching Controls", () => {
        it("should create combined controls with episode display", () => {
            const animeData = {
                animeId: "combined-test",
                animeTitle: "Combined Test",
                animeSlug: "combined-test",
            };

            const controls = createCombinedWatchingControls(animeData, 7);
            expect(controls).toBeTruthy();
            expect(controls.tagName).toBe("DIV");

            const episodeDisplay = controls.querySelector(".episode-display");
            expect(episodeDisplay).toBeTruthy();

            const episodeInput = controls.querySelector('input[type="number"]') as HTMLInputElement;
            expect(episodeInput).toBeTruthy();
            expect(episodeInput.value).toBe("7");
        });
    });

    describe("Plan Buttons", () => {
        it("should create remove plan button", () => {
            const animeData = {
                animeId: "remove-plan-test",
                animeTitle: "Remove Plan Test",
                animeSlug: "remove-plan-test",
            };

            const button = createRemovePlanButton(animeData);
            expect(button).toBeTruthy();
            expect(button.tagName).toBe("BUTTON");
            expect(button.textContent).toContain("Remove");
            expect(button.getAttribute("data-testid")).toBe("anime-remove-plan-button");
        });

        it("should handle remove plan button click", async () => {
            const animeData = {
                animeId: "remove-click-test",
                animeTitle: "Remove Click Test",
                animeSlug: "remove-click-test",
            };

            // Mock the anime status to allow removing from plan
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: true, // Must be true to allow removal
                isHidden: false,
                progress: undefined,
            });
            mockAnimeService.removeFromPlanToWatch.mockResolvedValue({ success: true });

            const button = createRemovePlanButton(animeData);

            // Click the button
            button.click();

            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockAnimeService.removeFromPlanToWatch).toHaveBeenCalledWith("remove-click-test");
        });

        it("should create plan button", () => {
            const animeData = {
                animeId: "plan-test",
                animeTitle: "Plan Test",
                animeSlug: "plan-test",
            };

            const button = createPlanButton(animeData);
            expect(button).toBeTruthy();
            expect(button.tagName).toBe("BUTTON");
            expect(button.textContent).toContain("Plan");
            expect(button.getAttribute("data-testid")).toBe("anime-plan-button");
        });

        it("should handle plan button click", async () => {
            const animeData = {
                animeId: "plan-click-test",
                animeTitle: "Plan Click Test",
                animeSlug: "plan-click-test",
            };

            // Mock the anime status to allow adding to plan
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false, // Must be false to allow adding
                isHidden: false,
                progress: undefined,
            });
            mockAnimeService.addToPlanToWatch.mockResolvedValue({ success: true });

            const button = createPlanButton(animeData);

            // Click the button
            button.click();

            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalledWith(animeData);
        });
    });

    describe("Hide Button", () => {
        it("should create hide button", () => {
            const animeData = {
                animeId: "hide-test",
                animeTitle: "Hide Test",
                animeSlug: "hide-test",
            };

            const button = createHideButton(animeData);
            expect(button).toBeTruthy();
            expect(button.tagName).toBe("BUTTON");
            expect(button.textContent).toContain("Hide");
            expect(button.getAttribute("data-testid")).toBe("anime-hide-button");
        });

        it("should handle hide button click", async () => {
            const animeData = {
                animeId: "hide-click-test",
                animeTitle: "Hide Click Test",
                animeSlug: "hide-click-test",
            };

            // Mock the anime status to allow hiding
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false, // Must be false to allow hiding
                isPlanned: false, // Must be false to allow hiding
                isHidden: false,
                progress: undefined,
            });
            mockAnimeService.hideAnime.mockResolvedValue({ success: true });

            const button = createHideButton(animeData);

            // Click the button
            button.click();

            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockAnimeService.hideAnime).toHaveBeenCalledWith("hide-click-test");
        });
    });

    describe("Clear Hidden Button", () => {
        it("should create clear hidden button", () => {
            const button = createClearHiddenButton();
            expect(button).toBeTruthy();
            expect(button.tagName).toBe("BUTTON");
            expect(button.textContent).toContain("Clear Hidden");
            expect(button.getAttribute("data-testid")).toBe("anime-clear-hidden-button");
        });

        it("should handle clear hidden button click", async () => {
            // Mock clearAllHidden to return a proper response
            mockAnimeService.clearAllHidden.mockResolvedValue({
                success: true,
                message: "Restored 2 hidden anime",
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                },
            });

            const button = createClearHiddenButton();

            // Click the button and wait for async operation
            button.click();
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Verify the service was called
            expect(mockAnimeService.clearAllHidden).toHaveBeenCalled();
        });
    });

    describe("Error Handling", () => {
        it("should handle service errors in buttons", async () => {
            const animeData = {
                animeId: "error-test",
                animeTitle: "Error Test",
                animeSlug: "error-test",
            };

            // Mock service to throw error
            mockAnimeService.addToPlanToWatch.mockRejectedValue(new Error("Service error"));

            const button = createPlanButton(animeData);

            // Click should not throw
            expect(() => button.click()).not.toThrow();

            // Wait for error handling
            await new Promise((resolve) => setTimeout(resolve, 10));
        });

        it("should handle invalid episode numbers", async () => {
            const animeData = {
                animeId: "invalid-episode-test",
                animeTitle: "Invalid Episode Test",
                animeSlug: "invalid-episode-test",
            };

            const controls = createWatchingControls(animeData, 5);
            const input = controls.querySelector('input[type="number"]') as HTMLInputElement;

            // Set invalid value
            input.value = "0";
            const changeEvent = new Event("change");
            input.dispatchEvent(changeEvent);

            await new Promise((resolve) => setTimeout(resolve, 10));

            // Should not call service for invalid episode number
            expect(mockAnimeService.updateEpisodeProgress).not.toHaveBeenCalled();
        });
    });
});
