import { ContentController } from "@/content/controllers/ContentController";
import { ListPageController } from "@/content/controllers/ListPageController";
import { SinglePageController } from "@/content/controllers/SinglePageController";
import { PageDetector } from "@/content/services/PageDetector";
import { ContentFeature, PageType } from "@/content/types/ContentTypes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/content/controllers/ListPageController");
vi.mock("@/content/controllers/SinglePageController");
vi.mock("@/content/services/PageDetector");

describe("ContentController", () => {
    let listPageControllerMock: any;
    let singlePageControllerMock: any;
    let contentController: ContentController;

    beforeEach(() => {
        // Create fresh mocks for each test
        listPageControllerMock = {
            initialize: vi.fn().mockResolvedValue(undefined),
            refreshControls: vi.fn().mockResolvedValue(undefined),
            destroy: vi.fn(),
        } as unknown as vi.Mocked<ListPageController>;

        singlePageControllerMock = {
            initialize: vi.fn().mockResolvedValue(undefined),
            refresh: vi.fn().mockResolvedValue(undefined),
            destroy: vi.fn(),
        } as unknown as vi.Mocked<SinglePageController>;

        // Mock the getInstance static methods on the actual classes
        vi.spyOn(ListPageController, "getInstance").mockReturnValue(listPageControllerMock);
        vi.spyOn(SinglePageController, "getInstance").mockReturnValue(singlePageControllerMock);

        // Reset the singleton instance of ContentController
        ContentController.reset();
        contentController = ContentController.getInstance(singlePageControllerMock, listPageControllerMock);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Initialization", () => {
        it("should initialize ListPageController on a list page", async () => {
            vi.spyOn(PageDetector, "shouldRunFeature").mockImplementation(
                (feature) => feature === ContentFeature.LIST_PAGE_LOGIC,
            );
            await contentController.initialize();
            expect(listPageControllerMock.initialize).toHaveBeenCalled();
            expect(singlePageControllerMock.initialize).not.toHaveBeenCalled();
        });

        it("should initialize SinglePageController on a single page", async () => {
            vi.spyOn(PageDetector, "shouldRunFeature").mockImplementation(
                (feature) => feature === ContentFeature.SINGLE_PAGE_MODAL,
            );
            await contentController.initialize();
            expect(singlePageControllerMock.initialize).toHaveBeenCalled();
            expect(listPageControllerMock.initialize).not.toHaveBeenCalled();
        });

        it("should initialize both controllers if both features are detected", async () => {
            vi.spyOn(PageDetector, "shouldRunFeature").mockReturnValue(true);
            await contentController.initialize();
            expect(listPageControllerMock.initialize).toHaveBeenCalled();
            expect(singlePageControllerMock.initialize).toHaveBeenCalled();
        });

        it("should not initialize any controller if no features are detected", async () => {
            vi.spyOn(PageDetector, "shouldRunFeature").mockReturnValue(false);
            await contentController.initialize();
            expect(listPageControllerMock.initialize).not.toHaveBeenCalled();
            expect(singlePageControllerMock.initialize).not.toHaveBeenCalled();
        });

        it("should not re-initialize if already initialized", async () => {
            vi.spyOn(PageDetector, "shouldRunFeature").mockReturnValue(true);
            await contentController.initialize();
            await contentController.initialize();
            expect(listPageControllerMock.initialize).toHaveBeenCalledTimes(1);
            expect(singlePageControllerMock.initialize).toHaveBeenCalledTimes(1);
        });
    });

    describe("Storage Listeners", () => {
        it("should re-initialize controllers on relevant storage change", async () => {
            // Initial setup
            vi.spyOn(PageDetector, "shouldRunFeature").mockReturnValue(true);
            await contentController.initialize();
            expect(listPageControllerMock.initialize).toHaveBeenCalledTimes(1);

            // Simulate storage change
            const changes = { "anime-123": {} as chrome.storage.StorageChange };
            // Access the private method for testing purposes
            await (contentController as any).handleStorageChange(changes);

            expect(listPageControllerMock.initialize).toHaveBeenCalledTimes(2);
            expect(singlePageControllerMock.initialize).toHaveBeenCalledTimes(2);
        });

        it("should not re-initialize for irrelevant storage changes", async () => {
            vi.spyOn(PageDetector, "shouldRunFeature").mockReturnValue(true);
            await contentController.initialize();
            expect(listPageControllerMock.initialize).toHaveBeenCalledTimes(1);

            const changes = { "some-other-key": {} as chrome.storage.StorageChange };
            await (contentController as any).handleStorageChange(changes);

            expect(listPageControllerMock.initialize).toHaveBeenCalledTimes(1);
        });
    });

    describe("Lifecycle", () => {
        it("should destroy child controllers when destroyed", () => {
            contentController.destroy();
            expect(listPageControllerMock.destroy).toHaveBeenCalled();
            expect(singlePageControllerMock.destroy).toHaveBeenCalled();
        });
    });

    describe("Get Status", () => {
        it("should return correct status", () => {
            vi.spyOn(PageDetector, "detectPageType").mockReturnValue(PageType.LIST_PAGE);
            vi.spyOn(PageDetector, "shouldRunFeature").mockImplementation(
                (feature) => feature === ContentFeature.LIST_PAGE_LOGIC,
            );

            const status = contentController.getStatus();

            expect(status).toEqual({
                initialized: false,
                pageType: PageType.LIST_PAGE,
                listPageActive: true,
                singlePageActive: false,
            });
        });
    });
});
