import { beforeEach, describe, expect, it, vi } from "vitest";
import { StorageKeys } from "../../src/commons/models";
import {
    clearTileOrder,
    createDragToolbar,
    disableDragMode,
    enableDragMode,
    getCurrentTileOrder,
    initializeDragAndDrop,
    insertDragToolbar,
    loadTileOrder,
    resetTileOrder,
    restoreTileOrder,
    saveTileOrder,
    toggleDragMode,
} from "../../src/content/index";

// Type-safe chrome storage mock helper
const mockGet = chrome.storage.local.get as ReturnType<typeof vi.fn>;
const mockSet = chrome.storage.local.set as ReturnType<typeof vi.fn>;
const mockRemove = chrome.storage.local.remove as ReturnType<typeof vi.fn>;

describe("Drag and Drop Tile Reordering", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.clearAllMocks();
    });

    describe("Storage Operations", () => {
        it("should load tile order from storage", async () => {
            const mockOrder = {
                animeIds: ["123", "456", "789"],
                lastUpdated: "2024-01-01T00:00:00.000Z",
            };
            mockGet.mockResolvedValue({
                [StorageKeys.TILE_ORDER]: mockOrder,
            });

            const result = await loadTileOrder();

            expect(mockGet).toHaveBeenCalledWith(StorageKeys.TILE_ORDER);
            expect(result).toEqual(mockOrder);
        });

        it("should return null when no tile order exists", async () => {
            mockGet.mockResolvedValue({});

            const result = await loadTileOrder();

            expect(result).toBeNull();
        });

        it("should handle storage errors when loading", async () => {
            mockGet.mockRejectedValue(new Error("Storage error"));

            const result = await loadTileOrder();

            expect(result).toBeNull();
        });

        it("should save tile order to storage", async () => {
            mockSet.mockResolvedValue(undefined);
            const animeIds = ["123", "456", "789"];

            await saveTileOrder(animeIds);

            expect(mockSet).toHaveBeenCalledWith({
                [StorageKeys.TILE_ORDER]: expect.objectContaining({
                    animeIds,
                    lastUpdated: expect.any(String),
                }),
            });
        });

        it("should handle storage errors when saving", async () => {
            const consoleErrorSpy = vi.spyOn(console, "error");
            mockSet.mockRejectedValue(new Error("Storage error"));

            // Should not throw
            await expect(saveTileOrder(["123"])).resolves.not.toThrow();

            // Should log the error
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error saving tile order:", expect.any(Error));
        });

        it("should clear tile order from storage", async () => {
            mockRemove.mockResolvedValue(undefined);

            await clearTileOrder();

            expect(mockRemove).toHaveBeenCalledWith(StorageKeys.TILE_ORDER);
        });

        it("should handle storage errors when clearing", async () => {
            const consoleErrorSpy = vi.spyOn(console, "error");
            mockRemove.mockRejectedValue(new Error("Storage error"));

            // Should not throw
            await expect(clearTileOrder()).resolves.not.toThrow();

            // Should log the error
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error clearing tile order:", expect.any(Error));
        });
    });

    describe("getCurrentTileOrder", () => {
        it("should return empty array when no container exists", () => {
            const result = getCurrentTileOrder();
            expect(result).toEqual([]);
        });

        it("should extract anime IDs from DOM elements", () => {
            document.body.innerHTML = `
                <div class="film_list-wrap">
                    <div class="flw-item">
                        <div class="film-name"><a title="Anime One" href="/watch/anime-one-123">Anime One</a></div>
                    </div>
                    <div class="flw-item">
                        <div class="film-name"><a title="Anime Two" href="/watch/anime-two-456">Anime Two</a></div>
                    </div>
                </div>
            `;

            const result = getCurrentTileOrder();

            expect(result).toHaveLength(2);
            expect(result).toContain("123");
            expect(result).toContain("456");
        });
    });

    describe("Toolbar Creation", () => {
        it("should create drag toolbar element", () => {
            const toolbar = createDragToolbar();

            expect(toolbar).toBeInstanceOf(HTMLDivElement);
            expect(toolbar.className).toBe("anime-list-drag-toolbar");
            expect(toolbar.getAttribute("data-testid")).toBe("drag-toolbar");
        });

        it("should have toggle and reset buttons", () => {
            const toolbar = createDragToolbar();

            const toggleBtn = toolbar.querySelector(".drag-mode-toggle");
            const resetBtn = toolbar.querySelector(".drag-reset-order");

            expect(toggleBtn).not.toBeNull();
            expect(resetBtn).not.toBeNull();
            expect(toggleBtn?.getAttribute("data-testid")).toBe("drag-mode-toggle");
            expect(resetBtn?.getAttribute("data-testid")).toBe("drag-reset-order");
        });

        it("should insert toolbar when container exists", () => {
            document.body.innerHTML = '<div class="film_list-wrap"></div>';

            insertDragToolbar();

            const toolbar = document.querySelector(".anime-list-drag-toolbar");
            expect(toolbar).not.toBeNull();
        });

        it("should not insert toolbar when container does not exist", () => {
            insertDragToolbar();

            const toolbar = document.querySelector(".anime-list-drag-toolbar");
            expect(toolbar).toBeNull();
        });

        it("should not insert duplicate toolbar", () => {
            document.body.innerHTML = '<div class="film_list-wrap"></div>';

            insertDragToolbar();
            insertDragToolbar();

            const toolbars = document.querySelectorAll(".anime-list-drag-toolbar");
            expect(toolbars).toHaveLength(1);
        });
    });

    describe("Drag Mode Toggle", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="film_list-wrap">
                    <div class="flw-item">
                        <div class="film-name"><a title="Anime" href="/watch/anime-123">Anime</a></div>
                    </div>
                </div>
            `;
            insertDragToolbar();
        });

        it("should enable drag mode", () => {
            enableDragMode();

            const item = document.querySelector(".flw-item");
            expect(item?.getAttribute("draggable")).toBe("true");
        });

        it("should update toolbar UI when enabled", () => {
            enableDragMode();

            const toggleBtn = document.querySelector(".drag-mode-toggle");
            const resetBtn = document.querySelector(".drag-reset-order") as HTMLElement;

            expect(toggleBtn?.classList.contains("active")).toBe(true);
            expect(toggleBtn?.querySelector(".button-text")?.textContent).toBe("Done");
            expect(resetBtn?.style.display).toBe("flex");
        });

        it("should disable drag mode", () => {
            enableDragMode();
            disableDragMode();

            const item = document.querySelector(".flw-item");
            expect(item?.getAttribute("draggable")).toBeNull();
        });

        it("should update toolbar UI when disabled", () => {
            enableDragMode();
            disableDragMode();

            const toggleBtn = document.querySelector(".drag-mode-toggle");
            const resetBtn = document.querySelector(".drag-reset-order") as HTMLElement;

            expect(toggleBtn?.classList.contains("active")).toBe(false);
            expect(toggleBtn?.querySelector(".button-text")?.textContent).toBe("Reorder");
            expect(resetBtn?.style.display).toBe("none");
        });

        it("should toggle drag mode", () => {
            toggleDragMode();
            expect(document.querySelector(".flw-item")?.getAttribute("draggable")).toBe("true");

            toggleDragMode();
            expect(document.querySelector(".flw-item")?.getAttribute("draggable")).toBeNull();
        });
    });

    describe("Drag Event Handlers", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="film_list-wrap">
                    <div class="flw-item" id="item1">
                        <div class="film-name"><a title="A" href="/watch/anime-a-111">A</a></div>
                    </div>
                    <div class="flw-item" id="item2">
                        <div class="film-name"><a title="B" href="/watch/anime-b-222">B</a></div>
                    </div>
                </div>
            `;
            insertDragToolbar();
            enableDragMode();
        });

        // Helper to create drag events (DragEvent not available in jsdom)
        const createDragEvent = (type: string) => {
            const event = new Event(type, { bubbles: true, cancelable: true });
            return event;
        };

        it("should add dragging class on dragstart", () => {
            const item = document.querySelector("#item1") as HTMLElement;
            item.dispatchEvent(createDragEvent("dragstart"));
            expect(item.classList.contains("dragging")).toBe(true);
        });

        it("should add drag-over class on dragenter", () => {
            const item = document.querySelector("#item2") as HTMLElement;
            item.dispatchEvent(createDragEvent("dragenter"));
            expect(item.classList.contains("drag-over")).toBe(true);
        });

        it("should remove drag-over class on dragleave", () => {
            const item = document.querySelector("#item2") as HTMLElement;
            item.classList.add("drag-over");
            item.dispatchEvent(createDragEvent("dragleave"));
            expect(item.classList.contains("drag-over")).toBe(false);
        });

        it("should remove dragging class on dragend", () => {
            const item = document.querySelector("#item1") as HTMLElement;
            // First trigger dragstart to set draggedElement
            item.dispatchEvent(createDragEvent("dragstart"));
            expect(item.classList.contains("dragging")).toBe(true);

            // Then trigger dragend to clean up
            item.dispatchEvent(createDragEvent("dragend"));
            expect(item.classList.contains("dragging")).toBe(false);
        });
    });

    describe("Order Restoration", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="film_list-wrap">
                    <div class="flw-item" id="item1">
                        <div class="film-name"><a title="A" href="/watch/anime-a-111">A</a></div>
                    </div>
                    <div class="flw-item" id="item2">
                        <div class="film-name"><a title="B" href="/watch/anime-b-222">B</a></div>
                    </div>
                    <div class="flw-item" id="item3">
                        <div class="film-name"><a title="C" href="/watch/anime-c-333">C</a></div>
                    </div>
                </div>
            `;
        });

        it("should not change order when no saved order exists", async () => {
            mockGet.mockResolvedValue({});

            await restoreTileOrder();

            const items = document.querySelectorAll(".flw-item");
            expect(items[0].id).toBe("item1");
            expect(items[1].id).toBe("item2");
            expect(items[2].id).toBe("item3");
        });

        it("should restore order from saved order", async () => {
            mockGet.mockResolvedValue({
                [StorageKeys.TILE_ORDER]: {
                    animeIds: ["333", "111", "222"],
                    lastUpdated: "2024-01-01T00:00:00.000Z",
                },
            });

            await restoreTileOrder();

            const items = document.querySelectorAll(".flw-item");
            expect(items[0].id).toBe("item3"); // 333
            expect(items[1].id).toBe("item1"); // 111
            expect(items[2].id).toBe("item2"); // 222
        });

        it("should place new tiles at the end", async () => {
            mockGet.mockResolvedValue({
                [StorageKeys.TILE_ORDER]: {
                    animeIds: ["333", "111"], // 222 is not in saved order
                    lastUpdated: "2024-01-01T00:00:00.000Z",
                },
            });

            await restoreTileOrder();

            const items = document.querySelectorAll(".flw-item");
            expect(items[0].id).toBe("item3"); // 333
            expect(items[1].id).toBe("item1"); // 111
            expect(items[2].id).toBe("item2"); // 222 (new, at end)
        });
    });

    describe("Reset Order", () => {
        it("should clear storage and reload page", async () => {
            vi.useFakeTimers();
            mockRemove.mockResolvedValue(undefined);

            // Mock window.location.reload
            const reloadMock = vi.fn();
            Object.defineProperty(window, "location", {
                value: { reload: reloadMock },
                writable: true,
            });

            await resetTileOrder();

            expect(mockRemove).toHaveBeenCalledWith(StorageKeys.TILE_ORDER);

            // Advance timers to trigger reload
            await vi.advanceTimersByTimeAsync(500);
            expect(reloadMock).toHaveBeenCalled();

            vi.useRealTimers();
        });
    });

    describe("Initialize Drag and Drop", () => {
        it("should insert toolbar and restore order", async () => {
            document.body.innerHTML = '<div class="film_list-wrap"></div>';
            mockGet.mockResolvedValue({});

            await initializeDragAndDrop();

            const toolbar = document.querySelector(".anime-list-drag-toolbar");
            expect(toolbar).not.toBeNull();
        });
    });
});
