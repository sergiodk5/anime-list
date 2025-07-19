import { extractAnimeData, extractSinglePageAnimeData, isWatchPage } from "@/content";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Set up a global location mock
Object.defineProperty(window, "location", {
    value: {
        pathname: "/",
        href: "https://example.com/",
    },
    writable: true,
});

describe("Content Script Data Extraction Functions", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.clearAllMocks();
    });

    describe("extractAnimeData", () => {
        it("should extract anime data from valid element", () => {
            // Create a mock anime element with correct selector structure
            const element = document.createElement("div");
            element.innerHTML = `
                <div class="film-name">
                    <a href="/watch/naruto-123" title="Naruto">
                        Naruto
                    </a>
                </div>
            `;

            const animeData = extractAnimeData(element);
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("naruto-123");
            expect(animeData?.animeTitle).toBe("Naruto");
        });

        it("should return null for element without anime link", () => {
            const element = document.createElement("div");
            element.innerHTML = `<p>No anime here</p>`;

            const animeData = extractAnimeData(element);
            expect(animeData).toBeNull();
        });

        it("should handle element with invalid href", () => {
            const element = document.createElement("div");
            element.innerHTML = `
                <div class="film-name">
                    <a href="#">Not anime</a>
                </div>
            `;

            const animeData = extractAnimeData(element);
            expect(animeData).toBeNull();
        });

        it("should extract data from link with title attribute", () => {
            const element = document.createElement("div");
            element.innerHTML = `
                <div class="film-name">
                    <a href="/watch/attack-on-titan-456" title="Attack on Titan">
                        AOT
                    </a>
                </div>
            `;

            const animeData = extractAnimeData(element);
            expect(animeData).toBeTruthy();
            expect(animeData?.animeTitle).toBe("Attack on Titan");
            expect(animeData?.animeSlug).toBe("attack-on-titan-456");
        });

        it("should handle nested link structure", () => {
            const element = document.createElement("div");
            element.innerHTML = `
                <div class="anime-card">
                    <div class="image-container">
                        <img src="/image/op.jpg" alt="One Piece">
                    </div>
                    <div class="film-name">
                        <a href="/watch/one-piece-789">One Piece</a>
                    </div>
                </div>
            `;

            const animeData = extractAnimeData(element);
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("one-piece-789");
        });

        it("should handle multiple anime links in element", () => {
            const element = document.createElement("div");
            element.innerHTML = `
                <div class="film-name">
                    <a href="/watch/first-anime-1">First</a>
                </div>
                <div class="film-name">
                    <a href="/watch/second-anime-2">Second</a>
                </div>
            `;

            const animeData = extractAnimeData(element);
            expect(animeData).toBeTruthy();
            // Should extract the first valid anime link
            expect(animeData?.animeSlug).toBe("first-anime-1");
        });
    });

    describe("isWatchPage", () => {
        it("should return true for watch page URL", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/naruto-episode-1",
                    href: "https://example.com/watch/naruto-episode-1",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(true);
        });

        it("should return false for non-watch page URL", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/anime/naruto",
                    href: "https://example.com/anime/naruto",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(false);
        });

        it("should return false for root page", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/",
                    href: "https://example.com/",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(false);
        });

        it("should return false for watch-like but invalid URL", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watched/something",
                    href: "https://example.com/watched/something",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(false);
        });

        it("should handle URLs with query parameters", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/anime-episode",
                    href: "https://example.com/watch/anime-episode?t=123",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(true);
        });
    });

    describe("extractSinglePageAnimeData", () => {
        beforeEach(() => {
            // Set up as watch page
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/test-anime-episode-1",
                    href: "https://example.com/watch/test-anime-episode-1",
                },
                writable: true,
            });
        });

        it("should extract anime data from watch page URL", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/naruto-shippuden-episode-100",
                    href: "https://example.com/watch/naruto-shippuden-episode-100",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toContain("naruto-shippuden");
        });

        it("should return null for non-watch page", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/anime/some-anime",
                    href: "https://example.com/anime/some-anime",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeNull();
        });

        it("should handle watch page without episode info", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/simple-anime",
                    href: "https://example.com/watch/simple-anime",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("simple-anime");
        });

        it("should extract title from page title element", () => {
            // Create page title element (h1 is in the selector list)
            const h1Element = document.createElement("h1");
            h1Element.textContent = "Attack on Titan Episode 1 - Watch Online";
            document.body.appendChild(h1Element);

            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/attack-on-titan-episode-1",
                    href: "https://example.com/watch/attack-on-titan-episode-1",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeTitle).toContain("Attack on Titan");
        });

        it("should extract title from h1 element", () => {
            const h1Element = document.createElement("h1");
            h1Element.textContent = "One Piece Episode 1000";
            document.body.appendChild(h1Element);

            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/one-piece-episode-1000",
                    href: "https://example.com/watch/one-piece-episode-1000",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeTitle).toContain("One Piece");
        });

        it("should handle page without clear title", () => {
            // No title elements
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/mystery-anime-episode-5",
                    href: "https://example.com/watch/mystery-anime-episode-5",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("mystery-anime-episode-5");
        });

        it("should generate animeId from slug", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/demon-slayer-episode-1",
                    href: "https://example.com/watch/demon-slayer-episode-1",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeId).toBe("1"); // Should extract the numeric suffix
            expect(animeData?.animeSlug).toBe("demon-slayer-episode-1");
        });

        it("should handle complex URL patterns", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/jujutsu-kaisen-season-2-episode-15",
                    href: "https://example.com/watch/jujutsu-kaisen-season-2-episode-15",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("jujutsu-kaisen-season-2-episode-15");
            expect(animeData?.animeId).toBeTruthy();
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle null or undefined element in extractAnimeData", () => {
            expect(() => extractAnimeData(document.createElement("div"))).not.toThrow();
        });

        it("should handle empty pathname in isWatchPage", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "",
                    href: "https://example.com/",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(false);
        });

        it("should handle malformed URLs", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "///watch///",
                    href: "https://example.com///watch///",
                },
                writable: true,
            });

            // Should not throw
            expect(() => isWatchPage()).not.toThrow();
            expect(() => extractSinglePageAnimeData()).not.toThrow();
        });

        it("should handle special characters in anime titles", () => {
            const h1Element = document.createElement("h1");
            h1Element.textContent = "Anime with Special Characters: éàü Episode 1";
            document.body.appendChild(h1Element);

            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/anime-special-chars-episode-1",
                    href: "https://example.com/watch/anime-special-chars-episode-1",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeTitle).toContain("éàü");
        });
    });
});
