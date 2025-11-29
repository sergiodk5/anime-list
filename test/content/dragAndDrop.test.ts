import { beforeEach, describe, expect, it, vi } from "vitest";
import { StorageKeys } from "../../src/commons/models";
import { StorageAdapter } from "../../src/commons/adapters/StorageAdapter";
import {
    clearTileOrder,
    createDragToolbar,
    disableDragMode,
    enableDragMode,
    getCurrentTileOrder,
    initializeDragAndDrop,
    insertDragToolbar,
    loadTileOrder,
    makeTileDraggable,
    removeTileDraggable,
    resetTileOrder,
    restoreTileOrder,
    saveTileOrder,
    toggleDragMode,
} from "../../src/content/index";

// Mock StorageAdapter
vi.mock("../../src/commons/adapters/StorageAdapter", () => ({
    StorageAdapter: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
    },
}));

const mockGet = StorageAdapter.get as ReturnType<typeof vi.fn>;
const mockSet = StorageAdapter.set as ReturnType<typeof vi.fn>;
const mockRemove = StorageAdapter.remove as ReturnType<typeof vi.fn>;

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
            mockGet.mockResolvedValue(mockOrder);

            const result = await loadTileOrder();

            expect(mockGet).toHaveBeenCalledWith(StorageKeys.TILE_ORDER);
            expect(result).toEqual(mockOrder);
        });

        it("should return null when no tile order exists", async () => {
            mockGet.mockResolvedValue(null);

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

            expect(mockSet).toHaveBeenCalledWith(
                StorageKeys.TILE_ORDER,
                expect.objectContaining({
                    animeIds,
                    lastUpdated: expect.any(String),
                }),
            );
        });

        it("should handle storage errors when saving", async () => {
            const consoleErrorSpy = vi.spyOn(console, "error");
            mockSet.mockRejectedValue(new Error("Storage error"));

            // Should not throw
            await saveTileOrder(["123"]);

            // Should log the error
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error saving tile order:", expect.any(Error));
            consoleErrorSpy.mockRestore();
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
            await clearTileOrder();

            // Should log the error
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error clearing tile order:", expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });

    describe("getCurrentTileOrder", () => {
        it("should return empty array when no container exists", () => {
            const result = getCurrentTileOrder();
            expect(result).toEqual([]);
        });

        it("should extract anime IDs from DOM elements in order", () => {
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

            expect(result).toEqual(["123", "456"]);
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

        it("should handle dragover event", () => {
            const item = document.querySelector("#item1") as HTMLElement;
            const event = createDragEvent("dragover");
            const preventDefaultSpy = vi.spyOn(event, "preventDefault");
            const stopPropagationSpy = vi.spyOn(event, "stopPropagation");

            item.dispatchEvent(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
        });

        it("should handle drop event on different element", async () => {
            vi.useFakeTimers();
            mockSet.mockResolvedValue(undefined);

            const item1 = document.querySelector("#item1") as HTMLElement;
            const item2 = document.querySelector("#item2") as HTMLElement;

            // Start dragging item1
            item1.dispatchEvent(createDragEvent("dragstart"));

            // Drop on item2
            const dropEvent = createDragEvent("drop");
            item2.dispatchEvent(dropEvent);

            // Advance timers to trigger debounced save
            await vi.advanceTimersByTimeAsync(600);

            expect(mockSet).toHaveBeenCalled();
            vi.useRealTimers();
        });

        it("should not reorder when dropping on same element", () => {
            const item1 = document.querySelector("#item1") as HTMLElement;
            const container = document.querySelector(".film_list-wrap") as HTMLElement;
            const initialOrder = Array.from(container.children).map((el) => el.id);

            // Start dragging item1
            item1.dispatchEvent(createDragEvent("dragstart"));

            // Drop on same element
            item1.dispatchEvent(createDragEvent("drop"));

            const finalOrder = Array.from(container.children).map((el) => el.id);
            expect(finalOrder).toEqual(initialOrder);
        });
    });

    describe("makeTileDraggable and removeTileDraggable", () => {
        beforeEach(() => {
            // Disable any existing drag mode first
            disableDragMode();
            document.body.innerHTML = `
                <div class="film_list-wrap">
                    <div class="flw-item" id="item1">
                        <div class="film-name"><a title="A" href="/watch/anime-a-111">A</a></div>
                    </div>
                </div>
            `;
        });

        it("should make element draggable", () => {
            const item = document.querySelector("#item1") as HTMLElement;
            // Fresh element should not be draggable
            expect(item.hasAttribute("draggable")).toBe(false);

            makeTileDraggable(item);

            expect(item.getAttribute("draggable")).toBe("true");
        });

        it("should not add duplicate listeners when called twice", () => {
            const item = document.querySelector("#item1") as HTMLElement;

            makeTileDraggable(item);
            makeTileDraggable(item); // Call again - should be no-op due to guard

            // Should still only have draggable="true" once
            expect(item.getAttribute("draggable")).toBe("true");
        });

        it("should remove draggable attribute and classes", () => {
            const item = document.querySelector("#item1") as HTMLElement;
            makeTileDraggable(item);
            item.classList.add("drag-over", "dragging");

            removeTileDraggable(item);

            expect(item.getAttribute("draggable")).toBeNull();
            expect(item.classList.contains("drag-over")).toBe(false);
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
            mockGet.mockResolvedValue(null);

            await restoreTileOrder();

            const items = document.querySelectorAll(".flw-item");
            expect(items[0].id).toBe("item1");
            expect(items[1].id).toBe("item2");
            expect(items[2].id).toBe("item3");
        });

        it("should restore order from saved order", async () => {
            mockGet.mockResolvedValue({
                animeIds: ["333", "111", "222"],
                lastUpdated: "2024-01-01T00:00:00.000Z",
            });

            await restoreTileOrder();

            const items = document.querySelectorAll(".flw-item");
            expect(items[0].id).toBe("item3"); // 333
            expect(items[1].id).toBe("item1"); // 111
            expect(items[2].id).toBe("item2"); // 222
        });

        it("should place new tiles at the end", async () => {
            mockGet.mockResolvedValue({
                animeIds: ["333", "111"], // 222 is not in saved order
                lastUpdated: "2024-01-01T00:00:00.000Z",
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
            mockGet.mockResolvedValue(null);

            await initializeDragAndDrop();

            const toolbar = document.querySelector(".anime-list-drag-toolbar");
            expect(toolbar).not.toBeNull();
        });

        it("should not initialize if container does not exist", async () => {
            document.body.innerHTML = "";
            mockGet.mockResolvedValue(null);

            await initializeDragAndDrop();

            const toolbar = document.querySelector(".anime-list-drag-toolbar");
            expect(toolbar).toBeNull();
        });
    });

    describe("Keyboard Navigation", () => {
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
            insertDragToolbar();
            enableDragMode();
        });

        const createKeyboardEvent = (key: string) => {
            return new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
        };

        it("should select tile on Enter key", () => {
            const item = document.querySelector("#item1") as HTMLElement;
            item.dispatchEvent(createKeyboardEvent("Enter"));
            expect(item.classList.contains("keyboard-selected")).toBe(true);
        });

        it("should select tile on Space key", () => {
            const item = document.querySelector("#item1") as HTMLElement;
            item.dispatchEvent(createKeyboardEvent(" "));
            expect(item.classList.contains("keyboard-selected")).toBe(true);
        });

        it("should deselect tile on second Enter", () => {
            const item = document.querySelector("#item1") as HTMLElement;
            item.dispatchEvent(createKeyboardEvent("Enter"));
            expect(item.classList.contains("keyboard-selected")).toBe(true);

            item.dispatchEvent(createKeyboardEvent("Enter"));
            expect(item.classList.contains("keyboard-selected")).toBe(false);
        });

        it("should cancel selection on Escape", () => {
            const item = document.querySelector("#item1") as HTMLElement;
            item.dispatchEvent(createKeyboardEvent("Enter"));
            expect(item.classList.contains("keyboard-selected")).toBe(true);

            item.dispatchEvent(createKeyboardEvent("Escape"));
            expect(item.classList.contains("keyboard-selected")).toBe(false);
        });

        it("should navigate with ArrowDown", () => {
            const item1 = document.querySelector("#item1") as HTMLElement;
            const item2 = document.querySelector("#item2") as HTMLElement;
            const focusSpy = vi.spyOn(item2, "focus");

            item1.dispatchEvent(createKeyboardEvent("ArrowDown"));

            expect(focusSpy).toHaveBeenCalled();
        });

        it("should navigate with ArrowUp", () => {
            const item1 = document.querySelector("#item1") as HTMLElement;
            const item2 = document.querySelector("#item2") as HTMLElement;
            const focusSpy = vi.spyOn(item1, "focus");

            item2.dispatchEvent(createKeyboardEvent("ArrowUp"));

            expect(focusSpy).toHaveBeenCalled();
        });

        it("should move selected tile with ArrowDown", async () => {
            vi.useFakeTimers();
            mockSet.mockResolvedValue(undefined);

            const item1 = document.querySelector("#item1") as HTMLElement;

            // Select item1
            item1.dispatchEvent(createKeyboardEvent("Enter"));

            // Move down
            item1.dispatchEvent(createKeyboardEvent("ArrowDown"));

            await vi.advanceTimersByTimeAsync(600);

            const items = document.querySelectorAll(".flw-item");
            expect(items[0].id).toBe("item2");
            expect(items[1].id).toBe("item1");

            vi.useRealTimers();
        });

        it("should not navigate past first item with ArrowUp", () => {
            const item1 = document.querySelector("#item1") as HTMLElement;
            const focusSpy = vi.spyOn(item1, "focus");

            item1.dispatchEvent(createKeyboardEvent("ArrowUp"));

            // Should not call focus since we're at the first item
            expect(focusSpy).not.toHaveBeenCalled();
        });

        it("should not navigate past last item with ArrowDown", () => {
            const item3 = document.querySelector("#item3") as HTMLElement;

            // Store current focus state
            item3.dispatchEvent(createKeyboardEvent("ArrowDown"));

            // Item3 should still be in place (no crash)
            expect(document.querySelector("#item3")).not.toBeNull();
        });
    });

    describe("Drop with drag-over cleanup", () => {
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

        it("should clean up drag-over classes on dragend", () => {
            const item1 = document.querySelector("#item1") as HTMLElement;
            const item2 = document.querySelector("#item2") as HTMLElement;

            // Add drag-over to item2
            item2.classList.add("drag-over");

            // Start drag on item1
            item1.dispatchEvent(new Event("dragstart", { bubbles: true }));

            // End drag
            item1.dispatchEvent(new Event("dragend", { bubbles: true }));

            expect(item2.classList.contains("drag-over")).toBe(false);
        });

        it("should debounce multiple rapid drops", async () => {
            vi.useFakeTimers();
            mockSet.mockResolvedValue(undefined);

            const item1 = document.querySelector("#item1") as HTMLElement;
            const item2 = document.querySelector("#item2") as HTMLElement;

            // First drag and drop
            item1.dispatchEvent(new Event("dragstart", { bubbles: true }));
            item2.dispatchEvent(new Event("drop", { bubbles: true }));

            // Second drag and drop quickly (should clear previous timeout)
            item2.dispatchEvent(new Event("dragstart", { bubbles: true }));
            item1.dispatchEvent(new Event("drop", { bubbles: true }));

            // Only one save should happen after debounce
            await vi.advanceTimersByTimeAsync(600);

            // Should have been called (debounced)
            expect(mockSet).toHaveBeenCalled();

            vi.useRealTimers();
        });
    });

    describe("Move tile with Enter to another position", () => {
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
            insertDragToolbar();
            enableDragMode();
        });

        const createKeyboardEvent = (key: string) => {
            return new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
        };

        it("should move selected tile to another position with Enter", async () => {
            vi.useFakeTimers();
            mockSet.mockResolvedValue(undefined);

            const item1 = document.querySelector("#item1") as HTMLElement;
            const item3 = document.querySelector("#item3") as HTMLElement;

            // Select item1
            item1.dispatchEvent(createKeyboardEvent("Enter"));
            expect(item1.classList.contains("keyboard-selected")).toBe(true);

            // Press Enter on item3 to move item1 there
            item3.dispatchEvent(createKeyboardEvent("Enter"));

            await vi.advanceTimersByTimeAsync(600);

            // item1 should now be after item3
            const items = document.querySelectorAll(".flw-item");
            expect(items[2].id).toBe("item1");

            vi.useRealTimers();
        });

        it("should handle ArrowLeft same as ArrowUp", () => {
            const item2 = document.querySelector("#item2") as HTMLElement;
            const item1 = document.querySelector("#item1") as HTMLElement;
            const focusSpy = vi.spyOn(item1, "focus");

            item2.dispatchEvent(createKeyboardEvent("ArrowLeft"));

            expect(focusSpy).toHaveBeenCalled();
        });

        it("should handle ArrowRight same as ArrowDown", () => {
            const item1 = document.querySelector("#item1") as HTMLElement;
            const item2 = document.querySelector("#item2") as HTMLElement;
            const focusSpy = vi.spyOn(item2, "focus");

            item1.dispatchEvent(createKeyboardEvent("ArrowRight"));

            expect(focusSpy).toHaveBeenCalled();
        });

        it("should move selected tile up with ArrowUp", async () => {
            vi.useFakeTimers();
            mockSet.mockResolvedValue(undefined);

            const item2 = document.querySelector("#item2") as HTMLElement;

            // Select item2
            item2.dispatchEvent(createKeyboardEvent("Enter"));

            // Move up
            item2.dispatchEvent(createKeyboardEvent("ArrowUp"));

            await vi.advanceTimersByTimeAsync(600);

            const items = document.querySelectorAll(".flw-item");
            expect(items[0].id).toBe("item2");
            expect(items[1].id).toBe("item1");

            vi.useRealTimers();
        });
    });

    describe("Drop position calculations", () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div class="film_list-wrap">
                    <div class="flw-item" id="item1" style="width: 200px; height: 100px;">
                        <div class="film-name"><a title="A" href="/watch/anime-a-111">A</a></div>
                    </div>
                    <div class="flw-item" id="item2" style="width: 200px; height: 100px;">
                        <div class="film-name"><a title="B" href="/watch/anime-b-222">B</a></div>
                    </div>
                </div>
            `;
            insertDragToolbar();
            enableDragMode();
        });

        it("should handle horizontal layout drop (before position)", async () => {
            vi.useFakeTimers();
            mockSet.mockResolvedValue(undefined);

            const item1 = document.querySelector("#item1") as HTMLElement;
            const item2 = document.querySelector("#item2") as HTMLElement;

            // Mock getBoundingClientRect for horizontal layout (width > height)
            vi.spyOn(item2, "getBoundingClientRect").mockReturnValue({
                width: 200,
                height: 100,
                left: 100,
                top: 0,
                right: 300,
                bottom: 100,
                x: 100,
                y: 0,
                toJSON: () => ({}),
            });

            // Start drag on item1
            item1.dispatchEvent(new Event("dragstart", { bubbles: true }));

            // Create drop event with clientX in the left half (before position)
            const dropEvent = new Event("drop", { bubbles: true, cancelable: true }) as any;
            dropEvent.clientX = 150; // Left of center (100 + 200/2 = 200)
            dropEvent.clientY = 50;
            dropEvent.stopPropagation = vi.fn();
            dropEvent.preventDefault = vi.fn();

            item2.dispatchEvent(dropEvent);

            await vi.advanceTimersByTimeAsync(600);
            expect(mockSet).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it("should handle horizontal layout drop (after position)", async () => {
            vi.useFakeTimers();
            mockSet.mockResolvedValue(undefined);

            const item1 = document.querySelector("#item1") as HTMLElement;
            const item2 = document.querySelector("#item2") as HTMLElement;

            // Mock getBoundingClientRect for horizontal layout (width > height)
            vi.spyOn(item2, "getBoundingClientRect").mockReturnValue({
                width: 200,
                height: 100,
                left: 100,
                top: 0,
                right: 300,
                bottom: 100,
                x: 100,
                y: 0,
                toJSON: () => ({}),
            });

            // Start drag on item1
            item1.dispatchEvent(new Event("dragstart", { bubbles: true }));

            // Create drop event with clientX in the right half (after position)
            const dropEvent = new Event("drop", { bubbles: true, cancelable: true }) as any;
            dropEvent.clientX = 250; // Right of center
            dropEvent.clientY = 50;
            dropEvent.stopPropagation = vi.fn();
            dropEvent.preventDefault = vi.fn();

            item2.dispatchEvent(dropEvent);

            await vi.advanceTimersByTimeAsync(600);
            expect(mockSet).toHaveBeenCalled();

            vi.useRealTimers();
        });
    });
});
