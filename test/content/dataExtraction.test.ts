import { extractAnimeData, extractSinglePageAnimeData, isWatchPage } from "@/content";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Set up a global location mock
Object.defineProperty(window, "location", {
    value: {
        pathname: "/",
        href: "https://anikototv.to/",
    },
    writable: true,
});

function buildCard({
    href = "/watch/naruto-abcde/ep-1",
    title = "Naruto",
}: { href?: string; title?: string } = {}): HTMLDivElement {
    const card = document.createElement("div");
    card.className = "item";
    card.innerHTML = `
        <div class="inner">
            <div class="ani poster"><a href="${href}"><img alt="${title}"></a></div>
            <div class="info">
                <div class="b1">
                    <a class="name d-title" href="${href}">${title}</a>
                </div>
            </div>
        </div>
    `;
    return card;
}

describe("Content Script Data Extraction Functions", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.clearAllMocks();
    });

    describe("extractAnimeData", () => {
        it("should extract anime data from valid element", () => {
            const card = buildCard({ href: "/watch/naruto-abcde/ep-1", title: "Naruto" });
            const animeData = extractAnimeData(card);
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("naruto-abcde");
            expect(animeData?.animeTitle).toBe("Naruto");
        });

        it("should return null for element without anime link", () => {
            const element = document.createElement("div");
            element.innerHTML = `<p>No anime here</p>`;

            const animeData = extractAnimeData(element);
            expect(animeData).toBeNull();
        });

        it("should handle element with invalid href", () => {
            const card = document.createElement("div");
            card.className = "item";
            card.innerHTML = `
                <div class="b1">
                    <a class="name d-title" href="#">Not anime</a>
                </div>
            `;

            const animeData = extractAnimeData(card);
            expect(animeData).toBeNull();
        });

        it("should extract title from the name link", () => {
            const card = buildCard({ href: "/watch/attack-on-titan-aotid/ep-1", title: "Attack on Titan" });
            const animeData = extractAnimeData(card);
            expect(animeData).toBeTruthy();
            expect(animeData?.animeTitle).toBe("Attack on Titan");
            expect(animeData?.animeSlug).toBe("attack-on-titan-aotid");
        });

        it("should handle nested structure within the item card", () => {
            const card = document.createElement("div");
            card.className = "item";
            card.innerHTML = `
                <div class="inner">
                    <div class="ani poster"><a href="/watch/one-piece-opidd/ep-1"><img alt="One Piece"></a></div>
                    <div class="info">
                        <div class="b1">
                            <a class="name d-title" href="/watch/one-piece-opidd/ep-1">One Piece</a>
                        </div>
                    </div>
                </div>
            `;

            const animeData = extractAnimeData(card);
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("one-piece-opidd");
        });

        it("should use the first name link when multiple are present", () => {
            const card = document.createElement("div");
            card.className = "item";
            card.innerHTML = `
                <div class="b1">
                    <a class="name d-title" href="/watch/first-anime-aaaaa/ep-1">First</a>
                </div>
                <div class="b1">
                    <a class="name d-title" href="/watch/second-anime-bbbbb/ep-1">Second</a>
                </div>
            `;

            const animeData = extractAnimeData(card);
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("first-anime-aaaaa");
        });
    });

    describe("isWatchPage", () => {
        it("should return true for /watch/{slug}/ep-N URL", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/naruto-abcde/ep-1",
                    href: "https://anikototv.to/watch/naruto-abcde/ep-1",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(true);
        });

        it("should return false for non-watch page URL", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/anime/naruto",
                    href: "https://anikototv.to/anime/naruto",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(false);
        });

        it("should return false for root page", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/",
                    href: "https://anikototv.to/",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(false);
        });

        it("should return false for /watch/{slug} without an episode segment", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/some-anime",
                    href: "https://anikototv.to/watch/some-anime",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(false);
        });

        it("should return true for /watch/{slug}/ep-N with query parameters", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/anime-abcde/ep-3",
                    href: "https://anikototv.to/watch/anime-abcde/ep-3?t=123",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(true);
        });
    });

    describe("extractSinglePageAnimeData", () => {
        beforeEach(() => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/test-anime-abcde/ep-1",
                    href: "https://anikototv.to/watch/test-anime-abcde/ep-1",
                },
                writable: true,
            });
        });

        it("should extract anime data from watch page URL", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/naruto-shippuden-snxwm/ep-100",
                    href: "https://anikototv.to/watch/naruto-shippuden-snxwm/ep-100",
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
                    href: "https://anikototv.to/anime/some-anime",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeNull();
        });

        it("should extract slug exactly without episode info appended", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/simple-anime-aaaaa/ep-1",
                    href: "https://anikototv.to/watch/simple-anime-aaaaa/ep-1",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("simple-anime-aaaaa");
        });

        it("should extract title from the h1 heading element", () => {
            document.title = "";
            const h1Element = document.createElement("h1");
            h1Element.textContent = "Attack on Titan";
            document.body.appendChild(h1Element);

            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/attack-on-titan-aotid/ep-1",
                    href: "https://anikototv.to/watch/attack-on-titan-aotid/ep-1",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeTitle).toContain("Attack on Titan");
        });

        it("should fall back to slug when there is no title element or document.title", () => {
            document.title = "";
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/mystery-anime-aaaaa/ep-5",
                    href: "https://anikototv.to/watch/mystery-anime-aaaaa/ep-5",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("mystery-anime-aaaaa");
            expect(animeData?.animeTitle).toBe("mystery-anime-aaaaa");
        });

        it("should set animeId equal to the slug", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/demon-slayer-aaaaa/ep-1",
                    href: "https://anikototv.to/watch/demon-slayer-aaaaa/ep-1",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeId).toBe("demon-slayer-aaaaa");
            expect(animeData?.animeSlug).toBe("demon-slayer-aaaaa");
        });

        it("should handle complex slug patterns", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/jujutsu-kaisen-season-2-jkid2/ep-15",
                    href: "https://anikototv.to/watch/jujutsu-kaisen-season-2-jkid2/ep-15",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeSlug).toBe("jujutsu-kaisen-season-2-jkid2");
            expect(animeData?.animeId).toBe("jujutsu-kaisen-season-2-jkid2");
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
                    href: "https://anikototv.to/",
                },
                writable: true,
            });

            expect(isWatchPage()).toBe(false);
        });

        it("should handle malformed URLs", () => {
            Object.defineProperty(window, "location", {
                value: {
                    pathname: "///watch///",
                    href: "https://anikototv.to///watch///",
                },
                writable: true,
            });

            expect(() => isWatchPage()).not.toThrow();
            expect(() => extractSinglePageAnimeData()).not.toThrow();
        });

        it("should handle special characters in anime titles", () => {
            document.title = "";
            const h1Element = document.createElement("h1");
            h1Element.textContent = "Anime with Special Characters: éàü";
            document.body.appendChild(h1Element);

            Object.defineProperty(window, "location", {
                value: {
                    pathname: "/watch/anime-special-chars-aaaaa/ep-1",
                    href: "https://anikototv.to/watch/anime-special-chars-aaaaa/ep-1",
                },
                writable: true,
            });

            const animeData = extractSinglePageAnimeData();
            expect(animeData).toBeTruthy();
            expect(animeData?.animeTitle).toContain("éàü");
        });
    });
});
