import { InfoButton } from "@/content/components/buttons/InfoButton";
import type { AnimeData } from "@/content/types/ContentTypes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("InfoButton", () => {
    let animeData: AnimeData;

    beforeEach(() => {
        document.body.innerHTML = "";
        animeData = {
            animeId: "1",
            animeTitle: "Test Anime",
            animeSlug: "test-anime",
        };
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(window, "dispatchEvent");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("create", () => {
        it("should create an info button with correct attributes", () => {
            const button = InfoButton.create(animeData);
            expect(button.tagName).toBe("BUTTON");
            expect(button.className).toBe("anime-list-info-btn");
            expect(button.getAttribute("data-anime-id")).toBe("1");
            expect(button.textContent).toContain("Anime Info");
        });

        it("should handle info click", () => {
            const button = InfoButton.create(animeData);
            button.click();
            expect(console.log).toHaveBeenCalledWith("Anime Info:", expect.any(String));
            expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
        });
    });

    describe("createQuickStats", () => {
        it("should create quick stats with episode number", () => {
            const stats = InfoButton.createQuickStats(animeData, 5);
            expect(stats.textContent).toContain("Ep: 5");
        });

        it("should create quick stats without episode number", () => {
            const stats = InfoButton.createQuickStats(animeData);
            expect(stats.textContent?.trim()).toBe("");
        });
    });

    describe("createExternalLinks", () => {
        it("should create a container with external links", () => {
            const linksContainer = InfoButton.createExternalLinks(animeData);
            const links = linksContainer.querySelectorAll("a");
            expect(links.length).toBe(3);
            expect(links[0].href).toContain("myanimelist.net");
            expect(links[1].href).toContain("anilist.co");
            expect(links[2].href).toContain("kitsu.io");
        });
    });

    describe("createTooltip", () => {
        it("should create a tooltip with all anime data", () => {
            const tooltip = InfoButton.createTooltip(animeData, 5);
            const content = tooltip.textContent;
            expect(content).toContain("Test Anime");
            expect(content).toContain("ID: 1");
            expect(content).toContain("Slug: test-anime");
            expect(content).toContain("Episode: 5");
        });

        it("should create a tooltip without episode data", () => {
            const tooltip = InfoButton.createTooltip(animeData);
            const content = tooltip.textContent;
            expect(content).not.toContain("Episode:");
        });
    });

    describe("createHoverCard", () => {
        it("should create a hover card", () => {
            const card = InfoButton.createHoverCard(animeData, 5);
            expect(card.className).toBe("anime-list-hover-card");
            expect(card.style.display).toBe("none");
            expect(card.textContent).toContain("Test Anime");
        });
    });

    describe("attachHoverInfo", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should show and hide hover card on mouse events", () => {
            const trigger = document.createElement("div");
            document.body.appendChild(trigger);
            InfoButton.attachHoverInfo(trigger, animeData);

            const card = document.querySelector(".anime-list-hover-card") as HTMLElement;
            expect(card).not.toBeNull();

            // Show card
            trigger.dispatchEvent(new MouseEvent("mouseenter"));
            expect(card.style.display).toBe("block");

            // Hide card
            trigger.dispatchEvent(new MouseEvent("mouseleave"));
            vi.runAllTimers();
            expect(card.style.display).toBe("none");
        });

        it("should keep card open when moving from trigger to card", () => {
            const trigger = document.createElement("div");
            document.body.appendChild(trigger);
            InfoButton.attachHoverInfo(trigger, animeData);

            const card = document.querySelector(".anime-list-hover-card") as HTMLElement;

            // Show card
            trigger.dispatchEvent(new MouseEvent("mouseenter"));
            expect(card.style.display).toBe("block");

            // Move to card
            trigger.dispatchEvent(new MouseEvent("mouseleave"));
            card.dispatchEvent(new MouseEvent("mouseenter"));
            vi.runAllTimers();
            expect(card.style.display).toBe("block");

            // Leave card
            card.dispatchEvent(new MouseEvent("mouseleave"));
            vi.runAllTimers();
            expect(card.style.display).toBe("none");
        });
    });
});
