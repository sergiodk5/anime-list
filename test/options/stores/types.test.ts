import { describe, expect, it } from "vitest";

import type { AnimeData, EpisodeProgress, PlanToWatch } from "@/commons/models";
import type {
    AnimeListState,
    AsyncState,
    EpisodeProgressState,
    HiddenAnimeState,
    PlanToWatchState,
    StoreActionResult,
} from "@/options/stores/types";

describe("store types", () => {
    describe("AsyncState", () => {
        it("should define correct structure for AsyncState", () => {
            const asyncState: AsyncState<string> = {
                data: "test",
                loading: false,
                error: null,
            };

            expect(asyncState.data).toBe("test");
            expect(asyncState.loading).toBe(false);
            expect(asyncState.error).toBeNull();
        });

        it("should work with different data types", () => {
            const stringState: AsyncState<string> = {
                data: "test",
                loading: true,
                error: "error message",
            };

            const numberState: AsyncState<number> = {
                data: 42,
                loading: false,
                error: null,
            };

            const arrayState: AsyncState<string[]> = {
                data: ["item1", "item2"],
                loading: false,
                error: null,
            };

            expect(stringState.data).toBe("test");
            expect(numberState.data).toBe(42);
            expect(arrayState.data).toEqual(["item1", "item2"]);
        });
    });

    describe("AnimeListState", () => {
        it("should define correct structure for AnimeListState", () => {
            const testAnime: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };

            const animeListState: AnimeListState = {
                items: [testAnime],
                itemsMap: { "123": testAnime },
                loading: false,
                error: null,
                initialized: true,
            };

            expect(animeListState.items).toHaveLength(1);
            expect(animeListState.itemsMap["123"]).toBe(testAnime);
            expect(animeListState.loading).toBe(false);
            expect(animeListState.error).toBeNull();
            expect(animeListState.initialized).toBe(true);
        });
    });

    describe("EpisodeProgressState", () => {
        it("should define correct structure for EpisodeProgressState", () => {
            const testProgress: EpisodeProgress = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
                currentEpisode: 5,
                episodeId: "ep-5",
                lastWatched: "2025-01-01",
                totalEpisodes: 12,
            };

            const progressState: EpisodeProgressState = {
                items: [testProgress],
                itemsMap: { "123": testProgress },
                loading: false,
                error: null,
                initialized: true,
            };

            expect(progressState.items).toHaveLength(1);
            expect(progressState.itemsMap["123"]).toBe(testProgress);
            expect(progressState.items[0].currentEpisode).toBe(5);
            expect(progressState.loading).toBe(false);
        });
    });

    describe("PlanToWatchState", () => {
        it("should define correct structure for PlanToWatchState", () => {
            const testPlan: PlanToWatch = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
                addedAt: "2025-01-01",
            };

            const planState: PlanToWatchState = {
                items: [testPlan],
                itemsMap: { "123": testPlan },
                loading: false,
                error: null,
                initialized: true,
            };

            expect(planState.items).toHaveLength(1);
            expect(planState.itemsMap["123"]).toBe(testPlan);
            expect(planState.items[0].addedAt).toBe("2025-01-01");
            expect(planState.initialized).toBe(true);
        });
    });

    describe("HiddenAnimeState", () => {
        it("should define correct structure for HiddenAnimeState", () => {
            const testHidden: AnimeData = {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
            };

            const hiddenState: HiddenAnimeState = {
                items: [testHidden],
                itemsMap: { "123": testHidden },
                loading: false,
                error: null,
                initialized: true,
            };

            expect(hiddenState.items).toHaveLength(1);
            expect(hiddenState.itemsMap["123"]).toBe(testHidden);
            expect(hiddenState.loading).toBe(false);
            expect(hiddenState.error).toBeNull();
        });
    });

    describe("StoreActionResult", () => {
        it("should define correct structure for successful result", () => {
            const successResult: StoreActionResult = {
                success: true,
                data: { id: "123", updated: true },
            };

            expect(successResult.success).toBe(true);
            expect(successResult.error).toBeUndefined();
            expect(successResult.data).toEqual({ id: "123", updated: true });
        });

        it("should define correct structure for error result", () => {
            const errorResult: StoreActionResult = {
                success: false,
                error: "Something went wrong",
            };

            expect(errorResult.success).toBe(false);
            expect(errorResult.error).toBe("Something went wrong");
            expect(errorResult.data).toBeUndefined();
        });

        it("should allow optional properties", () => {
            const minimalSuccess: StoreActionResult = {
                success: true,
            };

            const minimalError: StoreActionResult = {
                success: false,
            };

            expect(minimalSuccess.success).toBe(true);
            expect(minimalError.success).toBe(false);
        });
    });
});
