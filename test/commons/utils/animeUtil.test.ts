import type { AnimeData, EpisodeProgress, PlanToWatch } from "@/commons/models";
import { AnimeUtil } from "@/commons/utils/animeUtil";
import { EpisodeProgressUtil } from "@/commons/utils/episodeProgressUtil";
import { HiddenAnimeUtil } from "@/commons/utils/hiddenAnimeUtil";
import { PlanToWatchUtil } from "@/commons/utils/planToWatchUtil";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the utility classes
vi.mock("@/commons/utils/episodeProgressUtil");
vi.mock("@/commons/utils/planToWatchUtil");
vi.mock("@/commons/utils/hiddenAnimeUtil");

const mockEpisodeProgressUtil = vi.mocked(EpisodeProgressUtil);
const mockPlanToWatchUtil = vi.mocked(PlanToWatchUtil);
const mockHiddenAnimeUtil = vi.mocked(HiddenAnimeUtil);

describe("AnimeUtil", () => {
    const mockAnimeData: AnimeData = {
        animeId: "123",
        animeTitle: "Test Anime",
        animeSlug: "test-anime-123",
    };

    const mockEpisodeProgress: EpisodeProgress = {
        ...mockAnimeData,
        currentEpisode: 5,
        episodeId: "ep-5",
        lastWatched: "2025-07-10T12:00:00.000Z",
        totalEpisodes: 12,
    };

    const mockPlanToWatch: PlanToWatch = {
        ...mockAnimeData,
        addedAt: "2025-07-10T10:00:00.000Z",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getAnimeStatus", () => {
        it("should return correct status for tracked anime", async () => {
            mockEpisodeProgressUtil.isTracked.mockResolvedValue(true);
            mockPlanToWatchUtil.isPlanned.mockResolvedValue(false);
            mockHiddenAnimeUtil.isHidden.mockResolvedValue(false);
            mockEpisodeProgressUtil.getByAnimeId.mockResolvedValue(mockEpisodeProgress);
            mockPlanToWatchUtil.getByAnimeId.mockResolvedValue(null);

            const result = await AnimeUtil.getAnimeStatus("123");

            expect(result).toEqual({
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: mockEpisodeProgress,
                plan: undefined,
            });
        });

        it("should return correct status for planned anime", async () => {
            mockEpisodeProgressUtil.isTracked.mockResolvedValue(false);
            mockPlanToWatchUtil.isPlanned.mockResolvedValue(true);
            mockHiddenAnimeUtil.isHidden.mockResolvedValue(false);
            mockEpisodeProgressUtil.getByAnimeId.mockResolvedValue(null);
            mockPlanToWatchUtil.getByAnimeId.mockResolvedValue(mockPlanToWatch);

            const result = await AnimeUtil.getAnimeStatus("123");

            expect(result).toEqual({
                isTracked: false,
                isPlanned: true,
                isHidden: false,
                progress: undefined,
                plan: mockPlanToWatch,
            });
        });

        it("should return correct status for hidden anime", async () => {
            mockEpisodeProgressUtil.isTracked.mockResolvedValue(false);
            mockPlanToWatchUtil.isPlanned.mockResolvedValue(false);
            mockHiddenAnimeUtil.isHidden.mockResolvedValue(true);
            mockEpisodeProgressUtil.getByAnimeId.mockResolvedValue(null);
            mockPlanToWatchUtil.getByAnimeId.mockResolvedValue(null);

            const result = await AnimeUtil.getAnimeStatus("123");

            expect(result).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: true,
                progress: undefined,
                plan: undefined,
            });
        });
    });

    describe("startTracking", () => {
        it("should remove from plan and add to progress", async () => {
            mockPlanToWatchUtil.remove.mockResolvedValue(undefined);
            mockEpisodeProgressUtil.save.mockResolvedValue(undefined);

            await AnimeUtil.startTracking(mockAnimeData, "ep-1");

            expect(mockPlanToWatchUtil.remove).toHaveBeenCalledWith("123");
            expect(mockEpisodeProgressUtil.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    animeId: "123",
                    animeTitle: "Test Anime",
                    animeSlug: "test-anime-123",
                    currentEpisode: 1,
                    episodeId: "ep-1",
                    lastWatched: expect.any(String),
                }),
            );
        });

        it("should use empty string for episodeId if not provided", async () => {
            mockPlanToWatchUtil.remove.mockResolvedValue(undefined);
            mockEpisodeProgressUtil.save.mockResolvedValue(undefined);

            await AnimeUtil.startTracking(mockAnimeData);

            expect(mockEpisodeProgressUtil.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    episodeId: "",
                }),
            );
        });
    });

    describe("addToPlan", () => {
        it("should add anime to plan to watch", async () => {
            mockPlanToWatchUtil.add.mockResolvedValue(undefined);

            await AnimeUtil.addToPlan(mockAnimeData);

            expect(mockPlanToWatchUtil.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    animeId: "123",
                    animeTitle: "Test Anime",
                    animeSlug: "test-anime-123",
                    addedAt: expect.any(String),
                }),
            );
        });
    });

    describe("stopTracking", () => {
        it("should remove from both progress and plan", async () => {
            mockEpisodeProgressUtil.remove.mockResolvedValue(undefined);
            mockPlanToWatchUtil.remove.mockResolvedValue(undefined);

            await AnimeUtil.stopTracking("123");

            expect(mockEpisodeProgressUtil.remove).toHaveBeenCalledWith("123");
            expect(mockPlanToWatchUtil.remove).toHaveBeenCalledWith("123");
        });
    });

    describe("hide", () => {
        it("should add anime to hidden list", async () => {
            mockHiddenAnimeUtil.add.mockResolvedValue(undefined);

            await AnimeUtil.hide("123");

            expect(mockHiddenAnimeUtil.add).toHaveBeenCalledWith("123");
        });
    });

    describe("unhide", () => {
        it("should remove anime from hidden list", async () => {
            mockHiddenAnimeUtil.remove.mockResolvedValue(undefined);

            await AnimeUtil.unhide("123");

            expect(mockHiddenAnimeUtil.remove).toHaveBeenCalledWith("123");
        });
    });

    describe("toggleHidden", () => {
        it("should toggle hidden status", async () => {
            mockHiddenAnimeUtil.toggle.mockResolvedValue(true);

            const result = await AnimeUtil.toggleHidden("123");

            expect(mockHiddenAnimeUtil.toggle).toHaveBeenCalledWith("123");
            expect(result).toBe(true);
        });
    });

    describe("updateEpisode", () => {
        it("should update episode progress", async () => {
            mockEpisodeProgressUtil.updateEpisode.mockResolvedValue(undefined);

            await AnimeUtil.updateEpisode("123", 6);

            expect(mockEpisodeProgressUtil.updateEpisode).toHaveBeenCalledWith("123", 6);
        });
    });

    describe("getAllAnimeByStatus", () => {
        it("should return all anime organized by status", async () => {
            const mockTracked = [mockEpisodeProgress];
            const mockPlanned = [mockPlanToWatch];
            const mockHidden = ["456", "789"];

            mockEpisodeProgressUtil.getAllAsArray.mockResolvedValue(mockTracked);
            mockPlanToWatchUtil.getAllAsArray.mockResolvedValue(mockPlanned);
            mockHiddenAnimeUtil.getAll.mockResolvedValue(mockHidden);

            const result = await AnimeUtil.getAllAnimeByStatus();

            expect(result).toEqual({
                tracked: mockTracked,
                planned: mockPlanned,
                hidden: mockHidden,
            });
        });
    });

    describe("searchAnime", () => {
        it("should search across tracked and planned anime", async () => {
            const searchTerm = "test";
            const mockTracked = [mockEpisodeProgress];
            const mockPlanned = [mockPlanToWatch];

            mockEpisodeProgressUtil.getAllAsArray.mockResolvedValue(mockTracked);
            mockPlanToWatchUtil.searchByTitle.mockResolvedValue(mockPlanned);

            const result = await AnimeUtil.searchAnime(searchTerm);

            expect(mockPlanToWatchUtil.searchByTitle).toHaveBeenCalledWith(searchTerm);
            expect(result).toEqual({
                tracked: mockTracked,
                planned: mockPlanned,
            });
        });

        it("should filter tracked anime by search term", async () => {
            const searchTerm = "other";
            const mockTrackedAnime = [mockEpisodeProgress, { ...mockEpisodeProgress, animeTitle: "Other Anime" }];

            mockEpisodeProgressUtil.getAllAsArray.mockResolvedValue(mockTrackedAnime);
            mockPlanToWatchUtil.searchByTitle.mockResolvedValue([]);

            const result = await AnimeUtil.searchAnime(searchTerm);

            expect(result.tracked).toHaveLength(1);
            expect(result.tracked[0].animeTitle).toBe("Other Anime");
        });
    });

    describe("getStatistics", () => {
        it("should return comprehensive statistics", async () => {
            const mockTracked = [mockEpisodeProgress];
            const mockPlanned = [mockPlanToWatch];
            const mockRecentlyWatched = [mockEpisodeProgress];
            const mockRecentlyPlanned = [mockPlanToWatch];

            mockEpisodeProgressUtil.getAllAsArray.mockResolvedValue(mockTracked);
            mockPlanToWatchUtil.getAllAsArray.mockResolvedValue(mockPlanned);
            mockHiddenAnimeUtil.getCount.mockResolvedValue(3);
            mockEpisodeProgressUtil.getRecentlyWatched.mockResolvedValue(mockRecentlyWatched);
            mockPlanToWatchUtil.getRecentlyAdded.mockResolvedValue(mockRecentlyPlanned);

            const result = await AnimeUtil.getStatistics();

            expect(result).toEqual({
                totalTracked: 1,
                totalPlanned: 1,
                totalHidden: 3,
                recentlyWatched: mockRecentlyWatched,
                recentlyPlanned: mockRecentlyPlanned,
            });

            expect(mockEpisodeProgressUtil.getRecentlyWatched).toHaveBeenCalledWith(5);
            expect(mockPlanToWatchUtil.getRecentlyAdded).toHaveBeenCalledWith(5);
        });
    });

    describe("clearAll", () => {
        it("should clear all anime data", async () => {
            mockEpisodeProgressUtil.clear.mockResolvedValue(undefined);
            mockPlanToWatchUtil.clear.mockResolvedValue(undefined);
            mockHiddenAnimeUtil.clear.mockResolvedValue(undefined);

            await AnimeUtil.clearAll();

            expect(mockEpisodeProgressUtil.clear).toHaveBeenCalled();
            expect(mockPlanToWatchUtil.clear).toHaveBeenCalled();
            expect(mockHiddenAnimeUtil.clear).toHaveBeenCalled();
        });
    });

    describe("exportData", () => {
        it("should export all data with timestamp", async () => {
            const mockEpisodeProgressData = { "123": mockEpisodeProgress };
            const mockPlanToWatchData = { "123": mockPlanToWatch };
            const mockHiddenData = ["456", "789"];

            mockEpisodeProgressUtil.getAll.mockResolvedValue(mockEpisodeProgressData);
            mockPlanToWatchUtil.getAll.mockResolvedValue(mockPlanToWatchData);
            mockHiddenAnimeUtil.getAll.mockResolvedValue(mockHiddenData);

            const result = await AnimeUtil.exportData();

            expect(result).toEqual({
                episodeProgress: mockEpisodeProgressData,
                planToWatch: mockPlanToWatchData,
                hiddenAnime: mockHiddenData,
                exportedAt: expect.any(String),
            });

            // Verify the timestamp is a valid ISO string
            expect(new Date(result.exportedAt).toISOString()).toBe(result.exportedAt);
        });
    });
});
