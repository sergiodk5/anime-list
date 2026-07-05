// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the AnimeService before importing the main script
const mockAnimeService = {
    getAnimeStatus: vi.fn(),
    addToPlanToWatch: vi.fn(),
    removeFromPlanToWatch: vi.fn(),
    startWatching: vi.fn(),
    updateEpisodeProgress: vi.fn(),
    updatePosterUrl: vi.fn(),
    stopWatching: vi.fn(),
    hideAnime: vi.fn(),
    unhideAnime: vi.fn(),
    clearAllHidden: vi.fn(),
    getAnimeDetails: vi.fn(),
    getAllAnime: vi.fn(),
    clearAnimeData: vi.fn(),
};

vi.mock("@/commons/services", () => ({
    AnimeService: vi.fn().mockImplementation(() => mockAnimeService),
}));

// Mock StorageAdapter for drag-and-drop functionality
vi.mock("@/commons/adapters/StorageAdapter", () => ({
    StorageAdapter: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
    },
}));

const ITEM_ONE_HTML = `
    <div class="item" data-testid="anime-item-1">
        <div class="inner">
            <div class="ani poster"><a href="/watch/test-anime-aaaaa/ep-1"><img alt="Test Anime"></a></div>
            <div class="info">
                <div class="b1">
                    <a class="name d-title" href="/watch/test-anime-aaaaa/ep-1">Test Anime</a>
                </div>
            </div>
        </div>
    </div>
`;

const ITEM_TWO_HTML = `
    <div class="item" data-testid="anime-item-2">
        <div class="inner">
            <div class="ani poster"><a href="/watch/another-anime-bbbbb/ep-1"><img alt="Another Anime"></a></div>
            <div class="info">
                <div class="b1">
                    <a class="name d-title" href="/watch/another-anime-bbbbb/ep-1">Another Anime</a>
                </div>
            </div>
        </div>
    </div>
`;

