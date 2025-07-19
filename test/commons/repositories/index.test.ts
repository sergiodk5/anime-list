import {
    BaseRepository,
    EpisodeProgressRepository,
    HiddenAnimeRepository,
    PlanToWatchRepository,
} from "@/commons/repositories";
import { describe, expect, it } from "vitest";

describe("Repository Index Exports", () => {
    it("should export all repository classes", () => {
        expect(BaseRepository).toBeDefined();
        expect(EpisodeProgressRepository).toBeDefined();
        expect(HiddenAnimeRepository).toBeDefined();
        expect(PlanToWatchRepository).toBeDefined();
    });

    it("should create repository instances", () => {
        const episodeRepo = new EpisodeProgressRepository();
        const hiddenRepo = new HiddenAnimeRepository();
        const planRepo = new PlanToWatchRepository();

        expect(episodeRepo).toBeInstanceOf(BaseRepository);
        expect(hiddenRepo).toBeInstanceOf(BaseRepository);
        expect(planRepo).toBeInstanceOf(BaseRepository);
    });
});
