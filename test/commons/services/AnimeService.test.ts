import type { AnimeData, EpisodeProgress, PlanToWatch } from "@/commons/models";
import { EpisodeProgressRepository, HiddenAnimeRepository, PlanToWatchRepository } from "@/commons/repositories";
import { AnimeService } from "@/commons/services/AnimeService";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock repositories
const createMockEpisodeProgressRepository = () => ({
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    clear: vi.fn(),
    count: vi.fn(),
});

const createMockPlanToWatchRepository = () => ({
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    clear: vi.fn(),
    count: vi.fn(),
});

const createMockHiddenAnimeRepository = () => ({
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    clear: vi.fn(),
    count: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    isHidden: vi.fn(),
    getAll: vi.fn(),
    getCount: vi.fn(),
});

type MockEpisodeProgressRepository = ReturnType<typeof createMockEpisodeProgressRepository>;
type MockPlanToWatchRepository = ReturnType<typeof createMockPlanToWatchRepository>;
type MockHiddenAnimeRepository = ReturnType<typeof createMockHiddenAnimeRepository>;

describe("AnimeService", () => {
    let animeService: AnimeService;
    let mockEpisodeProgressRepo: MockEpisodeProgressRepository;
    let mockPlanToWatchRepo: MockPlanToWatchRepository;
    let mockHiddenAnimeRepo: MockHiddenAnimeRepository;

    const sampleAnimeData: AnimeData = {
        animeId: "test-anime-1",
        animeTitle: "Test Anime",
        animeSlug: "test-anime",
    };

    const sampleEpisodeProgress: EpisodeProgress = {
        animeId: "test-anime-1",
        animeTitle: "Test Anime",
        animeSlug: "test-anime",
        currentEpisode: 5,
        episodeId: "test-anime-episode-5",
        lastWatched: "2024-01-15T10:30:00.000Z",
        totalEpisodes: 12,
    };

    const samplePlanToWatch: PlanToWatch = {
        animeId: "test-anime-1",
        animeTitle: "Test Anime",
        animeSlug: "test-anime",
        addedAt: "2024-01-10T09:00:00.000Z",
    };

    beforeEach(() => {
        vi.setSystemTime(new Date("2024-01-15T10:30:00.000Z"));

        mockEpisodeProgressRepo = createMockEpisodeProgressRepository();
        mockPlanToWatchRepo = createMockPlanToWatchRepository();
        mockHiddenAnimeRepo = createMockHiddenAnimeRepository();

        animeService = new AnimeService(
            mockEpisodeProgressRepo as unknown as EpisodeProgressRepository,
            mockPlanToWatchRepo as unknown as PlanToWatchRepository,
            mockHiddenAnimeRepo as unknown as HiddenAnimeRepository,
        );
    });

    describe("constructor", () => {
        it("should create instances with default repositories when no parameters provided", () => {
            const service = new AnimeService();
            expect(service).toBeInstanceOf(AnimeService);
        });

        it("should use provided repositories when parameters given", () => {
            const service = new AnimeService(
                mockEpisodeProgressRepo as unknown as EpisodeProgressRepository,
                mockPlanToWatchRepo as unknown as PlanToWatchRepository,
                mockHiddenAnimeRepo as unknown as HiddenAnimeRepository,
            );
            expect(service).toBeInstanceOf(AnimeService);
        });
    });

    describe("getAnimeStatus", () => {
        it("should return clean state when anime is not in any list", async () => {
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const status = await animeService.getAnimeStatus("test-anime-1");

            expect(status).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
                progress: undefined,
                plan: undefined,
            });
        });

        it("should return tracked status when anime has episode progress", async () => {
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const status = await animeService.getAnimeStatus("test-anime-1");

            expect(status).toEqual({
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: sampleEpisodeProgress,
                plan: undefined,
            });
        });

        it("should return planned status when anime is in plan to watch", async () => {
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(samplePlanToWatch);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const status = await animeService.getAnimeStatus("test-anime-1");

            expect(status).toEqual({
                isTracked: false,
                isPlanned: true,
                isHidden: false,
                progress: undefined,
                plan: samplePlanToWatch,
            });
        });

        it("should return hidden status when anime is hidden", async () => {
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(true);

            const status = await animeService.getAnimeStatus("test-anime-1");

            expect(status).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: true,
                progress: undefined,
                plan: undefined,
            });
        });
    });

    describe("addToPlanToWatch", () => {
        it("should add anime to plan to watch when in clean state", async () => {
            // Mock clean state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockPlanToWatchRepo.create.mockResolvedValue(undefined);

            const result = await animeService.addToPlanToWatch(sampleAnimeData);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Added "Test Anime" to plan to watch');
            expect(result.newStatus).toEqual({
                isTracked: false,
                isPlanned: true,
                isHidden: false,
            });

            expect(mockPlanToWatchRepo.create).toHaveBeenCalledWith({
                animeId: "test-anime-1",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
                addedAt: "2024-01-15T10:30:00.000Z",
            });
        });

        it("should fail when anime is already in plan", async () => {
            // Mock planned state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(samplePlanToWatch);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const result = await animeService.addToPlanToWatch(sampleAnimeData);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Anime is already in plan list");
            expect(mockPlanToWatchRepo.create).not.toHaveBeenCalled();
        });

        it("should fail when anime is currently being watched", async () => {
            // Mock watching state
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const result = await animeService.addToPlanToWatch(sampleAnimeData);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Cannot add to plan while watching");
            expect(mockPlanToWatchRepo.create).not.toHaveBeenCalled();
        });

        it("should fail when anime is hidden", async () => {
            // Mock hidden state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(true);

            const result = await animeService.addToPlanToWatch(sampleAnimeData);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Cannot add hidden anime to plan list");
            expect(mockPlanToWatchRepo.create).not.toHaveBeenCalled();
        });

        it("should handle repository errors gracefully", async () => {
            // Mock clean state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockPlanToWatchRepo.create.mockRejectedValue(new Error("Storage error"));

            const result = await animeService.addToPlanToWatch(sampleAnimeData);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to add anime to plan to watch");
            expect(result.error).toBe("Storage error");
        });
    });

    describe("removeFromPlanToWatch", () => {
        it("should remove anime from plan to watch", async () => {
            // Mock planned state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(samplePlanToWatch);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockPlanToWatchRepo.delete.mockResolvedValue(undefined);

            const result = await animeService.removeFromPlanToWatch("test-anime-1");

            expect(result.success).toBe(true);
            expect(result.message).toBe('Removed "Test Anime" from plan to watch');
            expect(result.newStatus).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            expect(mockPlanToWatchRepo.delete).toHaveBeenCalledWith("test-anime-1");
        });

        it("should fail when anime is not in plan list", async () => {
            // Mock clean state - anime is not in plan
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const result = await animeService.removeFromPlanToWatch("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Anime is not in plan list");
            expect(mockPlanToWatchRepo.delete).not.toHaveBeenCalled();
        });

        it("should handle repository errors gracefully", async () => {
            // Mock planned state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(samplePlanToWatch);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockPlanToWatchRepo.delete.mockRejectedValue(new Error("Delete failed"));

            const result = await animeService.removeFromPlanToWatch("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to remove anime from plan to watch");
            expect(result.error).toBe("Delete failed");
        });
    });

    describe("startWatching", () => {
        it("should start watching from clean state", async () => {
            // Mock clean state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockEpisodeProgressRepo.create.mockResolvedValue(undefined);

            const result = await animeService.startWatching(sampleAnimeData, 1);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Started watching "Test Anime" from episode 1');
            expect(result.newStatus).toEqual({
                isTracked: true,
                isPlanned: false,
                isHidden: false,
            });

            expect(mockEpisodeProgressRepo.create).toHaveBeenCalledWith({
                animeId: "test-anime-1",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
                currentEpisode: 1,
                episodeId: "test-anime-episode-1",
                lastWatched: "2024-01-15T10:30:00.000Z",
            });
        });

        it("should start watching from planned state and remove from plan", async () => {
            // Mock planned state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(samplePlanToWatch);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockEpisodeProgressRepo.create.mockResolvedValue(undefined);
            mockPlanToWatchRepo.delete.mockResolvedValue(undefined);

            const result = await animeService.startWatching(sampleAnimeData, 3);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Started watching "Test Anime" from episode 3');

            expect(mockEpisodeProgressRepo.create).toHaveBeenCalled();
            expect(mockPlanToWatchRepo.delete).toHaveBeenCalledWith("test-anime-1");
        });

        it("should start watching from clean state without removing from plan", async () => {
            // Mock clean state (not planned, so removesFromPlan should be false/undefined)
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockEpisodeProgressRepo.create.mockResolvedValue(undefined);

            const result = await animeService.startWatching(sampleAnimeData, 2);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Started watching "Test Anime" from episode 2');

            expect(mockEpisodeProgressRepo.create).toHaveBeenCalled();
            // Should NOT call delete since it wasn't planned
            expect(mockPlanToWatchRepo.delete).not.toHaveBeenCalled();
        });

        it("should fail when anime is already being watched", async () => {
            // Mock watching state
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const result = await animeService.startWatching(sampleAnimeData);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Anime is already being watched");
            expect(mockEpisodeProgressRepo.create).not.toHaveBeenCalled();
        });

        it("should fail when anime is hidden", async () => {
            // Mock hidden state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(true);

            const result = await animeService.startWatching(sampleAnimeData);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Cannot add hidden anime to watch list");
            expect(mockEpisodeProgressRepo.create).not.toHaveBeenCalled();
        });

        it("should handle repository errors gracefully", async () => {
            // Mock clean state for validation
            mockEpisodeProgressRepo.findById
                .mockResolvedValueOnce(null) // startWatching getAnimeStatus call
                .mockResolvedValueOnce(null); // validateAction getAnimeStatus call
            mockPlanToWatchRepo.findById
                .mockResolvedValueOnce(null) // startWatching getAnimeStatus call
                .mockResolvedValueOnce(null); // validateAction getAnimeStatus call
            mockHiddenAnimeRepo.exists
                .mockResolvedValueOnce(false) // startWatching getAnimeStatus call
                .mockResolvedValueOnce(false); // validateAction getAnimeStatus call
            mockEpisodeProgressRepo.create.mockRejectedValue(new Error("Create failed"));

            const result = await animeService.startWatching(sampleAnimeData);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to start watching anime");
            expect(result.error).toBe("Create failed");
        });
    });

    describe("updateEpisodeProgress", () => {
        it("should update episode progress for currently watching anime", async () => {
            // Mock watching state
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockEpisodeProgressRepo.update.mockResolvedValue(undefined);

            const result = await animeService.updateEpisodeProgress("test-anime-1", 7, 12);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Updated "Test Anime" to episode 7');
            expect(result.newStatus).toEqual({
                isTracked: true,
                isPlanned: false,
                isHidden: false,
            });

            expect(mockEpisodeProgressRepo.update).toHaveBeenCalledWith("test-anime-1", {
                currentEpisode: 7,
                episodeId: "test-anime-episode-7",
                lastWatched: "2024-01-15T10:30:00.000Z",
                totalEpisodes: 12,
            });
        });

        it("should update episode progress without total episodes", async () => {
            // Mock watching state
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockEpisodeProgressRepo.update.mockResolvedValue(undefined);

            const result = await animeService.updateEpisodeProgress("test-anime-1", 7);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Updated "Test Anime" to episode 7');

            // Verify update was called without totalEpisodes
            expect(mockEpisodeProgressRepo.update).toHaveBeenCalledWith("test-anime-1", {
                currentEpisode: 7,
                episodeId: "test-anime-episode-7",
                lastWatched: "2024-01-15T10:30:00.000Z",
            });
        });

        it("should fail when anime is not being watched", async () => {
            // Mock clean state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const result = await animeService.updateEpisodeProgress("test-anime-1", 7);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Anime is not being watched");
            expect(mockEpisodeProgressRepo.update).not.toHaveBeenCalled();
        });

        it("should handle repository errors gracefully", async () => {
            // Mock watching state
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockEpisodeProgressRepo.update.mockRejectedValue(new Error("Update failed"));

            const result = await animeService.updateEpisodeProgress("test-anime-1", 7, 12);

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to update episode progress");
            expect(result.error).toBe("Update failed");
        });

        it("should fail when episode progress is missing after validation", async () => {
            // Mock watching state for validation but then return null in the actual check
            mockEpisodeProgressRepo.findById
                .mockResolvedValueOnce(sampleEpisodeProgress) // updateEpisodeProgress getAnimeStatus call
                .mockResolvedValueOnce(sampleEpisodeProgress) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(null); // existingProgress check - progress was deleted
            mockPlanToWatchRepo.findById
                .mockResolvedValueOnce(null) // updateEpisodeProgress getAnimeStatus call
                .mockResolvedValueOnce(null); // validateAction getAnimeStatus call
            mockHiddenAnimeRepo.exists
                .mockResolvedValueOnce(false) // updateEpisodeProgress getAnimeStatus call
                .mockResolvedValueOnce(false); // validateAction getAnimeStatus call

            const result = await animeService.updateEpisodeProgress("test-anime-1", 7, 12);

            expect(result.success).toBe(false);
            expect(result.message).toBe("No episode progress found for this anime");
        });
    });

    describe("stopWatching", () => {
        it("should stop watching anime", async () => {
            // Mock watching state
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockEpisodeProgressRepo.delete.mockResolvedValue(undefined);

            const result = await animeService.stopWatching("test-anime-1");

            expect(result.success).toBe(true);
            expect(result.message).toBe('Stopped watching "Test Anime"');
            expect(result.newStatus).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            expect(mockEpisodeProgressRepo.delete).toHaveBeenCalledWith("test-anime-1");
        });

        it("should fail when anime is not being watched", async () => {
            // Mock clean state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const result = await animeService.stopWatching("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Anime is not being watched");
            expect(mockEpisodeProgressRepo.delete).not.toHaveBeenCalled();
        });

        it("should handle repository errors gracefully", async () => {
            // Mock watching state
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockEpisodeProgressRepo.delete.mockRejectedValue(new Error("Delete failed"));

            const result = await animeService.stopWatching("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to stop watching anime");
            expect(result.error).toBe("Delete failed");
        });
    });

    describe("hideAnime", () => {
        it("should hide anime from clean state", async () => {
            // Mock clean state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);
            mockHiddenAnimeRepo.add.mockResolvedValue(undefined);

            const result = await animeService.hideAnime("test-anime-1");

            expect(result.success).toBe(true);
            expect(result.message).toBe('Hidden "Unknown anime" from listings');
            expect(result.newStatus).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: true,
            });

            expect(mockHiddenAnimeRepo.add).toHaveBeenCalledWith("test-anime-1");
        });

        it("should fail when anime is currently watching", async () => {
            // Mock watching state
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const result = await animeService.hideAnime("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Cannot hide while watching");
            expect(mockHiddenAnimeRepo.add).not.toHaveBeenCalled();
        });

        it("should fail when anime is planned to watch", async () => {
            // Mock planned state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(samplePlanToWatch);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const result = await animeService.hideAnime("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Cannot hide planned anime");
            expect(mockHiddenAnimeRepo.add).not.toHaveBeenCalled();
        });

        it("should use anime title from episode progress when available", async () => {
            // Mock clean state - need to account for multiple getAnimeStatus calls
            mockEpisodeProgressRepo.findById
                .mockResolvedValueOnce(null) // hideAnime getAnimeStatus call (for currentStatus)
                .mockResolvedValueOnce(null) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(sampleEpisodeProgress); // Getting title in hideAnime - progressEntry exists
            mockPlanToWatchRepo.findById
                .mockResolvedValueOnce(null) // hideAnime getAnimeStatus call
                .mockResolvedValueOnce(null) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(null); // Getting title in hideAnime - but we won't need this since progressEntry exists
            mockHiddenAnimeRepo.exists
                .mockResolvedValueOnce(false) // hideAnime getAnimeStatus call
                .mockResolvedValueOnce(false); // validateAction getAnimeStatus call
            mockHiddenAnimeRepo.add.mockResolvedValue(undefined);

            const result = await animeService.hideAnime("test-anime-1");

            expect(result.success).toBe(true);
            expect(result.message).toBe('Hidden "Test Anime" from listings');
        });

        it("should use anime title from plan entry when episode progress not available", async () => {
            // Mock clean state - need to account for multiple getAnimeStatus calls
            mockEpisodeProgressRepo.findById
                .mockResolvedValueOnce(null) // hideAnime getAnimeStatus call (for currentStatus)
                .mockResolvedValueOnce(null) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(null); // Getting title in hideAnime - progressEntry is null
            mockPlanToWatchRepo.findById
                .mockResolvedValueOnce(null) // hideAnime getAnimeStatus call
                .mockResolvedValueOnce(null) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(samplePlanToWatch); // Getting title in hideAnime - planEntry exists
            mockHiddenAnimeRepo.exists
                .mockResolvedValueOnce(false) // hideAnime getAnimeStatus call
                .mockResolvedValueOnce(false); // validateAction getAnimeStatus call
            mockHiddenAnimeRepo.add.mockResolvedValue(undefined);

            const result = await animeService.hideAnime("test-anime-1");

            expect(result.success).toBe(true);
            expect(result.message).toBe('Hidden "Test Anime" from listings');
        });

        it("should handle repository errors gracefully", async () => {
            // Mock clean state for validation to pass
            mockEpisodeProgressRepo.findById
                .mockResolvedValueOnce(null) // hideAnime getAnimeStatus call (for currentStatus)
                .mockResolvedValueOnce(null) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(null); // Getting title in hideAnime
            mockPlanToWatchRepo.findById
                .mockResolvedValueOnce(null) // hideAnime getAnimeStatus call
                .mockResolvedValueOnce(null) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(null); // Getting title in hideAnime
            mockHiddenAnimeRepo.exists
                .mockResolvedValueOnce(false) // hideAnime getAnimeStatus call
                .mockResolvedValueOnce(false); // validateAction getAnimeStatus call
            // Make the add operation fail after validation passes
            mockHiddenAnimeRepo.add.mockRejectedValue(new Error("Add failed"));

            const result = await animeService.hideAnime("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to hide anime");
            expect(result.error).toBe("Add failed");
        });

        it("should handle already hidden anime", async () => {
            // Mock hidden state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(true);

            const result = await animeService.hideAnime("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Anime is already hidden");
            expect(mockHiddenAnimeRepo.add).not.toHaveBeenCalled();
        });
    });

    describe("unhideAnime", () => {
        it("should unhide anime", async () => {
            // Mock hidden state - need to account for 3 getAnimeStatus calls
            mockEpisodeProgressRepo.findById
                .mockResolvedValueOnce(null) // unhideAnime getAnimeStatus call (for currentStatus)
                .mockResolvedValueOnce(null) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(null); // final getAnimeStatus call (for newStatus)
            mockPlanToWatchRepo.findById
                .mockResolvedValueOnce(null) // unhideAnime getAnimeStatus call
                .mockResolvedValueOnce(null) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(null); // final getAnimeStatus call
            mockHiddenAnimeRepo.exists
                .mockResolvedValueOnce(true) // unhideAnime getAnimeStatus call (anime is hidden)
                .mockResolvedValueOnce(true) // validateAction getAnimeStatus call (anime is hidden)
                .mockResolvedValueOnce(false); // final getAnimeStatus call (after unhiding)
            mockHiddenAnimeRepo.remove.mockResolvedValue(undefined);

            const result = await animeService.unhideAnime("test-anime-1");

            expect(result.success).toBe(true);
            expect(result.message).toBe("Anime unhidden from listings");
            expect(result.newStatus).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
                progress: undefined,
                plan: undefined,
            });

            expect(mockHiddenAnimeRepo.remove).toHaveBeenCalledWith("test-anime-1");
        });

        it("should fail when anime is not hidden", async () => {
            // Mock clean state
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const result = await animeService.unhideAnime("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Anime is not hidden");
            expect(mockHiddenAnimeRepo.remove).not.toHaveBeenCalled();
        });

        it("should handle repository errors gracefully", async () => {
            // Mock hidden state - need to account for 3 getAnimeStatus calls
            mockEpisodeProgressRepo.findById
                .mockResolvedValueOnce(null) // unhideAnime getAnimeStatus call (for currentStatus)
                .mockResolvedValueOnce(null) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(null); // final getAnimeStatus call (for newStatus)
            mockPlanToWatchRepo.findById
                .mockResolvedValueOnce(null) // unhideAnime getAnimeStatus call
                .mockResolvedValueOnce(null) // validateAction getAnimeStatus call
                .mockResolvedValueOnce(null); // final getAnimeStatus call
            mockHiddenAnimeRepo.exists
                .mockResolvedValueOnce(true) // unhideAnime getAnimeStatus call (anime is hidden)
                .mockResolvedValueOnce(true) // validateAction getAnimeStatus call (anime is hidden)
                .mockResolvedValueOnce(false); // final getAnimeStatus call (after unhiding)
            mockHiddenAnimeRepo.remove.mockRejectedValue(new Error("Remove failed"));

            const result = await animeService.unhideAnime("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to unhide anime");
            expect(result.error).toBe("Remove failed");
        });
    });

    describe("getAnimeDetails", () => {
        it("should return complete anime details", async () => {
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockHiddenAnimeRepo.exists.mockResolvedValue(false);

            const details = await animeService.getAnimeDetails("test-anime-1");

            expect(details).toEqual({
                status: {
                    isTracked: true,
                    isPlanned: false,
                    isHidden: false,
                    progress: sampleEpisodeProgress,
                    plan: undefined,
                },
                episodeProgress: sampleEpisodeProgress,
                planToWatch: undefined,
                isHidden: false,
            });
        });
    });

    describe("getAllAnime", () => {
        it("should return all anime data across repositories", async () => {
            const episodeProgressList = [sampleEpisodeProgress];
            const planToWatchList = [samplePlanToWatch];
            const hiddenAnimeList = ["hidden-anime-1", "hidden-anime-2"];

            mockEpisodeProgressRepo.findAll.mockResolvedValue(episodeProgressList);
            mockPlanToWatchRepo.findAll.mockResolvedValue(planToWatchList);
            mockHiddenAnimeRepo.findAll.mockResolvedValue(hiddenAnimeList);

            const result = await animeService.getAllAnime();

            expect(result).toEqual({
                currentlyWatching: episodeProgressList,
                planToWatch: planToWatchList,
                hiddenAnime: hiddenAnimeList,
                totalCount: 4,
            });
        });
    });

    describe("clearAnimeData", () => {
        it("should clear all data for an anime", async () => {
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockEpisodeProgressRepo.delete.mockResolvedValue(undefined);
            mockPlanToWatchRepo.delete.mockResolvedValue(undefined);
            mockHiddenAnimeRepo.remove.mockResolvedValue(undefined);

            const result = await animeService.clearAnimeData("test-anime-1");

            expect(result.success).toBe(true);
            expect(result.message).toBe('Cleared all data for "Test Anime"');
            expect(result.newStatus).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            expect(mockEpisodeProgressRepo.delete).toHaveBeenCalledWith("test-anime-1");
            expect(mockPlanToWatchRepo.delete).toHaveBeenCalledWith("test-anime-1");
            expect(mockHiddenAnimeRepo.remove).toHaveBeenCalledWith("test-anime-1");
        });

        it("should clear data for anime that only has plan entry", async () => {
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(samplePlanToWatch);
            mockEpisodeProgressRepo.delete.mockResolvedValue(undefined);
            mockPlanToWatchRepo.delete.mockResolvedValue(undefined);
            mockHiddenAnimeRepo.remove.mockResolvedValue(undefined);

            const result = await animeService.clearAnimeData("test-anime-1");

            expect(result.success).toBe(true);
            expect(result.message).toBe('Cleared all data for "Test Anime"');
            expect(result.newStatus).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            expect(mockEpisodeProgressRepo.delete).toHaveBeenCalledWith("test-anime-1");
            expect(mockPlanToWatchRepo.delete).toHaveBeenCalledWith("test-anime-1");
            expect(mockHiddenAnimeRepo.remove).toHaveBeenCalledWith("test-anime-1");
        });

        it("should handle errors gracefully during cleanup", async () => {
            mockEpisodeProgressRepo.findById.mockResolvedValue(sampleEpisodeProgress);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockEpisodeProgressRepo.delete.mockRejectedValue(new Error("Delete error"));
            mockPlanToWatchRepo.delete.mockResolvedValue(undefined);
            mockHiddenAnimeRepo.remove.mockResolvedValue(undefined);

            const result = await animeService.clearAnimeData("test-anime-1");

            expect(result.success).toBe(true);
            expect(result.message).toBe('Cleared all data for "Test Anime"');
        });

        it("should handle all repository errors during cleanup", async () => {
            // Make the initial findById calls fail to trigger the catch block
            mockEpisodeProgressRepo.findById.mockRejectedValue(new Error("Episode find error"));
            mockPlanToWatchRepo.findById.mockResolvedValue(samplePlanToWatch);

            const result = await animeService.clearAnimeData("test-anime-1");

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to clear anime data");
            expect(result.error).toContain("Episode find error");
        });

        it("should handle clearAnimeData when anime has no title available", async () => {
            // Mock state where neither progress nor plan entries exist but repository operations still need to run
            mockEpisodeProgressRepo.findById.mockResolvedValue(null);
            mockPlanToWatchRepo.findById.mockResolvedValue(null);
            mockEpisodeProgressRepo.delete.mockResolvedValue(undefined);
            mockPlanToWatchRepo.delete.mockResolvedValue(undefined);
            mockHiddenAnimeRepo.remove.mockResolvedValue(undefined);

            const result = await animeService.clearAnimeData("unknown-anime-1");

            expect(result.success).toBe(true);
            expect(result.message).toBe('Cleared all data for "Unknown anime"');
        });
    });

    describe("clearAllHidden", () => {
        it("should clear all hidden anime successfully", async () => {
            const hiddenAnimeList = ["anime-1", "anime-2", "anime-3"];
            mockHiddenAnimeRepo.findAll.mockResolvedValue(hiddenAnimeList);
            mockHiddenAnimeRepo.clear.mockResolvedValue(undefined);

            const result = await animeService.clearAllHidden();

            expect(result.success).toBe(true);
            expect(result.message).toBe("Restored 3 hidden anime");
            expect(result.newStatus).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            expect(mockHiddenAnimeRepo.findAll).toHaveBeenCalled();
            expect(mockHiddenAnimeRepo.clear).toHaveBeenCalled();
        });

        it("should handle when no hidden anime exist", async () => {
            mockHiddenAnimeRepo.findAll.mockResolvedValue([]);

            const result = await animeService.clearAllHidden();

            expect(result.success).toBe(true);
            expect(result.message).toBe("No hidden anime to restore");
            expect(result.newStatus).toEqual({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            });

            expect(mockHiddenAnimeRepo.findAll).toHaveBeenCalled();
            expect(mockHiddenAnimeRepo.clear).not.toHaveBeenCalled();
        });

        it("should handle repository errors gracefully", async () => {
            const hiddenAnimeList = ["anime-1", "anime-2"];
            mockHiddenAnimeRepo.findAll.mockResolvedValue(hiddenAnimeList);
            mockHiddenAnimeRepo.clear.mockRejectedValue(new Error("Clear failed"));

            const result = await animeService.clearAllHidden();

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to clear hidden anime");
            expect(result.error).toBe("Clear failed");
        });

        it("should handle findAll errors gracefully", async () => {
            mockHiddenAnimeRepo.findAll.mockRejectedValue(new Error("FindAll failed"));

            const result = await animeService.clearAllHidden();

            expect(result.success).toBe(false);
            expect(result.message).toBe("Failed to clear hidden anime");
            expect(result.error).toBe("FindAll failed");
        });
    });
});
