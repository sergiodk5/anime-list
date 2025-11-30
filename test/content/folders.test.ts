// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock chrome API before importing module
vi.mock("@/commons/services", () => ({
    AnimeService: vi.fn().mockImplementation(() => ({
        getAnimeStatus: vi.fn().mockResolvedValue({
            isTracked: false,
            isPlanned: false,
            isHidden: false,
            progress: null,
        }),
        addToPlanToWatch: vi.fn().mockResolvedValue({ success: true }),
        removeFromPlanToWatch: vi.fn().mockResolvedValue({ success: true }),
        startWatching: vi.fn().mockResolvedValue({ success: true }),
        stopWatching: vi.fn().mockResolvedValue({ success: true }),
        hideAnime: vi.fn().mockResolvedValue({ success: true }),
        unhideAnime: vi.fn().mockResolvedValue({ success: true }),
        updateEpisodeProgress: vi.fn().mockResolvedValue({ success: true }),
        clearAllHidden: vi.fn().mockResolvedValue({ success: true, message: "Cleared" }),
    })),
}));

// Mock StorageAdapter
const mockStorage: Record<string, unknown> = {};
vi.mock("@/commons/adapters/StorageAdapter", () => ({
    StorageAdapter: {
        get: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
        set: vi.fn((key: string, value: unknown) => {
            mockStorage[key] = value;
            return Promise.resolve();
        }),
        remove: vi.fn((key: string) => {
            delete mockStorage[key];
            return Promise.resolve();
        }),
    },
}));

// Import after mocks
import {
    createFolderElement,
    createFolder,
    renameFolder,
    changeFolderColor,
    deleteFolder,
    loadFolderOrder,
    saveFolderOrder,
    updateFolderEmptyState,
    makeFolderDraggable,
    removeFolderDraggable,
    restoreFolderOrder,
} from "@/content/index";
import type { Folder, FolderOrder } from "@/commons/models";
import { StorageAdapter } from "@/commons/adapters/StorageAdapter";

