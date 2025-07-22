import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimeExtractor } from "../../../src/content/services/AnimeExtractor";

// Helper to set up JSDOM for each test, ensuring a clean environment
const setupDOM = (html = "", url = "http://localhost") => {
    const dom = new JSDOM(html, { url });
    global.window = dom.window as unknown as Window & typeof globalThis;
    global.document = dom.window.document;
};

describe("AnimeExtractor", () => {
    beforeEach(() => {
        // Clear cache before each test
        AnimeExtractor.clearCache();
    });

    afterEach(() => {
        // Restore any mocks after each test
        vi.restoreAllMocks();
    });

    describe("extractFromListItem", () => {
        beforeEach(() => {
            setupDOM(); // Basic DOM for list item tests
        });

        it("should extract anime data correctly from a list item", () => {
            const element = document.createElement("div");
            element.innerHTML = `<div class="film-name"><a href="/watch/one-piece-1071" title="One Piece">One Piece</a></div>`;
            const animeData = AnimeExtractor.extractFromListItem(element);
            expect(animeData).toEqual({
                animeId: "1071",
                animeTitle: "One Piece",
                animeSlug: "one-piece-1071",
            });
        });

        it("should use full slug as ID if no numeric part is found", () => {
            const element = document.createElement("div");
            element.innerHTML = `<div class="film-name"><a href="/watch/special-anime" title="Special Anime">Special Anime</a></div>`;
            const animeData = AnimeExtractor.extractFromListItem(element);
            expect(animeData).toEqual({
                animeId: "special-anime",
                animeTitle: "Special Anime",
                animeSlug: "special-anime",
            });
        });

        it("should return null if title link is not found", () => {
            const element = document.createElement("div");
            element.innerHTML = `<span>Some other content</span>`;
            const animeData = AnimeExtractor.extractFromListItem(element);
            expect(animeData).toBeNull();
        });

        it("should return null if href is missing", () => {
            const element = document.createElement("div");
            element.innerHTML = `<div class="film-name"><a title="One Piece">One Piece</a></div>`;
            const animeData = AnimeExtractor.extractFromListItem(element);
            expect(animeData).toBeNull();
        });

        it("should handle errors gracefully", () => {
            const element = document.createElement("div");
            // Mock querySelector to throw an error
            vi.spyOn(element, "querySelector").mockImplementation(() => {
                throw new Error("DOM error");
            });
            const animeData = AnimeExtractor.extractFromListItem(element);
            expect(animeData).toBeNull();
        });

        it("should cache extracted data", () => {
            const element = document.createElement("div");
            element.innerHTML = `<div class="film-name"><a href="/watch/naruto-220" title="Naruto">Naruto</a></div>`;
            const animeData = AnimeExtractor.extractFromListItem(element);
            expect(animeData).not.toBeNull();
            if (animeData) {
                const cachedData = AnimeExtractor.getCachedAnimeData(animeData.animeId);
                expect(cachedData).toEqual(animeData);
            }
        });
    });

    describe("extractFromSinglePage", () => {
        it("should extract anime data from URL with numeric ID", () => {
            setupDOM("<h1>My Hero Academia</h1>", "https://example.com/watch/my-hero-academia-12345");
            const animeData = AnimeExtractor.extractFromSinglePage();
            expect(animeData).toEqual(
                expect.objectContaining({
                    animeId: "12345",
                    animeTitle: "My Hero Academia",
                    animeSlug: "my-hero-academia-12345",
                }),
            );
        });

        it("should extract anime data from URL with full slug as ID", () => {
            setupDOM("<h2>Attack on Titan</h2>", "https://example.com/watch/attack-on-titan");
            const animeData = AnimeExtractor.extractFromSinglePage();
            expect(animeData).toEqual(
                expect.objectContaining({
                    animeId: "attack-on-titan",
                    animeTitle: "Attack on Titan",
                    animeSlug: "attack-on-titan",
                }),
            );
        });

        it("should return null if URL does not match watch page pattern", () => {
            setupDOM("", "https://example.com/browse");
            const animeData = AnimeExtractor.extractFromSinglePage();
            expect(animeData).toBeNull();
        });

        it("should find title from various selectors", () => {
            const testCases = [
                { html: `<div class="ani_detail-info"><h2>Jujutsu Kaisen</h2></div>` },
                { html: `<div class="watch-detail"><span class="title">Jujutsu Kaisen</span></div>` },
                { html: `<h1 class="anime-title">Jujutsu Kaisen</h1>` },
                { html: `<h1>Jujutsu Kaisen</h1>` },
                { html: `<h2>Jujutsu Kaisen</h2>` },
                { html: `<div class="some-title-class">Jujutsu Kaisen</div>` },
                { html: `<div class="film-name">Jujutsu Kaisen</div>` },
                { html: `<div class="anime-title">Jujutsu Kaisen</div>` },
            ];

            for (const { html } of testCases) {
                setupDOM(html, "https://example.com/watch/jujutsu-kaisen-555");
                const animeData = AnimeExtractor.extractFromSinglePage();
                expect(animeData?.animeTitle).toBe("Jujutsu Kaisen");
            }
        });

        it("should use slug as fallback title if no title element is found", () => {
            setupDOM("<div></div>", "https://example.com/watch/no-title-found-404");
            const animeData = AnimeExtractor.extractFromSinglePage();
            expect(animeData?.animeTitle).toBe("no-title-found-404");
        });

        it("should handle errors gracefully", () => {
            setupDOM("", "https://example.com/watch/error-page");
            // To test error handling, we can mock the global URL constructor
            // to throw an error, simulating a parsing failure.
            const originalURL = global.URL;
            global.URL = vi.fn().mockImplementation(() => {
                throw new Error("URL parsing error");
            }) as any;

            const animeData = AnimeExtractor.extractFromSinglePage();
            expect(animeData).toBeNull();

            // Restore the original URL constructor to avoid side effects
            global.URL = originalURL;
        });
    });

    describe("Cache", () => {
        it("should clear the cache", () => {
            setupDOM();
            const element = document.createElement("div");
            element.innerHTML = `<div class="film-name"><a href="/watch/bleach-366" title="Bleach">Bleach</a></div>`;
            const animeData = AnimeExtractor.extractFromListItem(element);
            expect(animeData).not.toBeNull();
            expect(AnimeExtractor.getCachedAnimeData("366")).toBeDefined();
            AnimeExtractor.clearCache();
            expect(AnimeExtractor.getCachedAnimeData("366")).toBeUndefined();
        });
    });
});
