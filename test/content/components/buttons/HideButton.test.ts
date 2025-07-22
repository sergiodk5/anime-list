import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Mock dependencies
vi.mock("@/content/services/BusinessRules");

// Import what we need
import type { AnimeData, AnimeStatus } from "@/commons/models";
import type { AnimeService } from "@/commons/services";
import { HideButton } from "@/content/components/buttons/HideButton";
import type { ToastSystem } from "@/content/components/ui/ToastSystem";
import { BusinessRules } from "@/content/services/BusinessRules";
import { SELECTORS } from "@/content/types/ContentTypes";
import { JSDOM } from "jsdom";

const animeData: AnimeData = {
    animeId: "123",
    animeTitle: "Test Anime",
    animeSlug: "test-anime",
};

describe("HideButton", () => {
    let hideButton: HideButton;
    let animeServiceMock: {
        getAnimeStatus: Mock;
        hideAnime: Mock;
        clearAllHidden: Mock;
    };
    let toastSystemMock: {
        showToast: Mock;
    };

    beforeEach(() => {
        const dom = new JSDOM(
            `
            <div class="${SELECTORS.ITEM.slice(1)}">
                <div class="film-name">
                    <a href="#">${animeData.animeTitle}</a>
                </div>
            </div>
        `,
            { url: "http://localhost" },
        );
        global.document = dom.window.document;
        vi.useFakeTimers();
        vi.clearAllMocks();

        animeServiceMock = {
            getAnimeStatus: vi.fn(),
            hideAnime: vi.fn(),
            clearAllHidden: vi.fn(),
        };

        toastSystemMock = {
            showToast: vi.fn(),
        };

        // Reset the singleton instance before each test
        HideButton._resetInstanceForTesting();
        // Get instance with mocked dependencies
        hideButton = HideButton.getInstance(
            animeServiceMock as unknown as AnimeService,
            toastSystemMock as unknown as ToastSystem,
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("create", () => {
        it("should create a hide button with correct attributes", () => {
            const button = hideButton.create(animeData);
            expect(button.tagName).toBe("BUTTON");
            expect(button.className).toBe("anime-list-hide-btn");
            expect(button.getAttribute("data-testid")).toBe("anime-hide-button");
            expect(button.getAttribute("data-anime-id")).toBe(animeData.animeId);
            expect(button.getAttribute("title")).toBe(`Hide "${animeData.animeTitle}" from listings`);
            expect(button.querySelector(".button-text")?.textContent).toBe("Hide");
        });

        it("should attach a click event listener that triggers the handler", async () => {
            const handleClickSpy = vi.spyOn(hideButton, "handleClick").mockResolvedValue();
            const button = hideButton.create(animeData);

            await button.click();

            expect(handleClickSpy).toHaveBeenCalledWith(button, animeData.animeId);
        });
    });

    describe("handleClick", () => {
        it("should hide anime if business rules allow", async () => {
            vi.spyOn(BusinessRules, "canHide").mockReturnValue(true);
            animeServiceMock.getAnimeStatus.mockResolvedValue({} as AnimeStatus);
            animeServiceMock.hideAnime.mockResolvedValue({ success: true, message: "Hidden" });

            const button = hideButton.create(animeData);
            const animeItem = document.querySelector(SELECTORS.ITEM)!;
            animeItem.appendChild(button);

            // Call handleClick directly instead of simulating button click
            await hideButton.handleClick(button, animeData.animeId);

            expect(animeServiceMock.hideAnime).toHaveBeenCalledWith(animeData.animeId);
            expect(toastSystemMock.showToast).toHaveBeenCalledWith(`Hidden "${animeData.animeTitle}"`, "success");

            expect(animeItem.classList.contains("anime-hidden")).toBe(true);

            vi.runAllTimers();
            expect((animeItem as HTMLElement).style.display).toBe("none");
        });

        it("should show error toast if business rules disallow", async () => {
            const blockedMessage = "Cannot hide this anime.";
            vi.spyOn(BusinessRules, "canHide").mockReturnValue(false);
            vi.spyOn(BusinessRules, "getBlockedActionMessage").mockReturnValue(blockedMessage);
            animeServiceMock.getAnimeStatus.mockResolvedValue({} as AnimeStatus);

            const button = hideButton.create(animeData);
            // Call handleClick directly instead of simulating button click
            await hideButton.handleClick(button, animeData.animeId);

            expect(animeServiceMock.hideAnime).not.toHaveBeenCalled();
            expect(toastSystemMock.showToast).toHaveBeenCalledWith(blockedMessage, "error");
        });

        it("should show error toast if hiding fails", async () => {
            vi.spyOn(BusinessRules, "canHide").mockReturnValue(true);
            animeServiceMock.getAnimeStatus.mockResolvedValue({} as AnimeStatus);
            animeServiceMock.hideAnime.mockResolvedValue({ success: false, message: "API Error" });

            const button = hideButton.create(animeData);
            // Call handleClick directly instead of simulating button click
            await hideButton.handleClick(button, animeData.animeId);

            expect(toastSystemMock.showToast).toHaveBeenCalledWith("API Error", "error");
        });

        it("should handle exceptions gracefully", async () => {
            const error = new Error("Something went wrong");
            animeServiceMock.getAnimeStatus.mockRejectedValue(error);

            const button = hideButton.create(animeData);
            // Call handleClick directly instead of simulating button click
            await hideButton.handleClick(button, animeData.animeId);

            expect(toastSystemMock.showToast).toHaveBeenCalledWith("Error occurred", "error");
        });
    });

    describe("createClearHiddenButton", () => {
        it("should create a clear hidden button with correct attributes", () => {
            const button = hideButton.createClearHiddenButton();
            expect(button.tagName).toBe("BUTTON");
            expect(button.className).toBe("anime-list-clear-hidden-btn");
            expect(button.getAttribute("data-testid")).toBe("anime-clear-hidden-button");
            expect(button.getAttribute("title")).toBe("Show all previously hidden anime");
            expect(button.querySelector(".button-text")?.textContent).toBe("Clear Hidden");
        });
    });

    describe("handleClearHiddenClick", () => {
        it("should clear all hidden anime and show success toast", async () => {
            const hiddenItem = document.createElement("div");
            hiddenItem.className = "anime-hidden";
            (hiddenItem as HTMLElement).style.display = "none";
            document.body.appendChild(hiddenItem);

            animeServiceMock.clearAllHidden.mockResolvedValue({
                success: true,
                message: "Cleared successfully",
            });

            // Call handleClearHiddenClick directly instead of simulating button click
            await hideButton.handleClearHiddenClick();

            expect(animeServiceMock.clearAllHidden).toHaveBeenCalled();
            expect(hiddenItem.classList.contains("anime-hidden")).toBe(false);
            expect((hiddenItem as HTMLElement).style.display).toBe("");
            expect(toastSystemMock.showToast).toHaveBeenCalledWith("Cleared successfully", "success");
        });

        it("should show error toast if clearing fails", async () => {
            animeServiceMock.clearAllHidden.mockResolvedValue({
                success: false,
                message: "Failed to clear",
            });

            // Call handleClearHiddenClick directly instead of simulating button click
            await hideButton.handleClearHiddenClick();

            expect(toastSystemMock.showToast).toHaveBeenCalledWith("Failed to clear", "error");
        });

        it("should handle exceptions gracefully", async () => {
            const error = new Error("Clear failed");
            animeServiceMock.clearAllHidden.mockRejectedValue(error);

            // Call handleClearHiddenClick directly instead of simulating button click
            await hideButton.handleClearHiddenClick();

            expect(toastSystemMock.showToast).toHaveBeenCalledWith("Failed to clear hidden anime", "error");
        });
    });
});
