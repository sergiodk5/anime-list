import type { AnimeData, AnimeStatus, EpisodeProgress } from "@/commons/models";
import { AnimeService } from "@/commons/services";
import { InfoButton } from "@/content/components/buttons/InfoButton";
import { ModalManager } from "@/content/components/ModalManager";
import { StyleInjector } from "@/content/components/ui/StyleInjector";
import { ToastSystem } from "@/content/components/ui/ToastSystem";
import { SinglePageController } from "@/content/controllers/SinglePageController";
import { AnimeExtractor } from "@/content/services/AnimeExtractor";
import { PageDetector } from "@/content/services/PageDetector";
import { ContentFeature } from "@/content/types/ContentTypes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/commons/services");
vi.mock("@/content/components/ui/ToastSystem");
vi.mock("@/content/services/PageDetector");
vi.mock("@/content/services/AnimeExtractor");
vi.mock("@/content/components/ui/StyleInjector");
vi.mock("@/content/components/buttons/InfoButton");
vi.mock("@/content/components/ModalManager", () => ({
    ModalManager: {
        showModal: vi.fn(),
        closeModal: vi.fn(),
    },
}));

const MOCK_ANIME_DATA: AnimeData = {
    animeId: "123",
    animeTitle: "Test Anime",
    animeSlug: "test-anime",
};

const MOCK_EPISODE_PROGRESS: EpisodeProgress = {
    animeId: "123",
    animeSlug: "test-anime",
    animeTitle: "Test Anime",
    episodeId: "ep10",
    currentEpisode: 10,
    lastWatched: new Date().toISOString(),
};

