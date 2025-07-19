import { describe, expect, it } from "vitest";
import {
    canAddToPlan,
    canHide,
    canRemoveFromPlan,
    canStartWatching,
    canStopWatching,
    showToast,
} from "../../src/content/index";

describe("Content Script Utility Functions", () => {
    describe("Permission Check Functions", () => {
        it("should check canAddToPlan correctly", () => {
            // Can add to plan when not tracked, not planned, and not hidden
            const status1 = { isTracked: false, isPlanned: false, isHidden: false };
            expect(canAddToPlan(status1)).toBe(true);

            // Cannot add to plan when already planned
            const status2 = { isTracked: false, isPlanned: true, isHidden: false };
            expect(canAddToPlan(status2)).toBe(false);

            // Cannot add to plan when already tracked
            const status3 = { isTracked: true, isPlanned: false, isHidden: false };
            expect(canAddToPlan(status3)).toBe(false);

            // Cannot add to plan when hidden
            const status4 = { isTracked: false, isPlanned: false, isHidden: true };
            expect(canAddToPlan(status4)).toBe(false);
        });

        it("should check canStartWatching correctly", () => {
            // Can start watching when not tracked and not hidden
            const status1 = { isTracked: false, isPlanned: false, isHidden: false };
            expect(canStartWatching(status1)).toBe(true);

            const status2 = { isTracked: false, isPlanned: true, isHidden: false };
            expect(canStartWatching(status2)).toBe(true);

            // Cannot start watching when already tracked
            const status3 = { isTracked: true, isPlanned: false, isHidden: false };
            expect(canStartWatching(status3)).toBe(false);

            // Cannot start watching when hidden
            const status4 = { isTracked: false, isPlanned: true, isHidden: true };
            expect(canStartWatching(status4)).toBe(false);
        });

        it("should check canHide correctly", () => {
            // Can hide when not planned and not tracked
            const status1 = { isTracked: false, isPlanned: false, isHidden: false };
            expect(canHide(status1)).toBe(true);

            const status2 = { isTracked: false, isPlanned: false, isHidden: true };
            expect(canHide(status2)).toBe(true);

            // Cannot hide when tracked
            const status3 = { isTracked: true, isPlanned: false, isHidden: false };
            expect(canHide(status3)).toBe(false);

            // Cannot hide when planned
            const status4 = { isTracked: false, isPlanned: true, isHidden: false };
            expect(canHide(status4)).toBe(false);
        });

        it("should check canRemoveFromPlan correctly", () => {
            // Can remove from plan when planned
            const status1 = { isTracked: false, isPlanned: true, isHidden: false };
            expect(canRemoveFromPlan(status1)).toBe(true);

            const status2 = { isTracked: true, isPlanned: true, isHidden: false };
            expect(canRemoveFromPlan(status2)).toBe(true);

            // Cannot remove from plan when not planned
            const status3 = { isTracked: false, isPlanned: false, isHidden: false };
            expect(canRemoveFromPlan(status3)).toBe(false);

            const status4 = { isTracked: true, isPlanned: false, isHidden: false };
            expect(canRemoveFromPlan(status4)).toBe(false);
        });

        it("should check canStopWatching correctly", () => {
            // Can stop watching when tracked
            const status1 = { isTracked: true, isPlanned: false, isHidden: false };
            expect(canStopWatching(status1)).toBe(true);

            const status2 = { isTracked: true, isPlanned: true, isHidden: false };
            expect(canStopWatching(status2)).toBe(true);

            // Cannot stop watching when not tracked
            const status3 = { isTracked: false, isPlanned: false, isHidden: false };
            expect(canStopWatching(status3)).toBe(false);
        });
    });

    describe("Toast Function", () => {
        it("should create toast without throwing", () => {
            // Just test that the function doesn't throw when called
            expect(() => showToast("Test message", "success")).not.toThrow();
            expect(() => showToast("Error message", "error")).not.toThrow();
            expect(() => showToast("Info message", "info")).not.toThrow();
        });
    });
});
