import { JSDOM } from "jsdom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the AnimeService
const mockAnimeService = {
    getAnimeStatus: vi.fn(),
    startWatching: vi.fn(),
    stopWatching: vi.fn(),
    updateEpisodeProgress: vi.fn(),
};

vi.doMock("@/commons/services", () => ({
    AnimeService: vi.fn(() => mockAnimeService),
}));

describe("Combined Watching Controls", () => {
    beforeEach(() => {
        // Mock DOM
        const dom = new JSDOM(
            `
            <!DOCTYPE html>
            <html>
            <head><title>Test</title></head>
            <body>
                <div class="flw-item">
                    <div class="film-detail">
                        <h3 class="film-name">
                            <a href="/watch/test-anime-123" class="dynamic-name" title="Test Anime">Test Anime</a>
                        </h3>
                    </div>
                </div>
            </body>
            </html>
        `,
            { url: "https://aniwave.to" },
        );

        // Setup globals
        global.document = dom.window.document;
        global.window = dom.window as any;
        global.HTMLElement = dom.window.HTMLElement;
        global.Element = dom.window.Element;

        // Reset mocks
        vi.clearAllMocks();
    });

    it("should create combined watching controls with episode display and hidden stop button", async () => {
        const { createCombinedWatchingControls } = await import("@/content/index");

        const animeData = {
            animeId: "test-anime-123",
            animeTitle: "Test Anime",
            animeSlug: "test-anime-123",
        };

        const controls = createCombinedWatchingControls(animeData, 12);

        // Should have the correct container class and test id
        expect(controls.className).toBe("anime-list-combined-watching-controls");
        expect(controls.getAttribute("data-testid")).toBe("anime-combined-watching-controls");
        expect(controls.getAttribute("data-anime-id")).toBe("test-anime-123");

        // Should have episode display elements
        const episodeDisplay = controls.querySelector(".episode-display");
        const episodeLabel = controls.querySelector(".episode-label");
        const decrementBtn = controls.querySelector(".episode-decrement");
        const incrementBtn = controls.querySelector(".episode-increment");
        const episodeInput = controls.querySelector(".episode-current");

        expect(episodeDisplay).toBeTruthy();
        expect(episodeLabel?.textContent).toBe("Ep:");
        expect(decrementBtn?.textContent).toBe("−");
        expect(incrementBtn?.textContent).toBe("+");
        expect((episodeInput as HTMLInputElement)?.value).toBe("12");

        // Should have stop button
        const stopBtn = controls.querySelector(".stop-watching-btn");
        expect(stopBtn).toBeTruthy();
        expect(stopBtn?.getAttribute("data-testid")).toBe("combined-stop-watching-button");
    });

    it("should handle episode increment correctly", async () => {
        const { createCombinedWatchingControls } = await import("@/content/index");

        const animeData = {
            animeId: "test-anime-123",
            animeTitle: "Test Anime",
            animeSlug: "test-anime-123",
        };

        mockAnimeService.updateEpisodeProgress.mockResolvedValue({
            success: true,
            message: "Episode updated successfully",
        });
        mockAnimeService.getAnimeStatus.mockResolvedValue({
            isTracked: true,
            progress: { currentEpisode: 13 },
        });

        const controls = createCombinedWatchingControls(animeData, 12);
        document.body.appendChild(controls);

        const incrementBtn = controls.querySelector(".episode-increment") as HTMLButtonElement;

        // Simulate click
        incrementBtn.click();

        // Wait for async operations
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockAnimeService.updateEpisodeProgress).toHaveBeenCalledWith("test-anime-123", 13);
    });
});