describe("Folder Functionality", () => {
    beforeEach(() => {
        // Reset storage
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

        // Setup DOM
        document.body.innerHTML = `
            <div class="film_list-wrap">
                <div class="flw-item" data-testid="anime-item-1">
                    <div class="film-poster"></div>
                    <div class="film-name"><a href="/watch/anime-one-123" title="Anime One">Anime One</a></div>
                </div>
                <div class="flw-item" data-testid="anime-item-2">
                    <div class="film-poster"></div>
                    <div class="film-name"><a href="/watch/anime-two-456" title="Anime Two">Anime Two</a></div>
                </div>
            </div>
        `;

        vi.clearAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    describe("createFolderElement", () => {
        it("should create a folder element with correct structure", () => {
            const folder: Folder = {
                id: "folder-123",
                name: "My Folder",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);

            expect(element.classList.contains("anime-folder")).toBe(true);
            expect(element.getAttribute("data-folder-id")).toBe("folder-123");
            expect(element.getAttribute("data-testid")).toBe("anime-folder");
            expect(element.style.border).toBe("3px solid rgb(255, 215, 0)");
        });

        it("should have proper ARIA attributes for accessibility", () => {
            const folder: Folder = {
                id: "folder-456",
                name: "Accessible Folder",
                borderColor: "#FF6B6B",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);

            expect(element.getAttribute("role")).toBe("region");
            expect(element.getAttribute("aria-label")).toBe("Folder: Accessible Folder");

            const header = element.querySelector(".anime-folder-header");
            expect(header?.getAttribute("role")).toBe("toolbar");
            expect(header?.getAttribute("aria-label")).toBe("Folder controls");

            const content = element.querySelector(".anime-folder-content");
            expect(content?.getAttribute("role")).toBe("list");
            expect(content?.getAttribute("aria-label")).toBe("Folder contents");
            expect(content?.getAttribute("aria-dropeffect")).toBe("move");
        });

        it("should have accessible buttons with proper labels", () => {
            const folder: Folder = {
                id: "folder-789",
                name: "Button Test",
                borderColor: "#4ECDC4",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);

            const colorBtn = element.querySelector(".folder-color-btn");
            expect(colorBtn?.getAttribute("aria-label")).toBe("Change folder color");
            expect(colorBtn?.getAttribute("type")).toBe("button");
            expect(colorBtn?.getAttribute("aria-haspopup")).toBe("true");

            const deleteBtn = element.querySelector(".folder-delete-btn");
            expect(deleteBtn?.getAttribute("aria-label")).toBe("Delete folder");
            expect(deleteBtn?.getAttribute("type")).toBe("button");
        });

        it("should have accessible name input", () => {
            const folder: Folder = {
                id: "folder-input",
                name: "Input Test",
                borderColor: "#45B7D1",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);

            const nameInput = element.querySelector(".anime-folder-name-input") as HTMLInputElement;
            expect(nameInput?.getAttribute("aria-label")).toBe("Edit folder name");
            expect(nameInput?.getAttribute("type")).toBe("text");
            expect(nameInput?.getAttribute("maxlength")).toBe("50");
            expect(nameInput?.value).toBe("Input Test");
        });

        it("should prevent XSS by not creating extra elements from malicious names", () => {
            const folder: Folder = {
                id: "folder-xss",
                name: "<img src=x onerror=alert(1)>",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);

            // XSS prevention verification:
            // 1. No img element should be created from the malicious name
            expect(element.querySelector("img")).toBeNull();

            // 2. The folder should only have expected elements, no injected ones
            const allElements = element.querySelectorAll("*");
            const tagNames = Array.from(allElements).map((el) => el.tagName.toLowerCase());
            expect(tagNames).not.toContain("img");
            expect(tagNames).not.toContain("script");

            // 3. Input element should exist and contain the value (safely as text)
            const nameInput = element.querySelector(".anime-folder-name-input") as HTMLInputElement;
            expect(nameInput).toBeTruthy();
            expect(nameInput.value).toBe("<img src=x onerror=alert(1)>");
        });

        it("should have empty placeholder with aria-live", () => {
            const folder: Folder = {
                id: "folder-empty",
                name: "Empty Folder",
                borderColor: "#96CEB4",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            const placeholder = element.querySelector(".folder-empty-placeholder");

            expect(placeholder?.getAttribute("aria-live")).toBe("polite");
            expect(placeholder?.textContent).toBe("Drop anime here");
        });
    });

    describe("loadFolderOrder", () => {
        it("should return empty folder order when storage is empty", async () => {
            const result = await loadFolderOrder();

            expect(result.folders).toEqual([]);
            expect(result.rootItems).toEqual([]);
            expect(result.folderContents).toEqual({});
        });

        it("should return stored folder order when available", async () => {
            const storedOrder: FolderOrder = {
                folders: [{ id: "folder-1", name: "Test", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-1", "anime-123"],
                folderContents: { "folder-1": ["anime-456"] },
                lastUpdated: "2024-01-01",
            };
            mockStorage["folderOrder"] = storedOrder;

            const result = await loadFolderOrder();

            expect(result).toEqual(storedOrder);
        });

        it("should migrate from tileOrder when folderOrder is empty", async () => {
            mockStorage["tileOrder"] = {
                animeIds: ["anime-1", "anime-2", "anime-3"],
                lastUpdated: "2024-01-01",
            };

            const result = await loadFolderOrder();

            expect(result.folders).toEqual([]);
            expect(result.rootItems).toEqual(["anime-1", "anime-2", "anime-3"]);
            expect(result.folderContents).toEqual({});
        });
    });

    describe("saveFolderOrder", () => {
        it("should save folder order to storage", async () => {
            const folderOrder: FolderOrder = {
                folders: [{ id: "folder-1", name: "Test", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-1"],
                folderContents: { "folder-1": [] },
                lastUpdated: "",
            };

            await saveFolderOrder(folderOrder);

            expect(StorageAdapter.set).toHaveBeenCalledWith("folderOrder", expect.objectContaining({
                folders: folderOrder.folders,
                rootItems: folderOrder.rootItems,
            }));
        });

        it("should update lastUpdated timestamp", async () => {
            const folderOrder: FolderOrder = {
                folders: [],
                rootItems: [],
                folderContents: {},
                lastUpdated: "",
            };

            await saveFolderOrder(folderOrder);

            expect(StorageAdapter.set).toHaveBeenCalledWith(
                "folderOrder",
                expect.objectContaining({
                    lastUpdated: expect.any(String),
                }),
            );
        });
    });

    describe("createFolder", () => {
        it("should create a new folder with default values", async () => {
            const folder = await createFolder();

            expect(folder.id).toMatch(/^folder-\d+-[a-z0-9]+$/);
            expect(folder.name).toBe("New Folder");
            expect(folder.borderColor).toMatch(/^#[A-F0-9]{6}$/i);
            expect(folder.createdAt).toBeTruthy();
        });

        it("should add folder to DOM", async () => {
            await createFolder();

            const folderEl = document.querySelector(".anime-folder");
            expect(folderEl).toBeTruthy();
            expect(folderEl?.getAttribute("data-testid")).toBe("anime-folder");
        });

        it("should save folder to storage", async () => {
            await createFolder();

            expect(StorageAdapter.set).toHaveBeenCalledWith(
                "folderOrder",
                expect.objectContaining({
                    folders: expect.arrayContaining([
                        expect.objectContaining({ name: "New Folder" }),
                    ]),
                }),
            );
        });
    });

    describe("renameFolder", () => {
        it("should rename folder in storage", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-1", name: "Old Name", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-1"],
                folderContents: { "folder-1": [] },
                lastUpdated: "2024-01-01",
            };

            await renameFolder("folder-1", "New Name");

            expect(StorageAdapter.set).toHaveBeenCalledWith(
                "folderOrder",
                expect.objectContaining({
                    folders: expect.arrayContaining([
                        expect.objectContaining({ id: "folder-1", name: "New Name" }),
                    ]),
                }),
            );
        });

        it("should not save if name is unchanged", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-1", name: "Same Name", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-1"],
                folderContents: { "folder-1": [] },
                lastUpdated: "2024-01-01",
            };

            await renameFolder("folder-1", "Same Name");

            expect(StorageAdapter.set).not.toHaveBeenCalled();
        });

        it("should update aria-label on folder element", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-aria", name: "Old", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: [],
                folderContents: {},
                lastUpdated: "2024-01-01",
            };

            // Create folder element in DOM
            const container = document.querySelector(".film_list-wrap");
            const folderEl = document.createElement("div");
            folderEl.setAttribute("data-folder-id", "folder-aria");
            folderEl.setAttribute("aria-label", "Folder: Old");
            container?.appendChild(folderEl);

            await renameFolder("folder-aria", "Updated Name");

            expect(folderEl.getAttribute("aria-label")).toBe("Folder: Updated Name");
        });
    });

    describe("changeFolderColor", () => {
        it("should update folder color in storage", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-1", name: "Test", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: [],
                folderContents: {},
                lastUpdated: "2024-01-01",
            };

            await changeFolderColor("folder-1", "#FF6B6B");

            expect(StorageAdapter.set).toHaveBeenCalledWith(
                "folderOrder",
                expect.objectContaining({
                    folders: expect.arrayContaining([
                        expect.objectContaining({ id: "folder-1", borderColor: "#FF6B6B" }),
                    ]),
                }),
            );
        });

        it("should update folder border in DOM", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-dom", name: "Test", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: [],
                folderContents: {},
                lastUpdated: "2024-01-01",
            };

            const container = document.querySelector(".film_list-wrap");
            const folderEl = document.createElement("div");
            folderEl.setAttribute("data-folder-id", "folder-dom");
            folderEl.style.border = "3px solid #FFD700";
            container?.appendChild(folderEl);

            await changeFolderColor("folder-dom", "#4ECDC4");

            expect(folderEl.style.border).toBe("3px solid rgb(78, 205, 196)");
        });
    });

    describe("deleteFolder", () => {
        it("should remove folder from storage", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-1", name: "Test", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-1"],
                folderContents: { "folder-1": ["anime-1", "anime-2"] },
                lastUpdated: "2024-01-01",
            };

            await deleteFolder("folder-1");

            expect(StorageAdapter.set).toHaveBeenCalledWith(
                "folderOrder",
                expect.objectContaining({
                    folders: [],
                    rootItems: ["anime-1", "anime-2"], // Items moved to root
                }),
            );
        });

        it("should remove folder element from DOM", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-remove", name: "Test", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-remove"],
                folderContents: { "folder-remove": [] },
                lastUpdated: "2024-01-01",
            };

            const container = document.querySelector(".film_list-wrap");
            const folderEl = document.createElement("div");
            folderEl.className = "anime-folder";
            folderEl.setAttribute("data-folder-id", "folder-remove");
            container?.appendChild(folderEl);

            await deleteFolder("folder-remove");

            expect(document.querySelector('[data-folder-id="folder-remove"]')).toBeNull();
        });

        it("should move folder contents back to root container", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-contents", name: "Test", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-contents"],
                folderContents: { "folder-contents": ["anime-inside"] },
                lastUpdated: "2024-01-01",
            };

            const container = document.querySelector(".film_list-wrap");
            const folderEl = document.createElement("div");
            folderEl.className = "anime-folder";
            folderEl.setAttribute("data-folder-id", "folder-contents");

            const tileInside = document.createElement("div");
            tileInside.className = "flw-item";
            tileInside.setAttribute("data-testid", "tile-inside-folder");
            folderEl.appendChild(tileInside);

            container?.appendChild(folderEl);

            await deleteFolder("folder-contents");

            // Tile should be in root container, not in folder
            const movedTile = container?.querySelector('[data-testid="tile-inside-folder"]');
            expect(movedTile).toBeTruthy();
            expect(movedTile?.closest(".anime-folder")).toBeNull();
        });
    });

    describe("updateFolderEmptyState", () => {
        it("should show placeholder for empty folder", () => {
            const container = document.querySelector(".film_list-wrap");
            const folderEl = document.createElement("div");
            folderEl.className = "anime-folder";
            folderEl.setAttribute("data-folder-id", "folder-empty");
            folderEl.innerHTML = '<div class="anime-folder-content"><div class="folder-empty-placeholder" style="display: none;">Drop here</div></div>';
            container?.appendChild(folderEl);

            updateFolderEmptyState("folder-empty");

            const placeholder = folderEl.querySelector(".folder-empty-placeholder") as HTMLElement;
            expect(placeholder.style.display).toBe("flex");
        });

        it("should add empty-state class for empty folder", () => {
            const container = document.querySelector(".film_list-wrap");
            const folderEl = document.createElement("div");
            folderEl.className = "anime-folder";
            folderEl.setAttribute("data-folder-id", "folder-empty-class");
            folderEl.innerHTML = '<div class="anime-folder-content"><div class="folder-empty-placeholder">Drop here</div></div>';
            container?.appendChild(folderEl);

            updateFolderEmptyState("folder-empty-class");

            const content = folderEl.querySelector(".anime-folder-content");
            expect(content?.classList.contains("empty-state")).toBe(true);
        });

        it("should hide placeholder for folder with items", () => {
            const container = document.querySelector(".film_list-wrap");
            const folderEl = document.createElement("div");
            folderEl.className = "anime-folder";
            folderEl.setAttribute("data-folder-id", "folder-with-items");
            folderEl.innerHTML = `
                <div class="anime-folder-content">
                    <div class="folder-empty-placeholder" style="display: flex;">Drop here</div>
                    <div class="flw-item"></div>
                    <div class="flw-item"></div>
                </div>
            `;
            container?.appendChild(folderEl);

            updateFolderEmptyState("folder-with-items");

            const placeholder = folderEl.querySelector(".folder-empty-placeholder") as HTMLElement;
            expect(placeholder.style.display).toBe("none");
        });

        it("should remove empty-state class for folder with items", () => {
            const container = document.querySelector(".film_list-wrap");
            const folderEl = document.createElement("div");
            folderEl.className = "anime-folder";
            folderEl.setAttribute("data-folder-id", "folder-items-class");
            folderEl.innerHTML = `
                <div class="anime-folder-content empty-state">
                    <div class="folder-empty-placeholder">Drop here</div>
                    <div class="flw-item"></div>
                </div>
            `;
            container?.appendChild(folderEl);

            updateFolderEmptyState("folder-items-class");

            const content = folderEl.querySelector(".anime-folder-content");
            expect(content?.classList.contains("empty-state")).toBe(false);
        });

    });

    describe("makeFolderDraggable / removeFolderDraggable", () => {
        it("should add draggable attributes", () => {
            const folderEl = document.createElement("div");
            folderEl.className = "anime-folder";

            makeFolderDraggable(folderEl);

            expect(folderEl.getAttribute("draggable")).toBe("true");
            expect(folderEl.getAttribute("tabindex")).toBe("0");
            expect(folderEl.getAttribute("role")).toBe("group");
        });

        it("should not add duplicate listeners", () => {
            const folderEl = document.createElement("div");
            folderEl.className = "anime-folder";

            makeFolderDraggable(folderEl);
            makeFolderDraggable(folderEl); // Second call should be no-op

            expect(folderEl.getAttribute("draggable")).toBe("true");
        });

        it("should remove draggable attributes", () => {
            const folderEl = document.createElement("div");
            folderEl.className = "anime-folder";
            folderEl.setAttribute("draggable", "true");
            folderEl.setAttribute("tabindex", "0");
            folderEl.setAttribute("role", "group");
            folderEl.classList.add("drag-over", "dragging");

            removeFolderDraggable(folderEl);

            expect(folderEl.getAttribute("draggable")).toBeNull();
            expect(folderEl.getAttribute("tabindex")).toBeNull();
            expect(folderEl.getAttribute("role")).toBeNull();
            expect(folderEl.classList.contains("drag-over")).toBe(false);
            expect(folderEl.classList.contains("dragging")).toBe(false);
        });
    });

    describe("restoreFolderOrder", () => {
        it("should create folder elements from storage", async () => {
            mockStorage["folderOrder"] = {
                folders: [
                    { id: "folder-restore", name: "Restored Folder", borderColor: "#FFD700", createdAt: "2024-01-01" },
                ],
                rootItems: ["folder:folder-restore", "123"],
                folderContents: { "folder-restore": ["456"] },
                lastUpdated: "2024-01-01",
            };

            // Add a tile that should go into the folder
            const container = document.querySelector(".film_list-wrap");
            const tile456 = document.createElement("div");
            tile456.className = "flw-item";
            tile456.innerHTML = '<div class="film-name"><a href="/watch/anime-456">Anime 456</a></div>';
            container?.appendChild(tile456);

            await restoreFolderOrder();

            const folderEl = document.querySelector('[data-folder-id="folder-restore"]');
            expect(folderEl).toBeTruthy();
            expect(folderEl?.getAttribute("aria-label")).toBe("Folder: Restored Folder");
        });

        it("should fall back to restoreTileOrder when no folders", async () => {
            mockStorage["folderOrder"] = {
                folders: [],
                rootItems: [],
                folderContents: {},
                lastUpdated: "2024-01-01",
            };
            mockStorage["tileOrder"] = {
                animeIds: ["123", "456"],
                lastUpdated: "2024-01-01",
            };

            await restoreFolderOrder();

            // Should not throw and container should still exist
            expect(document.querySelector(".film_list-wrap")).toBeTruthy();
        });
    });

    describe("folder event handlers", () => {
        it("should handle name input blur event to rename folder", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-rename", name: "Original", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-rename"],
                folderContents: {},
                lastUpdated: "2024-01-01",
            };

            const folder: Folder = {
                id: "folder-rename",
                name: "Original",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            const container = document.querySelector(".film_list-wrap");
            container?.appendChild(element);

            const nameInput = element.querySelector(".anime-folder-name-input") as HTMLInputElement;
            nameInput.value = "New Name";
            nameInput.dispatchEvent(new Event("blur"));

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(StorageAdapter.set).toHaveBeenCalled();
        });

        it("should handle enter key press to blur name input", () => {
            const folder: Folder = {
                id: "folder-enter",
                name: "Test",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            const nameInput = element.querySelector(".anime-folder-name-input") as HTMLInputElement;

            const blurSpy = vi.spyOn(nameInput, "blur");
            const keydownEvent = new KeyboardEvent("keydown", { key: "Enter" });
            nameInput.dispatchEvent(keydownEvent);

            expect(blurSpy).toHaveBeenCalled();
        });

        it("should handle delete button click", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-del-btn", name: "To Delete", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-del-btn"],
                folderContents: {},
                lastUpdated: "2024-01-01",
            };

            const folder: Folder = {
                id: "folder-del-btn",
                name: "To Delete",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            const container = document.querySelector(".film_list-wrap");
            container?.appendChild(element);

            const deleteBtn = element.querySelector(".folder-delete-btn") as HTMLButtonElement;
            deleteBtn.click();

            // Wait for async
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(StorageAdapter.set).toHaveBeenCalled();
        });

        it("should handle color button click to show color picker", () => {
            const folder: Folder = {
                id: "folder-color-btn",
                name: "Color Test",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            document.body.appendChild(element);

            const colorBtn = element.querySelector(".folder-color-btn") as HTMLButtonElement;
            colorBtn.click();

            const picker = document.querySelector(".folder-color-picker");
            expect(picker).toBeTruthy();
            expect(picker?.getAttribute("role")).toBe("listbox");

            // Clean up
            document.body.removeChild(element);
            picker?.remove();
        });

        it("should remove existing color picker when opening a new one", () => {
            const folder: Folder = {
                id: "folder-multiple",
                name: "Multiple Pickers",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            document.body.appendChild(element);

            const colorBtn = element.querySelector(".folder-color-btn") as HTMLButtonElement;

            // First click - creates picker
            colorBtn.click();
            expect(document.querySelectorAll(".folder-color-picker").length).toBe(1);

            // Second click - should remove old picker and create new one
            colorBtn.click();
            expect(document.querySelectorAll(".folder-color-picker").length).toBe(1);

            // Clean up
            document.body.removeChild(element);
            document.querySelector(".folder-color-picker")?.remove();
        });

        it("should select color from picker", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-pick", name: "Pick Color", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-pick"],
                folderContents: {},
                lastUpdated: "2024-01-01",
            };

            const folder: Folder = {
                id: "folder-pick",
                name: "Pick Color",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            element.setAttribute("data-folder-id", "folder-pick");
            document.body.appendChild(element);

            const colorBtn = element.querySelector(".folder-color-btn") as HTMLButtonElement;
            colorBtn.click();

            const picker = document.querySelector(".folder-color-picker");
            const colorOption = picker?.querySelector(".color-option") as HTMLButtonElement;
            colorOption?.click();

            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(StorageAdapter.set).toHaveBeenCalled();

            // Clean up
            document.body.removeChild(element);
        });
    });

    describe("folder drop zone structure", () => {
        it("should have folder content with correct attributes for drag drop", () => {
            const folder: Folder = {
                id: "folder-dropzone",
                name: "Drop Zone",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);

            const content = element.querySelector(".anime-folder-content");
            expect(content).toBeTruthy();
            expect(content?.getAttribute("role")).toBe("list");
            expect(content?.getAttribute("aria-dropeffect")).toBe("move");
        });

        it("should have placeholder with aria-live for accessibility", () => {
            const folder: Folder = {
                id: "folder-placeholder",
                name: "Placeholder Test",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            const placeholder = element.querySelector(".folder-empty-placeholder");

            expect(placeholder).toBeTruthy();
            expect(placeholder?.getAttribute("aria-live")).toBe("polite");
            expect(placeholder?.textContent).toBe("Drop anime here");
        });

        it("should have folder content as direct child", () => {
            const folder: Folder = {
                id: "folder-child",
                name: "Child Test",
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            const content = element.querySelector(":scope > .anime-folder-content");

            expect(content).toBeTruthy();
        });
    });

    describe("loadFolderOrder migration", () => {
        it("should migrate from tileOrder when folderOrder doesn't exist", async () => {
            mockStorage["tileOrder"] = {
                animeIds: ["anime-1", "anime-2"],
                lastUpdated: "2024-01-01",
            };

            const result = await loadFolderOrder();

            expect(result.folders).toEqual([]);
            expect(result.rootItems).toEqual(["anime-1", "anime-2"]);
            expect(result.folderContents).toEqual({});
        });

        it("should return empty structure when no existing data", async () => {
            const result = await loadFolderOrder();

            expect(result.folders).toEqual([]);
            expect(result.rootItems).toEqual([]);
            expect(result.folderContents).toEqual({});
        });
    });

    describe("createFolder additional tests", () => {
        it("should append folder to container when container exists", async () => {
            const container = document.querySelector(".film_list-wrap");
            const initialChildCount = container?.children.length || 0;

            await createFolder();

            expect(container?.children.length).toBe(initialChildCount + 1);
            const newFolder = container?.querySelector(".anime-folder");
            expect(newFolder).toBeTruthy();
        });

        it("should update aria-label after creation", async () => {
            const result = await createFolder();
            const folderEl = document.querySelector(`[data-folder-id="${result.id}"]`);

            expect(folderEl?.getAttribute("aria-label")).toContain("Folder:");
        });
    });

    describe("security validations", () => {
        it("should escape HTML in folder name for aria-label", () => {
            const folder: Folder = {
                id: "folder-xss",
                name: '<script>alert("xss")</script>',
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            const ariaLabel = element.getAttribute("aria-label");

            expect(ariaLabel).not.toContain("<script>");
            expect(ariaLabel).toContain("&lt;script&gt;");
        });

        it("should escape HTML in folder name input value", () => {
            const folder: Folder = {
                id: "folder-xss-input",
                name: '"><img src=x onerror=alert(1)>',
                borderColor: "#FFD700",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);
            const input = element.querySelector(".anime-folder-name-input") as HTMLInputElement;

            // The input value should be escaped
            expect(input.value).not.toContain("<img");
        });

        it("should not apply border color for invalid hex color", () => {
            const folder: Folder = {
                id: "folder-invalid-color",
                name: "Invalid Color",
                borderColor: "javascript:alert(1)",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);

            // Border should not be set for invalid color
            expect(element.style.border).toBe("");
        });

        it("should apply border color for valid hex color", () => {
            const folder: Folder = {
                id: "folder-valid-color",
                name: "Valid Color",
                borderColor: "#FF6B6B",
                createdAt: new Date().toISOString(),
            };

            const element = createFolderElement(folder);

            expect(element.style.border).toContain("rgb(255, 107, 107)");
        });

        it("should reject invalid hex colors in changeFolderColor", async () => {
            mockStorage["folderOrder"] = {
                folders: [{ id: "folder-reject", name: "Reject", borderColor: "#FFD700", createdAt: "2024-01-01" }],
                rootItems: ["folder:folder-reject"],
                folderContents: {},
                lastUpdated: "2024-01-01",
            };

            await changeFolderColor("folder-reject", "not-a-color");

            // Storage should not have been updated with the invalid color
            const stored = mockStorage["folderOrder"] as FolderOrder;
            expect(stored.folders[0].borderColor).toBe("#FFD700");
        });

        it("should accept valid hex colors in changeFolderColor", async () => {
            const folder: Folder = {
                id: "folder-accept",
                name: "Accept",
                borderColor: "#FFD700",
                createdAt: "2024-01-01",
            };

            mockStorage["folderOrder"] = {
                folders: [folder],
                rootItems: ["folder:folder-accept"],
                folderContents: {},
                lastUpdated: "2024-01-01",
            };

            const element = createFolderElement(folder);
            element.setAttribute("data-folder-id", "folder-accept");
            document.body.appendChild(element);

            await changeFolderColor("folder-accept", "#4ECDC4");

            const stored = mockStorage["folderOrder"] as FolderOrder;
            expect(stored.folders[0].borderColor).toBe("#4ECDC4");

            document.body.removeChild(element);
        });
    });
});