describe("SinglePageController", () => {
    let animeServiceMock: vi.Mocked<AnimeService>;
    let toastSystemMock: vi.Mocked<ToastSystem>;
    let singlePageController: SinglePageController;

    beforeEach(() => {
        animeServiceMock = new AnimeService() as vi.Mocked<AnimeService>;

        const toastMockInstance = { showToast: vi.fn() };
        vi.spyOn(ToastSystem, "getInstance").mockReturnValue(toastMockInstance as any);
        toastSystemMock = toastMockInstance as any;

        // Reset mocks before each test
        vi.clearAllMocks();

        // Mock static methods
        vi.spyOn(PageDetector, "shouldRunFeature").mockReturnValue(true);
        vi.spyOn(AnimeExtractor, "extractFromSinglePage").mockReturnValue(MOCK_ANIME_DATA);
        const mockButton = document.createElement("button");
        mockButton.className = "anime-list-info-btn";
        vi.spyOn(InfoButton, "create").mockResolvedValue(mockButton);
        vi.spyOn(StyleInjector, "injectStyles");

        // Mock DOM
        document.body.innerHTML = `<div id="main-content"></div>`;

        // Force new instance for each test
        SinglePageController["instance"] = null;
        singlePageController = SinglePageController.getInstance(animeServiceMock, toastSystemMock);
    });

    afterEach(() => {
        singlePageController.destroy();
        document.body.innerHTML = "";
    });

    describe("Singleton Pattern", () => {
        it("should return the same instance", () => {
            const instance1 = SinglePageController.getInstance(animeServiceMock, toastSystemMock);
            const instance2 = SinglePageController.getInstance(animeServiceMock, toastSystemMock);
            expect(instance1).toBe(instance2);
        });
    });

    describe("Initialization", () => {
        it("should not initialize if shouldRunFeature is false", async () => {
            vi.spyOn(PageDetector, "shouldRunFeature").mockReturnValue(false);
            await singlePageController.initialize();
            expect(StyleInjector.injectStyles).not.toHaveBeenCalled();
        });

        it("should not initialize if anime data cannot be extracted", async () => {
            vi.spyOn(AnimeExtractor, "extractFromSinglePage").mockReturnValue(null);
            await singlePageController.initialize();
            expect(StyleInjector.injectStyles).not.toHaveBeenCalled();
        });

        it("should initialize correctly when conditions are met", async () => {
            await singlePageController.initialize();
            expect(PageDetector.shouldRunFeature).toHaveBeenCalledWith(ContentFeature.SINGLE_PAGE_MODAL);
            expect(StyleInjector.injectStyles).toHaveBeenCalledOnce();
            expect(AnimeExtractor.extractFromSinglePage).toHaveBeenCalledOnce();
            expect(InfoButton.create).toHaveBeenCalledWith(MOCK_ANIME_DATA);
            const button = document.querySelector(".anime-list-info-btn");
            expect(button).not.toBeNull();
        });

        it("should not re-initialize if already initialized", async () => {
            await singlePageController.initialize();
            await singlePageController.initialize();
            expect(StyleInjector.injectStyles).toHaveBeenCalledOnce();
        });
    });

    describe("Modal Functionality", () => {
        beforeEach(async () => {
            await singlePageController.initialize();
        });

        it("should show modal with correct data", async () => {
            const mockStatus: AnimeStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: MOCK_EPISODE_PROGRESS,
            };
            animeServiceMock.getAnimeStatus.mockResolvedValue(mockStatus);

            await singlePageController.showModal(MOCK_ANIME_DATA);

            expect(animeServiceMock.getAnimeStatus).toHaveBeenCalledWith(MOCK_ANIME_DATA.animeId);
            expect(ModalManager.showModal).toHaveBeenCalledWith(MOCK_ANIME_DATA, mockStatus);
        });

        it("should handle error when showing modal", async () => {
            animeServiceMock.getAnimeStatus.mockRejectedValue(new Error("API Error"));
            await singlePageController.showModal(MOCK_ANIME_DATA);
            expect(toastSystemMock.showToast).toHaveBeenCalledWith("Failed to open anime modal", "error");
        });
    });

    describe("Episode Updates", () => {
        it("should update episode progress successfully", async () => {
            animeServiceMock.updateEpisodeProgress.mockResolvedValue({ success: true, message: "Success" });
            await singlePageController.updateEpisode(MOCK_ANIME_DATA, 5);
            expect(animeServiceMock.updateEpisodeProgress).toHaveBeenCalledWith(MOCK_ANIME_DATA.animeId, 5);
            expect(toastSystemMock.showToast).toHaveBeenCalledWith("Updated to episode 5", "success");
        });

        it("should handle failure when updating episode progress", async () => {
            animeServiceMock.updateEpisodeProgress.mockResolvedValue({ success: false, message: "Failed" });
            await singlePageController.updateEpisode(MOCK_ANIME_DATA, 5);
            expect(toastSystemMock.showToast).toHaveBeenCalledWith("Failed", "error");
        });
    });

    describe("Status Text", () => {
        it("should return correct status text for watching", () => {
            const status: AnimeStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: MOCK_EPISODE_PROGRESS,
            };
            expect(singlePageController.getStatusText(status)).toBe("Watching - Episode 10");
        });

        it("should return correct status text for planned", () => {
            const status: AnimeStatus = { isTracked: false, isPlanned: true, isHidden: false };
            expect(singlePageController.getStatusText(status)).toBe("Planned to Watch");
        });

        it("should return correct status text for hidden", () => {
            const status: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: true };
            expect(singlePageController.getStatusText(status)).toBe("Hidden");
        });

        it("should return correct status text for not in list", () => {
            const status: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: false };
            expect(singlePageController.getStatusText(status)).toBe("Not in List");
        });
    });

    describe("Actions", () => {
        const testAction = async (action: string, serviceMethod: keyof AnimeService) => {
            const mockResult = { success: true, message: "Action successful" };
            (animeServiceMock[serviceMethod] as any).mockResolvedValue(mockResult);

            await singlePageController.handleAction(MOCK_ANIME_DATA, action);

            expect(animeServiceMock[serviceMethod]).toHaveBeenCalled();
            expect(toastSystemMock.showToast).toHaveBeenCalledWith(mockResult.message, "success");
            expect(ModalManager.closeModal).toHaveBeenCalled();
        };

        it("should handle 'start' action", async () => {
            await testAction("start", "startWatching");
        });

        it("should handle 'plan' action", async () => {
            await testAction("plan", "addToPlanToWatch");
        });

        it("should handle 'hide' action", async () => {
            await testAction("hide", "hideAnime");
        });

        it("should handle 'stop' action", async () => {
            await testAction("stop", "stopWatching");
        });

        it("should handle 'unplan' action", async () => {
            await testAction("unplan", "removeFromPlanToWatch");
        });

        it("should handle failed actions", async () => {
            const mockResult = { success: false, message: "Action failed" };
            animeServiceMock.startWatching.mockResolvedValue(mockResult);
            await singlePageController.handleAction(MOCK_ANIME_DATA, "start");
            expect(toastSystemMock.showToast).toHaveBeenCalledWith(mockResult.message, "error");
        });
    });

    describe("Refresh", () => {
        it("should refresh the info button", async () => {
            await singlePageController.initialize();
            const createButtonSpy = vi.spyOn(InfoButton, "create");
            await singlePageController.refresh();
            expect(createButtonSpy).toHaveBeenCalledWith(MOCK_ANIME_DATA);
        });
    });
});
