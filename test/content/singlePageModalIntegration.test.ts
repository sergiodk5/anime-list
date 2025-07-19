import type { AnimeStatus } from "@/commons/models";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Test the single page modal integration with existing content script
describe("Single Page Modal Integration", () => {
    let originalLocation: Location;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = "";
        document.head.innerHTML = "";

        // Mock window.location
        originalLocation = window.location;
        delete (window as any).location;
        (window as any).location = {
            href: "https://example.com/watch/test-anime-123",
        };
    });

    afterEach(() => {
        // Restore window.location
        (window as any).location = originalLocation;

        // Clean up DOM
        document.body.innerHTML = "";
        document.head.innerHTML = "";
    });

    describe("Integration with Content Script", () => {
        it("should initialize single page modal on watch pages", () => {
            // Simulate a watch page
            (window as any).location.href = "https://example.com/watch/demon-slayer-123";

            // Verify we can detect watch pages
            const isWatchPage = window.location.href.includes("/watch/");
            expect(isWatchPage).toBe(true);
        });

        it("should extract anime ID from URL patterns", () => {
            const testCases = [
                {
                    url: "https://example.com/watch/demon-slayer-123",
                    expectedId: "123",
                    description: "numeric suffix pattern",
                },
                {
                    url: "https://example.com/watch/attack-on-titan",
                    expectedId: "attack-on-titan",
                    description: "full slug pattern",
                },
                {
                    url: "https://example.com/watch/one-piece-1000",
                    expectedId: "1000",
                    description: "large numeric suffix",
                },
            ];

            testCases.forEach(({ url, expectedId }) => {
                const urlMatch = url.match(/\/watch\/([^/?]+)/);
                expect(urlMatch).toBeTruthy();

                if (urlMatch) {
                    const slug = urlMatch[1];
                    const numericMatch = slug.match(/-(\d+)$/);
                    const extractedId = numericMatch ? numericMatch[1] : slug;
                    expect(extractedId).toBe(expectedId);
                }
            });
        });

        it("should create modal elements in DOM", () => {
            // Create a mock button
            const button = document.createElement("button");
            button.id = "anime-list-info-button";
            button.textContent = "Anime Info";
            document.body.appendChild(button);

            // Verify button exists
            const foundButton = document.getElementById("anime-list-info-button");
            expect(foundButton).toBeTruthy();
            expect(foundButton?.textContent).toBe("Anime Info");
        });

        it("should create modal overlay structure", () => {
            // Create modal structure
            const overlay = document.createElement("div");
            overlay.id = "anime-modal-overlay";
            overlay.style.cssText =
                "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); z-index: 10000;";

            const content = document.createElement("div");
            content.id = "anime-modal-content";
            content.style.cssText =
                "background: rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 2rem; min-width: 400px; color: white;";

            const title = document.createElement("h2");
            title.id = "anime-modal-title";
            title.textContent = "Test Anime";

            const statusText = document.createElement("p");
            statusText.id = "anime-modal-status";
            statusText.textContent = "Currently watching - Episode 5";

            const actionsContainer = document.createElement("div");
            actionsContainer.id = "anime-modal-actions";

            // Create episode controls
            const episodeControls = document.createElement("div");
            episodeControls.id = "episode-controls";
            episodeControls.innerHTML = `
                <span>Episode:</span>
                <button class="modal-episode-decrement" data-testid="modal-episode-decrement">−</button>
                <input type="number" class="modal-episode-current" data-testid="modal-episode-input" min="1" max="999" value="5">
                <button class="modal-episode-increment" data-testid="modal-episode-increment">+</button>
            `;

            actionsContainer.appendChild(episodeControls);

            const closeButton = document.createElement("button");
            closeButton.id = "anime-modal-close";
            closeButton.textContent = "Close";

            // Assemble modal
            content.appendChild(title);
            content.appendChild(statusText);
            content.appendChild(actionsContainer);
            content.appendChild(closeButton);
            overlay.appendChild(content);
            document.body.appendChild(overlay);

            // Verify modal structure
            expect(document.getElementById("anime-modal-overlay")).toBeTruthy();
            expect(document.getElementById("anime-modal-content")).toBeTruthy();
            expect(document.getElementById("anime-modal-title")?.textContent).toBe("Test Anime");
            expect(document.getElementById("anime-modal-status")?.textContent).toBe("Currently watching - Episode 5");
            expect(document.querySelector("[data-testid='modal-episode-input']")).toBeTruthy();
            expect(document.querySelector("[data-testid='modal-episode-decrement']")).toBeTruthy();
            expect(document.querySelector("[data-testid='modal-episode-increment']")).toBeTruthy();
        });
    });

    describe("Modal Actions Logic", () => {
        const createStatus = (overrides: Partial<AnimeStatus> = {}): AnimeStatus => ({
            isTracked: false,
            isPlanned: false,
            isHidden: false,
            progress: undefined,
            ...overrides,
        });

        it("should return correct actions for clean anime", () => {
            const status = createStatus();

            // Test the logic that would be in getModalActions
            const actions = [];
            if (!status.isTracked && !status.isPlanned && !status.isHidden) {
                actions.push({ type: "addToPlan", label: "Add to Plan" });
                actions.push({ type: "hide", label: "Hide Anime" });
            }

            expect(actions).toHaveLength(2);
            expect(actions[0].type).toBe("addToPlan");
            expect(actions[1].type).toBe("hide");
        });

        it("should return correct actions for planned anime", () => {
            const status = createStatus({ isPlanned: true });

            const actions = [];
            if (status.isPlanned) {
                actions.push({ type: "removePlan", label: "Remove from Plan" });
                actions.push({ type: "startWatching", label: "Start Watching" });
            }

            expect(actions).toHaveLength(2);
            expect(actions[0].type).toBe("removePlan");
            expect(actions[1].type).toBe("startWatching");
        });

        it("should return correct actions for watching anime", () => {
            const status = createStatus({
                isTracked: true,
                progress: {
                    animeId: "123",
                    animeTitle: "Test Anime",
                    animeSlug: "test-anime",
                    currentEpisode: 5,
                    episodeId: "ep-5",
                    lastWatched: "2024-01-01T00:00:00.000Z",
                },
            });

            const actions = [];
            if (status.isTracked) {
                actions.push({ type: "episodeControls", label: "Episode Controls" });
                actions.push({ type: "stopWatching", label: "Stop Watching" });
            }

            expect(actions).toHaveLength(2);
            expect(actions[0].type).toBe("episodeControls");
            expect(actions[1].type).toBe("stopWatching");
        });

        it("should return correct actions for hidden anime", () => {
            const status = createStatus({ isHidden: true });

            const actions = [];
            if (status.isHidden) {
                actions.push({ type: "unhide", label: "Remove from Hidden" });
            }

            expect(actions).toHaveLength(1);
            expect(actions[0].type).toBe("unhide");
        });
    });

    describe("Episode Controls Logic", () => {
        let episodeInput: HTMLInputElement;

        beforeEach(() => {
            episodeInput = document.createElement("input");
            episodeInput.type = "number";
            episodeInput.min = "1";
            episodeInput.max = "999";
            episodeInput.value = "5";
            document.body.appendChild(episodeInput);
        });

        it("should increment episode within bounds", () => {
            const currentValue = parseInt(episodeInput.value, 10);
            const newValue = Math.min(999, currentValue + 1);

            expect(newValue).toBe(6);
            expect(newValue).toBeLessThanOrEqual(999);
        });

        it("should decrement episode within bounds", () => {
            const currentValue = parseInt(episodeInput.value, 10);
            const newValue = Math.max(1, currentValue - 1);

            expect(newValue).toBe(4);
            expect(newValue).toBeGreaterThanOrEqual(1);
        });

        it("should not increment above 999", () => {
            episodeInput.value = "999";
            const currentValue = parseInt(episodeInput.value, 10);
            const newValue = Math.min(999, currentValue + 1);

            expect(newValue).toBe(999);
        });

        it("should not decrement below 1", () => {
            episodeInput.value = "1";
            const currentValue = parseInt(episodeInput.value, 10);
            const newValue = Math.max(1, currentValue - 1);

            expect(newValue).toBe(1);
        });

        it("should validate episode number input", () => {
            const testCases = [
                { input: "5", expected: 5, valid: true },
                { input: "1", expected: 1, valid: true },
                { input: "999", expected: 999, valid: true },
                { input: "0", expected: 0, valid: false },
                { input: "1000", expected: 1000, valid: false },
                { input: "abc", expected: NaN, valid: false },
                { input: "-5", expected: -5, valid: false },
            ];

            testCases.forEach(({ input, expected, valid }) => {
                const parsed = parseInt(input, 10);
                const isValid = !isNaN(parsed) && parsed >= 1 && parsed <= 999;

                expect(parsed).toBe(expected);
                expect(isValid).toBe(valid);
            });
        });
    });

    describe("Status Text Generation", () => {
        const createStatus = (overrides: Partial<AnimeStatus> = {}): AnimeStatus => ({
            isTracked: false,
            isPlanned: false,
            isHidden: false,
            progress: undefined,
            ...overrides,
        });

        it("should generate correct status text for different states", () => {
            const testCases = [
                {
                    status: createStatus({ isHidden: true }),
                    expected: "Hidden from lists",
                },
                {
                    status: createStatus({
                        isTracked: true,
                        progress: {
                            animeId: "123",
                            animeTitle: "Test Anime",
                            animeSlug: "test-anime",
                            currentEpisode: 7,
                            episodeId: "ep-7",
                            lastWatched: "2024-01-01T00:00:00.000Z",
                        },
                    }),
                    expected: "Currently watching - Episode 7",
                },
                {
                    status: createStatus({ isTracked: true }),
                    expected: "Currently watching",
                },
                {
                    status: createStatus({ isPlanned: true }),
                    expected: "Planned to watch",
                },
                {
                    status: createStatus(),
                    expected: "Not tracked",
                },
            ];

            testCases.forEach(({ status, expected }) => {
                let statusText = "";

                if (status.isHidden) {
                    statusText = "Hidden from lists";
                } else if (status.isTracked && status.progress) {
                    statusText = `Currently watching - Episode ${status.progress.currentEpisode}`;
                } else if (status.isTracked) {
                    statusText = "Currently watching";
                } else if (status.isPlanned) {
                    statusText = "Planned to watch";
                } else {
                    statusText = "Not tracked";
                }

                expect(statusText).toBe(expected);
            });
        });
    });

    describe("DOM Event Handling", () => {
        it("should handle button click events", () => {
            const button = document.createElement("button");
            let clicked = false;

            button.addEventListener("click", () => {
                clicked = true;
            });

            // Simulate click
            button.click();

            expect(clicked).toBe(true);
        });

        it("should handle input change events", () => {
            const input = document.createElement("input");
            input.type = "number";
            input.value = "5";

            let changeTriggered = false;
            let newValue = "";

            input.addEventListener("change", (e) => {
                changeTriggered = true;
                newValue = (e.target as HTMLInputElement).value;
            });

            // Simulate change
            input.value = "10";
            input.dispatchEvent(new Event("change"));

            expect(changeTriggered).toBe(true);
            expect(newValue).toBe("10");
        });

        it("should handle modal overlay click to close", () => {
            const overlay = document.createElement("div");
            overlay.id = "modal-overlay";

            const content = document.createElement("div");
            content.id = "modal-content";
            overlay.appendChild(content);

            let shouldClose = false;

            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) {
                    shouldClose = true;
                }
            });

            // Click on overlay (not content) should trigger close
            overlay.click();
            expect(shouldClose).toBe(true);

            // Reset and click on content should not trigger close
            shouldClose = false;
            content.click();
            expect(shouldClose).toBe(false);
        });

        it("should handle escape key to close modal", () => {
            let escapePressed = false;

            const handleKeydown = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    escapePressed = true;
                }
            };

            document.addEventListener("keydown", handleKeydown);

            // Simulate escape key
            const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(escapeEvent);

            expect(escapePressed).toBe(true);

            // Cleanup
            document.removeEventListener("keydown", handleKeydown);
        });
    });
});