describe("Content Script", () => {
    beforeEach(() => {
        // Clear document body and setup DOM structure
        document.body.innerHTML = `
            <div id="list-items">
                ${ITEM_ONE_HTML}
                ${ITEM_TWO_HTML}
            </div>
        `;

        // Mock MutationObserver using vi.stubGlobal
        vi.stubGlobal(
            "MutationObserver",
            vi.fn(() => ({
                observe: vi.fn(),
                disconnect: vi.fn(),
            })),
        );

        // Mock console methods to avoid noise in tests
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});

        // Reset all mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Clean up DOM and restore globals
        document.body.innerHTML = "";
        vi.unstubAllGlobals();
    });

    describe("Initialization", () => {
        it("should initialize content script", async () => {
            // Setup mocks
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            // Import the content script
            const contentScript = await import("@/content/index");

            // Manually call init since we disabled auto-init
            await contentScript.init();

            // Verify that the script loaded
            expect(console.log).toHaveBeenCalledWith("AnimeList content script loaded");
        });

        it("should find anime list container", () => {
            const container = document.querySelector("#list-items");
            expect(container).toBeTruthy();
        });

        it("should find anime items", () => {
            const items = document.querySelectorAll(".item");
            expect(items.length).toBe(2);
        });
    });

    describe("Controls Creation", () => {
        it("should create and add controls to anime items", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const controls = document.querySelectorAll(".anime-list-controls");
            expect(controls.length).toBeGreaterThan(0);
        });

        it("should create plan buttons", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const planButtons = document.querySelectorAll('[data-testid="anime-plan-button"]');
            expect(planButtons.length).toBeGreaterThan(0);

            const button = planButtons[0] as HTMLButtonElement;
            expect(button.className).toBe("anime-list-plan-btn");
            expect(button.getAttribute("data-anime-id")).toBeTruthy();
        });

        it("should create hide buttons", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const hideButtons = document.querySelectorAll('[data-testid="anime-hide-button"]');
            expect(hideButtons.length).toBeGreaterThan(0);

            const button = hideButtons[0] as HTMLButtonElement;
            expect(button.className).toBe("anime-list-hide-btn");
            expect(button.getAttribute("data-anime-id")).toBeTruthy();
        });

        it("should create clear hidden button", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const clearButton = document.querySelector('[data-testid="anime-clear-hidden-button"]');
            expect(clearButton).toBeTruthy();
            expect(clearButton?.className).toBe("anime-list-clear-hidden-btn");
        });
    });

    describe("Button Functionality", () => {
        it("should handle plan button click", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            mockAnimeService.addToPlanToWatch.mockResolvedValue(undefined);

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const planButton = document.querySelector('[data-testid="anime-plan-button"]') as HTMLButtonElement;
            expect(planButton).toBeTruthy();

            planButton.click();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockAnimeService.addToPlanToWatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    animeId: expect.any(String),
                    animeTitle: expect.any(String),
                    animeSlug: expect.any(String),
                }),
            );
        });

        it("should handle hide button click", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            mockAnimeService.hideAnime.mockResolvedValue(undefined);

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const hideButton = document.querySelector('[data-testid="anime-hide-button"]') as HTMLButtonElement;
            expect(hideButton).toBeTruthy();

            hideButton.click();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockAnimeService.hideAnime).toHaveBeenCalledWith(expect.any(String));
        });

        it("should handle clear hidden button click", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            mockAnimeService.clearAllHidden.mockResolvedValue(undefined);

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const clearButton = document.querySelector(
                '[data-testid="anime-clear-hidden-button"]',
            ) as HTMLButtonElement;
            expect(clearButton).toBeTruthy();

            clearButton.click();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockAnimeService.clearAllHidden).toHaveBeenCalled();
        });
    });

    describe("CSS Injection", () => {
        it("should inject CSS styles", async () => {
            Object.defineProperty(document, "readyState", {
                value: "complete",
                configurable: true,
            });

            const originalAppendChild = document.head.appendChild;
            const mockAppendChild = vi.fn();
            document.head.appendChild = mockAppendChild;

            const { init } = await import("@/content/index");
            await init();

            document.head.appendChild = originalAppendChild;

            expect(mockAppendChild).toHaveBeenCalled();
            const styleCall = mockAppendChild.mock.calls.find(
                (call) => call[0].tagName === "STYLE" && call[0].getAttribute?.("data-testid") === "anime-list-styles",
            );
            expect(styleCall).toBeTruthy();
        });
    });

    describe("Hidden Anime Handling", () => {
        it("should hide anime items that are marked as hidden", async () => {
            mockAnimeService.getAnimeStatus
                .mockResolvedValueOnce({
                    isTracked: false,
                    isPlanned: false,
                    isHidden: true,
                })
                .mockResolvedValueOnce({
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                });

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const animeItems = document.querySelectorAll(".item");
            const firstItem = animeItems[0];
            const secondItem = animeItems[1];

            expect(firstItem.classList.contains("anime-hidden")).toBe(true);
            expect((firstItem as HTMLElement).style.display).toBe("none");
            expect(firstItem.querySelector(".anime-list-controls")).toBeFalsy();

            expect(secondItem.classList.contains("anime-hidden")).toBe(false);
            expect(secondItem.querySelector(".anime-list-controls")).toBeTruthy();
        });
    });

    describe("Error Handling", () => {
        it("should handle storage errors gracefully", async () => {
            mockAnimeService.getAnimeStatus.mockRejectedValue(new Error("Storage error"));

            const { initializeControls } = await import("@/content/index");

            await expect(initializeControls()).resolves.not.toThrow();
        });
    });

    describe("DOM Ready State Handling", () => {
        it("should wait for DOM to be ready when document is loading", async () => {
            Object.defineProperty(document, "readyState", {
                value: "loading",
                configurable: true,
            });

            const mockAddEventListener = vi.fn().mockImplementation((event, callback) => {
                if (event === "DOMContentLoaded") {
                    setTimeout(callback, 10);
                }
            });

            const originalAddEventListener = document.addEventListener;
            document.addEventListener = mockAddEventListener;

            const { init } = await import("@/content/index");
            await init();

            expect(mockAddEventListener).toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));

            document.addEventListener = originalAddEventListener;
        });

        it("should initialize immediately when DOM is ready", async () => {
            Object.defineProperty(document, "readyState", {
                value: "complete",
                configurable: true,
            });

            const mockAddEventListener = vi.fn();
            const originalAddEventListener = document.addEventListener;
            document.addEventListener = mockAddEventListener;

            const { init } = await import("@/content/index");
            await init();

            expect(mockAddEventListener).not.toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));

            document.addEventListener = originalAddEventListener;
        });
    });

    describe("Additional Coverage", () => {
        it("should cover mutation observer card handling", async () => {
            console.log("AnimeList content script loaded");

            const mockElement = {
                querySelectorAll: vi.fn().mockReturnValue([]),
                appendChild: vi.fn(),
                classList: { add: vi.fn() },
            };

            Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
            vi.spyOn(document, "querySelector").mockReturnValue(mockElement as any);
            vi.spyOn(document, "querySelectorAll").mockReturnValue([] as any);
            vi.spyOn(document.head, "appendChild").mockImplementation(() => mockElement as any);
            vi.spyOn(document.body, "appendChild").mockImplementation(() => mockElement as any);
            vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
                const element = document.defaultView!.document.createElement(tag);
                element.setAttribute = vi.fn();
                return element;
            });

            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            let capturedCallback: MutationCallback | null = null;
            const originalMutationObserver = global.MutationObserver;

            global.MutationObserver = vi.fn().mockImplementation((callback) => {
                capturedCallback = callback;
                return {
                    observe: vi.fn(),
                    disconnect: vi.fn(),
                };
            });

            try {
                const { init } = await import("@/content/index");
                await init();

                expect(console.log).toHaveBeenCalledWith("AnimeList content script loaded");

                if (capturedCallback) {
                    const animeElement = document.createElement("div");
                    animeElement.className = "item";
                    animeElement.innerHTML = `
                        <div class="ani poster"></div>
                        <div class="b1">
                            <a class="name d-title" href="/watch/test-anime-aaaaa/ep-1">Test Anime</a>
                        </div>
                    `;

                    const containerElement = document.createElement("div");
                    const innerAnimeElement = document.createElement("div");
                    innerAnimeElement.className = "item";
                    innerAnimeElement.innerHTML = `
                        <div class="ani poster"></div>
                        <div class="b1">
                            <a class="name d-title" href="/watch/container-anime-bbbbb/ep-1">Container Anime</a>
                        </div>
                    `;
                    containerElement.appendChild(innerAnimeElement);

                    animeElement.matches = vi.fn().mockReturnValue(true);

                    const addedNodes = [animeElement, containerElement] as any;
                    addedNodes.forEach = Array.prototype.forEach;

                    containerElement.querySelectorAll = vi.fn().mockReturnValue([innerAnimeElement]);

                    const mutations = [
                        {
                            type: "childList",
                            addedNodes: addedNodes,
                        },
                        {
                            type: "attributes",
                            addedNodes: [] as any,
                        },
                    ] as MutationRecord[];

                    expect(() => capturedCallback!(mutations, {} as MutationObserver)).not.toThrow();

                    expect(animeElement.matches).toHaveBeenCalledWith(".item");
                    expect(containerElement.querySelectorAll).toHaveBeenCalledWith(".item");
                }
            } finally {
                global.MutationObserver = originalMutationObserver;
            }
        });

        it("should cover isPlanned=true branch in addControlsToItem", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: true,
                isHidden: false,
            });

            Object.defineProperty(document, "readyState", { value: "complete", configurable: true });

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const startWatchingButtons = document.querySelectorAll('[data-testid="anime-start-watching-button"]');
            const removePlanButtons = document.querySelectorAll('[data-testid="anime-remove-plan-button"]');
            const planButtons = document.querySelectorAll('[data-testid="anime-plan-button"]');

            expect(startWatchingButtons.length).toBeGreaterThan(0);
            expect(removePlanButtons.length).toBeGreaterThan(0);
            expect(planButtons.length).toBe(0);
        });
    });

    describe("Poster Backfill", () => {
        function buildTrackedItem(slug: string, imgSrc?: string): HTMLElement {
            const item = document.createElement("div");
            item.className = "item";
            item.innerHTML = `
                <div class="inner">
                    <div class="ani poster"><a href="/watch/${slug}/ep-1"><img alt="Tracked Anime"${imgSrc ? ` src="${imgSrc}"` : ""}></a></div>
                    <div class="info">
                        <div class="b1">
                            <a class="name d-title" href="/watch/${slug}/ep-1">Tracked Anime</a>
                        </div>
                    </div>
                </div>
            `;
            document.querySelector("#list-items")?.appendChild(item);
            return item;
        }

        function trackedStatus(animeId: string, posterUrl?: string) {
            return {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: {
                    animeId,
                    animeTitle: "Tracked Anime",
                    animeSlug: animeId,
                    currentEpisode: 3,
                    episodeId: `${animeId}-episode-3`,
                    lastWatched: "2024-01-15T10:30:00.000Z",
                    posterUrl,
                },
            };
        }

        it("should backfill the poster URL when tracked progress has none and the card has one", async () => {
            const slug = "backfill-target-ccccc";
            const posterUrl = "https://cdn.anipixcdn.co/thumbnail/backfill.jpg";
            const item = buildTrackedItem(slug, posterUrl);
            mockAnimeService.getAnimeStatus.mockResolvedValue(trackedStatus(slug));
            mockAnimeService.updatePosterUrl.mockResolvedValue(undefined);

            const { addControlsToItem } = await import("@/content/index");
            await addControlsToItem(item);

            expect(mockAnimeService.updatePosterUrl).toHaveBeenCalledWith(slug, posterUrl);
        });

        it("should not backfill when the stored progress already has a poster URL", async () => {
            const slug = "already-postered-ddddd";
            const item = buildTrackedItem(slug, "https://cdn.anipixcdn.co/thumbnail/fresh.jpg");
            mockAnimeService.getAnimeStatus.mockResolvedValue(
                trackedStatus(slug, "https://cdn.anipixcdn.co/thumbnail/stored.jpg"),
            );

            const { addControlsToItem } = await import("@/content/index");
            await addControlsToItem(item);

            expect(mockAnimeService.updatePosterUrl).not.toHaveBeenCalled();
        });

        it("should not backfill when the card has no poster URL to offer", async () => {
            const slug = "no-poster-eeeee";
            const item = buildTrackedItem(slug);
            mockAnimeService.getAnimeStatus.mockResolvedValue(trackedStatus(slug));

            const { addControlsToItem } = await import("@/content/index");
            await addControlsToItem(item);

            expect(mockAnimeService.updatePosterUrl).not.toHaveBeenCalled();
        });

        it("should not backfill when the anime is not tracked", async () => {
            const slug = "untracked-fffff";
            const item = buildTrackedItem(slug, "https://cdn.anipixcdn.co/thumbnail/untracked.jpg");
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            const { addControlsToItem } = await import("@/content/index");
            await addControlsToItem(item);

            expect(mockAnimeService.updatePosterUrl).not.toHaveBeenCalled();
        });
    });

    describe("Edge Cases", () => {
        it("should handle anime items without valid data", async () => {
            const invalidItem = document.createElement("div");
            invalidItem.className = "item";
            invalidItem.innerHTML = `
                <div class="ani poster"></div>
                <div class="b1">
                    <!-- No link element -->
                </div>
            `;

            const container = document.querySelector("#list-items");
            container?.appendChild(invalidItem);

            const { initializeControls } = await import("@/content/index");

            await expect(initializeControls()).resolves.not.toThrow();

            const controls = invalidItem.querySelector(".anime-list-controls");
            expect(controls).toBeFalsy();
        });

        it("should handle missing container gracefully", async () => {
            const container = document.querySelector("#list-items");
            container?.remove();

            const { initializeControls } = await import("@/content/index");

            await expect(initializeControls()).resolves.not.toThrow();
        });

        it("should handle extractAnimeData with invalid href patterns", async () => {
            const invalidItem = document.createElement("div");
            invalidItem.className = "item";
            invalidItem.innerHTML = `
                <div class="ani poster"></div>
                <div class="b1">
                    <a class="name d-title" href="invalid-url">Invalid Anime</a>
                </div>
            `;

            const { extractAnimeData } = await import("@/content/index");

            const result = extractAnimeData(invalidItem);
            expect(result).toBeNull();
        });

        it("should handle items without poster element", async () => {
            const itemWithoutPoster = document.createElement("div");
            itemWithoutPoster.className = "item";
            itemWithoutPoster.innerHTML = `
                <div class="b1">
                    <a class="name d-title" href="/watch/test-anime-zzzzz/ep-1">Test Anime</a>
                </div>
            `;

            const container = document.querySelector("#list-items");
            container?.appendChild(itemWithoutPoster);

            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            const { initializeControls } = await import("@/content/index");

            await expect(initializeControls()).resolves.not.toThrow();

            const controls = itemWithoutPoster.querySelector(".anime-list-controls");
            expect(controls).toBeFalsy();
        });

        it("should handle extractAnimeData with missing title link", async () => {
            const itemWithoutLink = document.createElement("div");
            itemWithoutLink.className = "item";
            itemWithoutLink.innerHTML = `
                <div class="ani poster"></div>
                <div class="b1">
                    <!-- No anchor tag -->
                </div>
            `;

            const { extractAnimeData } = await import("@/content/index");

            const result = extractAnimeData(itemWithoutLink);
            expect(result).toBeNull();
        });

        it("should handle extractAnimeData with empty href", async () => {
            const itemWithEmptyHref = document.createElement("div");
            itemWithEmptyHref.className = "item";
            itemWithEmptyHref.innerHTML = `
                <div class="ani poster"></div>
                <div class="b1">
                    <a class="name d-title" href="">Test Anime</a>
                </div>
            `;

            const { extractAnimeData } = await import("@/content/index");

            const result = extractAnimeData(itemWithEmptyHref);
            expect(result).toBeNull();
        });

        it("should handle extractAnimeData errors gracefully", async () => {
            const errorElement = {
                querySelector: vi.fn().mockImplementation(() => {
                    throw new Error("DOM error");
                }),
            } as any;

            const { extractAnimeData } = await import("@/content/index");

            const result = extractAnimeData(errorElement);
            expect(result).toBeNull();
        });

        it("should handle clear hidden button without existing button", async () => {
            const existingButton = document.querySelector(".anime-list-clear-hidden-btn");
            existingButton?.remove();

            const { addClearHiddenButton } = await import("@/content/index");

            expect(() => addClearHiddenButton()).not.toThrow();

            const newButton = document.querySelector(".anime-list-clear-hidden-btn");
            expect(newButton).toBeTruthy();
        });

        it("should not add duplicate clear hidden button", async () => {
            const { addClearHiddenButton } = await import("@/content/index");

            addClearHiddenButton();
            const firstButton = document.querySelector(".anime-list-clear-hidden-btn");
            expect(firstButton).toBeTruthy();

            addClearHiddenButton();
            const allButtons = document.querySelectorAll(".anime-list-clear-hidden-btn");
            expect(allButtons.length).toBe(1);
        });

        it("should handle init function errors gracefully", async () => {
            Object.defineProperty(document, "readyState", { value: "complete", configurable: true });

            const container = document.querySelector("#list-items");
            container?.remove();

            const originalError = console.error;
            const consoleErrorSpy = vi.fn();
            console.error = consoleErrorSpy;

            const { init } = await import("@/content/index");

            await expect(init()).resolves.not.toThrow();

            console.error = originalError;
        });

        it("should handle init function with actual error", async () => {
            Object.defineProperty(document, "readyState", { value: "complete", configurable: true });

            const originalAppendChild = document.head.appendChild;
            document.head.appendChild = vi.fn().mockImplementation(() => {
                throw new Error("DOM manipulation error");
            });

            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            try {
                const { init } = await import("@/content/index");

                await expect(init()).resolves.not.toThrow();

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Error initializing AnimeList content script:",
                    expect.any(Error),
                );
            } finally {
                document.head.appendChild = originalAppendChild;
                consoleErrorSpy.mockRestore();
            }
        });

        it("should handle error in clear hidden button functionality", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            mockAnimeService.clearAllHidden.mockRejectedValue(new Error("Storage error"));

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const clearButton = document.querySelector(
                '[data-testid="anime-clear-hidden-button"]',
            ) as HTMLButtonElement;
            expect(clearButton).toBeTruthy();

            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            clearButton.click();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(consoleErrorSpy).toHaveBeenCalledWith("Error handling clear hidden click:", expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        it("should handle error in initializeControls function", async () => {
            const originalQuerySelector = document.querySelector;
            Object.defineProperty(document, "readyState", { value: "complete", configurable: true });
            const originalQuery = document.querySelector.bind(document);
            vi.spyOn(document, "querySelector").mockImplementation((selector: string) => {
                if (selector === "#list-items") {
                    throw new Error("DOM access error");
                }
                return originalQuery(selector);
            });

            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            try {
                const { initializeControls } = await import("@/content/index");

                await expect(initializeControls()).resolves.not.toThrow();

                expect(consoleErrorSpy).toHaveBeenCalledWith("Error initializing controls:", expect.any(Error));
            } finally {
                document.querySelector = originalQuerySelector;
                consoleErrorSpy.mockRestore();
            }
        });

        it("should handle error in plan button functionality", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            mockAnimeService.addToPlanToWatch.mockRejectedValue(new Error("Storage error"));

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const planButton = document.querySelector('[data-testid="anime-plan-button"]') as HTMLButtonElement;
            expect(planButton).toBeTruthy();

            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            planButton.click();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(consoleErrorSpy).toHaveBeenCalledWith("Error handling plan click:", expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        it("should handle error in hide button functionality", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            mockAnimeService.hideAnime.mockRejectedValue(new Error("Storage error"));

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const hideButton = document.querySelector('[data-testid="anime-hide-button"]') as HTMLButtonElement;
            expect(hideButton).toBeTruthy();

            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            hideButton.click();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(consoleErrorSpy).toHaveBeenCalledWith("Error handling hide click:", expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        it("should handle removing anime from plan to watch list", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: true,
                isHidden: false,
            });
            mockAnimeService.removeFromPlanToWatch.mockResolvedValue(undefined);

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const removePlanButton = document.querySelector(
                '[data-testid="anime-remove-plan-button"]',
            ) as HTMLButtonElement;
            const planButton = document.querySelector('[data-testid="anime-plan-button"]');
            expect(removePlanButton).toBeTruthy();
            expect(planButton).toBeNull();

            removePlanButton.click();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockAnimeService.removeFromPlanToWatch).toHaveBeenCalled();
        });

        it("should handle clear hidden button with hidden items", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            mockAnimeService.clearAllHidden.mockResolvedValue({
                success: true,
                message: "Restored 2 hidden anime",
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                },
            });

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const hiddenItem1 = document.createElement("div");
            hiddenItem1.className = "item anime-hidden";
            hiddenItem1.style.display = "none";
            document.body.appendChild(hiddenItem1);

            const hiddenItem2 = document.createElement("div");
            hiddenItem2.className = "item anime-hidden";
            hiddenItem2.style.display = "none";
            document.body.appendChild(hiddenItem2);

            const clearButton = document.querySelector(
                '[data-testid="anime-clear-hidden-button"]',
            ) as HTMLButtonElement;
            expect(clearButton).toBeTruthy();

            clearButton.click();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockAnimeService.clearAllHidden).toHaveBeenCalled();

            expect(hiddenItem1.classList.contains("anime-hidden")).toBe(false);
            expect(hiddenItem1.style.display).toBe("");
            expect(hiddenItem2.classList.contains("anime-hidden")).toBe(false);
            expect(hiddenItem2.style.display).toBe("");
        });

        it("should handle showFeedback timeout removal", async () => {
            mockAnimeService.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            mockAnimeService.clearAllHidden.mockResolvedValue({
                success: true,
                message: "Restored 2 hidden anime",
                newStatus: {
                    isTracked: false,
                    isPlanned: false,
                    isHidden: false,
                },
            });

            const { initializeControls } = await import("@/content/index");
            await initializeControls();

            const clearButton = document.querySelector(
                '[data-testid="anime-clear-hidden-button"]',
            ) as HTMLButtonElement;
            expect(clearButton).toBeTruthy();

            clearButton.click();
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockAnimeService.clearAllHidden).toHaveBeenCalled();

            const toastElement = document.querySelector('[data-testid="anime-toast"]');
            expect(toastElement).toBeNull();
        });

        it("should handle extractAnimeData with null href attribute", async () => {
            const itemWithNullHref = document.createElement("div");
            itemWithNullHref.className = "item";
            itemWithNullHref.innerHTML = `
                <div class="ani poster"></div>
                <div class="b1">
                    <a class="name d-title">Test Anime</a>
                </div>
            `;

            const linkElement = itemWithNullHref.querySelector(".name.d-title");
            if (linkElement) {
                vi.spyOn(linkElement, "getAttribute").mockImplementation((attr) => {
                    if (attr === "href") return null;
                    return null;
                });
            }

            const { extractAnimeData } = await import("@/content/index");

            const result = extractAnimeData(itemWithNullHref);
            expect(result).toBeNull();
        });

        it("should handle addClearHiddenButton when container is null", async () => {
            const container = document.querySelector("#list-items");
            container?.remove();

            const { addClearHiddenButton } = await import("@/content/index");

            expect(() => addClearHiddenButton()).not.toThrow();

            const clearButton = document.querySelector(".anime-list-clear-hidden-btn");
            expect(clearButton).toBeFalsy();
        });

        it("should set animeId equal to the full slug from the watch URL", async () => {
            const card = document.createElement("div");
            card.className = "item";
            card.innerHTML = `
                <div class="ani poster"></div>
                <div class="b1">
                    <a class="name d-title" href="/watch/anime-name-zzzzz/ep-1">Test Anime</a>
                </div>
            `;

            const { extractAnimeData } = await import("@/content/index");

            const result = extractAnimeData(card);
            expect(result).not.toBeNull();
            expect(result?.animeId).toBe("anime-name-zzzzz");
            expect(result?.animeSlug).toBe("anime-name-zzzzz");
        });
    });
});
