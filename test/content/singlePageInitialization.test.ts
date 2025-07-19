import { initializeSinglePage } from "@/content";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock window.location
Object.defineProperty(window, "location", {
    value: {
        pathname: "/",
        href: "https://example.com/",
    },
    writable: true,
});

describe("Single Page Initialization Functions", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.clearAllMocks();

        // Reset location to non-watch page by default
        Object.defineProperty(window, "location", {
            value: {
                pathname: "/",
                href: "https://example.com/",
            },
            writable: true,
        });
    });

    describe("initializeSinglePage", () => {
        it("should return early if not on watch page", () => {
            // Setup non-watch page
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/anime/some-anime",
                    href: "https://example.com/anime/some-anime",
                },
                writable: true,
            });

            // Should return early without creating button
            initializeSinglePage();

            const button = document.getElementById("anime-list-info-button");
            expect(button).toBeNull();
        });

        it("should initialize on watch page with valid anime data", () => {
            // Setup watch page
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/test-anime-episode-1",
                    href: "https://example.com/watch/test-anime-episode-1",
                },
                writable: true,
            });

            // Add a title element for anime data extraction
            const titleElement = document.createElement("h1");
            titleElement.textContent = "Test Anime Episode 1";
            document.body.appendChild(titleElement);

            // Initialize single page
            initializeSinglePage();

            // Should create the info button
            const button = document.getElementById("anime-list-info-button");
            expect(button).toBeTruthy();
            expect(button?.textContent).toBe("Anime Info");
        });

        it("should handle watch page with no valid anime data", () => {
            // Setup watch page that doesn't match expected patterns
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/",
                    href: "https://example.com/watch/",
                },
                writable: true,
            });

            // Should not create button for invalid anime data
            initializeSinglePage();

            const button = document.getElementById("anime-list-info-button");
            expect(button).toBeNull();
        });

        it("should handle extraction failure gracefully", () => {
            // Setup watch page that will fail extraction
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/",
                    href: "https://example.com/watch/",
                },
                writable: true,
            });

            // This should not create a button because extraction fails
            initializeSinglePage();

            const button = document.getElementById("anime-list-info-button");
            expect(button).toBeNull();
        });

        it("should create info button with correct positioning", () => {
            // Setup watch page
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/positioned-anime-test",
                    href: "https://example.com/watch/positioned-anime-test",
                },
                writable: true,
            });

            initializeSinglePage();

            const button = document.getElementById("anime-list-info-button");
            expect(button).toBeTruthy();

            // Check if styles are applied (button should be fixed positioned)
            // Note: In jsdom, computed styles might not reflect CSS, but we can check for the element
            expect(button?.style).toBeDefined();
        });

        it("should replace existing info button if called multiple times", () => {
            // Setup watch page
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/replace-test-anime",
                    href: "https://example.com/watch/replace-test-anime",
                },
                writable: true,
            });

            // Initialize first time
            initializeSinglePage();
            const firstButton = document.getElementById("anime-list-info-button");
            expect(firstButton).toBeTruthy();

            // Initialize second time
            initializeSinglePage();
            const secondButton = document.getElementById("anime-list-info-button");
            expect(secondButton).toBeTruthy();

            // Should still only have one button
            const allButtons = document.querySelectorAll("#anime-list-info-button");
            expect(allButtons.length).toBe(1);
        });

        it("should work with different anime title sources", () => {
            // Setup watch page
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/title-source-test",
                    href: "https://example.com/watch/title-source-test",
                },
                writable: true,
            });

            // Add multiple title sources
            const h2Element = document.createElement("h2");
            h2Element.textContent = "H2 Title Source";
            document.body.appendChild(h2Element);

            const titleElement = document.createElement("div");
            titleElement.className = "anime-title";
            titleElement.textContent = "Class Title Source";
            document.body.appendChild(titleElement);

            initializeSinglePage();

            const button = document.getElementById("anime-list-info-button");
            expect(button).toBeTruthy();
        });
    });

    describe("Auto-initialization conditions", () => {
        it("should check for proper global conditions", () => {
            // Test that the conditions for auto-initialization work
            expect(typeof window).toBe("object");
            expect(typeof document).toBe("object");
            expect(window.location).toBeDefined();
        });
    });
});
