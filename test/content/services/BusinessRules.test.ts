import type { AnimeStatus } from "@/commons/models";
import { BusinessRules } from "@/content/services/BusinessRules";
import { describe, expect, it } from "vitest";

describe("BusinessRules", () => {
    const notTracked: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: false, progress: undefined };
    const planned: AnimeStatus = { isTracked: false, isPlanned: true, isHidden: false, progress: undefined };
    const tracked: AnimeStatus = { isTracked: true, isPlanned: false, isHidden: false, progress: undefined };
    const trackedWithProgress: AnimeStatus = {
        isTracked: true,
        isPlanned: false,
        isHidden: false,
        progress: {
            currentEpisode: 1,
            totalEpisodes: 12,
            animeId: "1",
            animeSlug: "slug",
            animeTitle: "title",
            episodeId: "1",
            lastWatched: "",
        },
    };
    const hidden: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: true, progress: undefined };

    it("canAddToPlan should be correct", () => {
        expect(BusinessRules.canAddToPlan(notTracked)).toBe(true);
        expect(BusinessRules.canAddToPlan(planned)).toBe(false);
        expect(BusinessRules.canAddToPlan(tracked)).toBe(false);
        expect(BusinessRules.canAddToPlan(hidden)).toBe(false);
    });

    it("canStartWatching should be correct", () => {
        expect(BusinessRules.canStartWatching(notTracked)).toBe(true);
        expect(BusinessRules.canStartWatching(planned)).toBe(true);
        expect(BusinessRules.canStartWatching(tracked)).toBe(false);
        expect(BusinessRules.canStartWatching(hidden)).toBe(false);
    });

    it("canHide should be correct", () => {
        expect(BusinessRules.canHide(notTracked)).toBe(true);
        expect(BusinessRules.canHide(planned)).toBe(false);
        expect(BusinessRules.canHide(tracked)).toBe(false);
        expect(BusinessRules.canHide(hidden)).toBe(false);
    });

    it("canRemoveFromPlan should be correct", () => {
        expect(BusinessRules.canRemoveFromPlan(notTracked)).toBe(false);
        expect(BusinessRules.canRemoveFromPlan(planned)).toBe(true);
        expect(BusinessRules.canRemoveFromPlan(tracked)).toBe(false);
        expect(BusinessRules.canRemoveFromPlan(hidden)).toBe(false);
    });

    it("canStopWatching should be correct", () => {
        expect(BusinessRules.canStopWatching(notTracked)).toBe(false);
        expect(BusinessRules.canStopWatching(planned)).toBe(false);
        expect(BusinessRules.canStopWatching(tracked)).toBe(true);
        expect(BusinessRules.canStopWatching(trackedWithProgress)).toBe(true);
        expect(BusinessRules.canStopWatching(hidden)).toBe(false);
    });

    it("canUnhide should be correct", () => {
        expect(BusinessRules.canUnhide(notTracked)).toBe(false);
        expect(BusinessRules.canUnhide(planned)).toBe(false);
        expect(BusinessRules.canUnhide(tracked)).toBe(false);
        expect(BusinessRules.canUnhide(hidden)).toBe(true);
    });

    describe("getBlockedActionMessage", () => {
        it("should return correct messages for hiding", () => {
            expect(BusinessRules.getBlockedActionMessage("hide", planned)).toBe(
                "Cannot hide planned anime. Remove from plan first.",
            );
            expect(BusinessRules.getBlockedActionMessage("hide", tracked)).toBe(
                "Cannot hide currently watching anime. Stop watching first.",
            );
        });

        it("should return correct messages for planning", () => {
            expect(BusinessRules.getBlockedActionMessage("plan", tracked)).toBe(
                "Cannot add to plan while watching. Stop watching first.",
            );
            expect(BusinessRules.getBlockedActionMessage("plan", hidden)).toBe(
                "Cannot add hidden anime to plan. Remove from hidden first.",
            );
        });

        it("should return correct messages for starting to watch", () => {
            expect(BusinessRules.getBlockedActionMessage("startWatching", hidden)).toBe(
                "Cannot start watching hidden anime. Remove from hidden first.",
            );
        });

        it("should return a generic message for unhandled cases", () => {
            expect(BusinessRules.getBlockedActionMessage("unknown", notTracked)).toBe(
                "This action is not allowed for this anime.",
            );
        });
    });

    describe("getActionPriority", () => {
        it("should return correct priorities for tracked status", () => {
            expect(BusinessRules.getActionPriority("episodeControls", tracked)).toBe(1);
            expect(BusinessRules.getActionPriority("stopWatching", tracked)).toBe(2);
        });

        it("should return correct priorities for planned status", () => {
            expect(BusinessRules.getActionPriority("startWatching", planned)).toBe(1);
            expect(BusinessRules.getActionPriority("removePlan", planned)).toBe(2);
        });

        it("should return correct priorities for hidden status", () => {
            expect(BusinessRules.getActionPriority("unhide", hidden)).toBe(1);
        });

        it("should return a default priority for other cases", () => {
            const notTracked: AnimeStatus = { isTracked: false, isPlanned: false, isHidden: false };
            expect(BusinessRules.getActionPriority("startWatching", notTracked)).toBe(1);
            expect(BusinessRules.getActionPriority("addToPlan", notTracked)).toBe(2);
            expect(BusinessRules.getActionPriority("hide", notTracked)).toBe(3);
        });
    });
});
