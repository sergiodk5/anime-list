import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/commons/services/AnimeService");
vi.mock("@/content/components/ui/ToastSystem");
vi.mock("@/content/services/PageDetector");
vi.mock("@/content/services/AnimeExtractor");
vi.mock("@/content/components/ui/StyleInjector");
vi.mock("@/content/components/buttons/WatchingControls");
vi.mock("@/content/components/buttons/PlanButton");
vi.mock("@/content/components/buttons/HideButton");

import type { AnimeData, EpisodeProgress } from "@/commons/models";
import { AnimeService } from "@/commons/services/AnimeService";
import { HideButton } from "@/content/components/buttons/HideButton";
import { PlanButton } from "@/content/components/buttons/PlanButton";
import { WatchingControls } from "@/content/components/buttons/WatchingControls";
import { StyleInjector } from "@/content/components/ui/StyleInjector";
import type { ToastSystem } from "@/content/components/ui/ToastSystem";
import { ListPageController } from "@/content/controllers/ListPageController";
import { AnimeExtractor } from "@/content/services/AnimeExtractor";
import { PageDetector } from "@/content/services/PageDetector";
import { ContentFeature } from "@/content/types/ContentTypes";

describe("ListPageController", () => {
    let animeServiceMock: any;
    let toastSystemMock: any;
    let hideButtonMock: any;
    let listPageController: ListPageController;
    let container: HTMLElement;

    const MOCK_ANIME_DATA: AnimeData = {
        animeId: "1",
        animeTitle: "Test Anime",
        animeSlug: "test-anime",
    };

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();

        // Create mock instances
        animeServiceMock = new (AnimeService as any)();
        toastSystemMock = { showToast: vi.fn() };
        hideButtonMock = new (HideButton as any)();

        // Configure the mock return values
        hideButtonMock.create.mockReturnValue(document.createElement("button"));
        hideButtonMock.createClearHiddenButton.mockImplementation(() => {
            const button = document.createElement("button");
            button.id = "test-clear-hidden-button";
            return button;
        });

        // Set a default mock for getAnimeStatus to prevent initialization errors
        animeServiceMock.getAnimeStatus.mockResolvedValue({
            isTracked: false,
            isPlanned: false,
            isHidden: false,
        });

        // Mock static methods
        vi.spyOn(PageDetector, "shouldRunFeature").mockReturnValue(true);
        vi.spyOn(StyleInjector, "injectStyles").mockImplementation(() => {});
        vi.spyOn(AnimeExtractor, "extractFromListItem").mockReturnValue(MOCK_ANIME_DATA);
        vi.spyOn(WatchingControls, "createCombined").mockResolvedValue(document.createElement("div"));
        vi.spyOn(WatchingControls, "createStartButton").mockResolvedValue(document.createElement("div"));
        vi.spyOn(PlanButton, "create").mockResolvedValue(document.createElement("button"));
        vi.spyOn(PlanButton, "createRemoveButton").mockResolvedValue(document.createElement("button"));

        // Mock DOM
        container = document.createElement("div");
        container.classList.add("film_list-wrap");
        const item = document.createElement("div");
        item.classList.add("flw-item");
        container.appendChild(item);
        document.body.appendChild(container);

        // Reset singleton instance
        (ListPageController as any).instance = null;
        listPageController = ListPageController.getInstance(
            animeServiceMock,
            toastSystemMock as unknown as ToastSystem,
        );
        (listPageController as any).hideButton = hideButtonMock;
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    describe("Initialization", () => {
        it("should not initialize if not on a list page", async () => {
            vi.spyOn(PageDetector, "shouldRunFeature").mockReturnValue(false);
            await listPageController.initialize();
            expect(StyleInjector.injectStyles).not.toHaveBeenCalled();
        });

        it("should initialize correctly on a list page", async () => {
            animeServiceMock.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            await listPageController.initialize();
            expect(PageDetector.shouldRunFeature).toHaveBeenCalledWith(ContentFeature.LIST_PAGE_LOGIC);
            expect(StyleInjector.injectStyles).toHaveBeenCalled();
            expect(animeServiceMock.getAnimeStatus).toHaveBeenCalledWith(MOCK_ANIME_DATA.animeId);
        });
    });

    describe("Button Creation Logic", () => {
        it("should create 'watching' controls for tracked anime", async () => {
            const progress: EpisodeProgress = {
                animeId: "1",
                animeSlug: "test-anime",
                animeTitle: "Test Anime",
                currentEpisode: 5,
                episodeId: "ep-5",
                lastWatched: "date",
            };
            animeServiceMock.getAnimeStatus.mockResolvedValue({
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress,
            });
            await listPageController.initialize();
            expect(WatchingControls.createCombined).toHaveBeenCalledWith(MOCK_ANIME_DATA, 5);
        });

        it("should create 'start watching' and 'remove plan' for planned anime", async () => {
            animeServiceMock.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: true,
                isHidden: false,
            });
            await listPageController.initialize();
            expect(WatchingControls.createStartButton).toHaveBeenCalledWith(MOCK_ANIME_DATA);
            expect(PlanButton.createRemoveButton).toHaveBeenCalledWith(MOCK_ANIME_DATA);
        });

        it("should create 'plan' button for untracked anime", async () => {
            animeServiceMock.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            await listPageController.initialize();
            expect(PlanButton.create).toHaveBeenCalledWith(MOCK_ANIME_DATA);
        });

        it("should always create 'hide' button for non-hidden anime", async () => {
            animeServiceMock.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });
            await listPageController.initialize();
            expect(hideButtonMock.create).toHaveBeenCalledWith(MOCK_ANIME_DATA);
        });

        it("should not create controls for hidden anime", async () => {
            animeServiceMock.getAnimeStatus.mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: true,
            });

            await listPageController.initialize();
            expect(WatchingControls.createCombined).not.toHaveBeenCalled();
            expect(PlanButton.create).not.toHaveBeenCalled();
        });
    });

    describe("Clear Hidden Button", () => {
        it("should add the 'Clear Hidden' button", async () => {
            await listPageController.initialize();
            expect(hideButtonMock.createClearHiddenButton).toHaveBeenCalled();
        });
    });
});
