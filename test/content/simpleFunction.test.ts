/**
 * Simple test for addClearHiddenButton function
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { addClearHiddenButton } from "../../src/content/index";

// Mock Chrome APIs
const mockChrome = {
    storage: {
        local: {
            get: vi.fn(),
            set: vi.fn(),
        },
    },
};

(globalThis as any).chrome = mockChrome;

// Mock AnimeService
vi.mock("@/commons/services/AnimeService", () => ({
    AnimeService: vi.fn().mockImplementation(() => ({
        getAnimeStatus: vi.fn(),
        addToPlanToWatch: vi.fn(),
        removeFromPlanToWatch: vi.fn(),
        startWatching: vi.fn(),
        stopWatching: vi.fn(),
        updateEpisodeProgress: vi.fn(),
        hideAnime: vi.fn(),
        unhideAnime: vi.fn(),
    })),
}));

describe("addClearHiddenButton", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset DOM
        document.body.innerHTML = "";
    });

    it("should handle when target element exists", () => {
        // Create a target element that the function looks for
        const targetElement = document.createElement("div");
        targetElement.className = "anime-list-pagination";
        document.body.appendChild(targetElement);

        const querySelectorSpy = vi.spyOn(document, "querySelector").mockReturnValue(targetElement);

        // Call the function
        addClearHiddenButton();

        // Verify it was called
        expect(querySelectorSpy).toHaveBeenCalled();

        querySelectorSpy.mockRestore();
    });

    it("should handle when target element does not exist", () => {
        const querySelectorSpy = vi.spyOn(document, "querySelector").mockReturnValue(null);

        // Should not throw when target doesn't exist
        expect(() => addClearHiddenButton()).not.toThrow();

        expect(querySelectorSpy).toHaveBeenCalled();

        querySelectorSpy.mockRestore();
    });
});
