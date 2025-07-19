import type { AnimeStatus } from "@/commons/models/architecture";
import { AnimeAction } from "@/commons/models/architecture";
import { AnimeStateValidator } from "@/commons/services/AnimeStateValidator";
import { describe, expect, it } from "vitest";

describe("AnimeStateValidator", () => {
    describe("validateTransition - Clean State", () => {
        const cleanStatus: AnimeStatus = {
            isTracked: false,
            isPlanned: false,
            isHidden: false,
        };

        it("should allow adding to plan", () => {
            const result = AnimeStateValidator.validateTransition(cleanStatus, AnimeAction.ADD_TO_PLAN);
            expect(result.allowed).toBe(true);
        });

        it("should allow adding to watch with episode input required", () => {
            const result = AnimeStateValidator.validateTransition(cleanStatus, AnimeAction.ADD_TO_WATCH);
            expect(result.allowed).toBe(true);
            expect(result.requiresEpisodeInput).toBe(true);
        });

        it("should allow hiding", () => {
            const result = AnimeStateValidator.validateTransition(cleanStatus, AnimeAction.HIDE);
            expect(result.allowed).toBe(true);
        });

        it("should not allow removing from plan", () => {
            const result = AnimeStateValidator.validateTransition(cleanStatus, AnimeAction.REMOVE_FROM_PLAN);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Anime is not in plan list");
        });

        it("should not allow removing from watch", () => {
            const result = AnimeStateValidator.validateTransition(cleanStatus, AnimeAction.REMOVE_FROM_WATCH);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Anime is not being watched");
        });

        it("should not allow unhiding", () => {
            const result = AnimeStateValidator.validateTransition(cleanStatus, AnimeAction.UNHIDE);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Anime is not hidden");
        });
    });

    describe("validateTransition - Plan State", () => {
        const planStatus: AnimeStatus = {
            isTracked: false,
            isPlanned: true,
            isHidden: false,
            plan: {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
                addedAt: "2025-07-19T10:00:00.000Z",
            },
        };

        it("should allow removing from plan", () => {
            const result = AnimeStateValidator.validateTransition(planStatus, AnimeAction.REMOVE_FROM_PLAN);
            expect(result.allowed).toBe(true);
        });

        it("should allow adding to watch and remove from plan", () => {
            const result = AnimeStateValidator.validateTransition(planStatus, AnimeAction.ADD_TO_WATCH);
            expect(result.allowed).toBe(true);
            expect(result.removesFromPlan).toBe(true);
            expect(result.requiresEpisodeInput).toBe(true);
        });

        it("should not allow hiding", () => {
            const result = AnimeStateValidator.validateTransition(planStatus, AnimeAction.HIDE);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Cannot hide planned anime");
        });

        it("should not allow adding to plan again", () => {
            const result = AnimeStateValidator.validateTransition(planStatus, AnimeAction.ADD_TO_PLAN);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Anime is already in plan list");
        });
    });

    describe("validateTransition - Watch State", () => {
        const watchStatus: AnimeStatus = {
            isTracked: true,
            isPlanned: false,
            isHidden: false,
            progress: {
                animeId: "123",
                animeTitle: "Test Anime",
                animeSlug: "test-anime",
                currentEpisode: 5,
                episodeId: "ep-5",
                lastWatched: "2025-07-19T10:00:00.000Z",
            },
        };

        it("should allow removing from watch", () => {
            const result = AnimeStateValidator.validateTransition(watchStatus, AnimeAction.REMOVE_FROM_WATCH);
            expect(result.allowed).toBe(true);
        });

        it("should allow updating episode", () => {
            const result = AnimeStateValidator.validateTransition(watchStatus, AnimeAction.UPDATE_EPISODE);
            expect(result.allowed).toBe(true);
        });

        it("should not allow adding to plan", () => {
            const result = AnimeStateValidator.validateTransition(watchStatus, AnimeAction.ADD_TO_PLAN);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Cannot add to plan while watching");
        });

        it("should not allow hiding", () => {
            const result = AnimeStateValidator.validateTransition(watchStatus, AnimeAction.HIDE);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Cannot hide while watching");
        });

        it("should not allow adding to watch again", () => {
            const result = AnimeStateValidator.validateTransition(watchStatus, AnimeAction.ADD_TO_WATCH);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Anime is already being watched");
        });
    });

    describe("validateTransition - Hidden State", () => {
        const hiddenStatus: AnimeStatus = {
            isTracked: false,
            isPlanned: false,
            isHidden: true,
        };

        it("should allow unhiding", () => {
            const result = AnimeStateValidator.validateTransition(hiddenStatus, AnimeAction.UNHIDE);
            expect(result.allowed).toBe(true);
        });

        it("should not allow adding to plan", () => {
            const result = AnimeStateValidator.validateTransition(hiddenStatus, AnimeAction.ADD_TO_PLAN);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Cannot add hidden anime to plan list");
        });

        it("should not allow adding to watch", () => {
            const result = AnimeStateValidator.validateTransition(hiddenStatus, AnimeAction.ADD_TO_WATCH);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Cannot add hidden anime to watch list");
        });

        it("should not allow hiding again", () => {
            const result = AnimeStateValidator.validateTransition(hiddenStatus, AnimeAction.HIDE);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Anime is already hidden");
        });
    });

    describe("getAvailableActions", () => {
        it("should return available actions for clean state", () => {
            const cleanStatus: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: false };
            const actions = AnimeStateValidator.getAvailableActions(cleanStatus);

            expect(actions).toContain(AnimeAction.ADD_TO_PLAN);
            expect(actions).toContain(AnimeAction.ADD_TO_WATCH);
            expect(actions).toContain(AnimeAction.HIDE);
            expect(actions).not.toContain(AnimeAction.REMOVE_FROM_PLAN);
            expect(actions).not.toContain(AnimeAction.REMOVE_FROM_WATCH);
            expect(actions).not.toContain(AnimeAction.UNHIDE);
        });

        it("should return available actions for plan state", () => {
            const planStatus: AnimeStatus = { isTracked: false, isPlanned: true, isHidden: false };
            const actions = AnimeStateValidator.getAvailableActions(planStatus);

            expect(actions).toContain(AnimeAction.REMOVE_FROM_PLAN);
            expect(actions).toContain(AnimeAction.ADD_TO_WATCH);
            expect(actions).not.toContain(AnimeAction.HIDE);
            expect(actions).not.toContain(AnimeAction.ADD_TO_PLAN);
        });

        it("should return available actions for watch state", () => {
            const watchStatus: AnimeStatus = { isTracked: true, isPlanned: false, isHidden: false };
            const actions = AnimeStateValidator.getAvailableActions(watchStatus);

            expect(actions).toContain(AnimeAction.REMOVE_FROM_WATCH);
            expect(actions).toContain(AnimeAction.UPDATE_EPISODE);
            expect(actions).not.toContain(AnimeAction.ADD_TO_PLAN);
            expect(actions).not.toContain(AnimeAction.HIDE);
        });

        it("should return available actions for hidden state", () => {
            const hiddenStatus: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: true };
            const actions = AnimeStateValidator.getAvailableActions(hiddenStatus);

            expect(actions).toContain(AnimeAction.UNHIDE);
            expect(actions).not.toContain(AnimeAction.ADD_TO_PLAN);
            expect(actions).not.toContain(AnimeAction.ADD_TO_WATCH);
            expect(actions).not.toContain(AnimeAction.HIDE);
        });
    });

    describe("getStateDescription", () => {
        it("should describe hidden state", () => {
            const hiddenStatus: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: true };
            const description = AnimeStateValidator.getStateDescription(hiddenStatus);
            expect(description).toBe("Hidden");
        });

        it("should describe watching state with episode", () => {
            const watchStatus: AnimeStatus = {
                isTracked: true,
                isPlanned: false,
                isHidden: false,
                progress: {
                    animeId: "123",
                    animeTitle: "Test Anime",
                    animeSlug: "test-anime",
                    currentEpisode: 5,
                    episodeId: "ep-5",
                    lastWatched: "2025-07-19T10:00:00.000Z",
                },
            };
            const description = AnimeStateValidator.getStateDescription(watchStatus);
            expect(description).toBe("Watching (Episode 5)");
        });

        it("should describe watching state without episode info", () => {
            const watchStatus: AnimeStatus = { isTracked: true, isPlanned: false, isHidden: false };
            const description = AnimeStateValidator.getStateDescription(watchStatus);
            expect(description).toBe("Watching (Episode 1)");
        });

        it("should describe planned state", () => {
            const planStatus: AnimeStatus = { isTracked: false, isPlanned: true, isHidden: false };
            const description = AnimeStateValidator.getStateDescription(planStatus);
            expect(description).toBe("Planned to Watch");
        });

        it("should describe clean state", () => {
            const cleanStatus: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: false };
            const description = AnimeStateValidator.getStateDescription(cleanStatus);
            expect(description).toBe("Not in any list");
        });
    });

    describe("getRecommendedActions", () => {
        it("should recommend unhide for hidden state", () => {
            const hiddenStatus: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: true };
            const recommended = AnimeStateValidator.getRecommendedActions(hiddenStatus);
            expect(recommended).toEqual([AnimeAction.UNHIDE]);
        });

        it("should recommend episode update and remove for watch state", () => {
            const watchStatus: AnimeStatus = { isTracked: true, isPlanned: false, isHidden: false };
            const recommended = AnimeStateValidator.getRecommendedActions(watchStatus);
            expect(recommended).toEqual([AnimeAction.UPDATE_EPISODE, AnimeAction.REMOVE_FROM_WATCH]);
        });

        it("should recommend watch and remove for plan state", () => {
            const planStatus: AnimeStatus = { isTracked: false, isPlanned: true, isHidden: false };
            const recommended = AnimeStateValidator.getRecommendedActions(planStatus);
            expect(recommended).toEqual([AnimeAction.ADD_TO_WATCH, AnimeAction.REMOVE_FROM_PLAN]);
        });

        it("should recommend all actions for clean state", () => {
            const cleanStatus: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: false };
            const recommended = AnimeStateValidator.getRecommendedActions(cleanStatus);
            expect(recommended).toEqual([AnimeAction.ADD_TO_PLAN, AnimeAction.ADD_TO_WATCH, AnimeAction.HIDE]);
        });
    });

    describe("validateTransition - Edge Cases", () => {
        it("should handle unknown action", () => {
            const cleanStatus: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: false };
            // Create an unknown action by casting a non-existent value
            const unknownAction = "UNKNOWN_ACTION" as AnimeAction;

            const result = AnimeStateValidator.validateTransition(cleanStatus, unknownAction);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Unknown action");
        });
    });
});
