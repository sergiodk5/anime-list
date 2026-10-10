import {
    formatEpisodeProgress,
    formatNextEpisode,
    formatTimeUntil,
    resolveTotalEpisodes,
} from "@/commons/utils/episodeInfo";
import { describe, expect, it } from "vitest";

const NOW = Date.parse("2026-10-10T12:00:00Z");
const inSeconds = (ms: number) => (NOW + ms) / 1000;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("resolveTotalEpisodes", () => {
    it("returns the first known positive total", () => {
        expect(resolveTotalEpisodes(12, 24)).toBe(12);
        expect(resolveTotalEpisodes(null, 24)).toBe(24);
        expect(resolveTotalEpisodes(undefined, 0, 13)).toBe(13);
    });

    it("returns undefined when nothing is known", () => {
        expect(resolveTotalEpisodes(null, undefined)).toBeUndefined();
    });
});

describe("formatEpisodeProgress", () => {
    it("shows the total or a question mark", () => {
        expect(formatEpisodeProgress(3, 12)).toBe("Ep 3 / 12");
        expect(formatEpisodeProgress(3, undefined)).toBe("Ep 3 / ?");
    });
});

describe("formatTimeUntil", () => {
    it.each([
        [DAY + 2 * HOUR + 30 * MINUTE, "in 1d 2h"],
        [3 * DAY, "in 3d"],
        [5 * HOUR + 20 * MINUTE, "in 5h 20m"],
        [2 * HOUR, "in 2h"],
        [15 * MINUTE, "in 15m"],
        [10_000, "in 1m"],
        [0, "out now"],
        [-HOUR, "out now"],
    ])("%i ms ahead -> %s", (offset, expected) => {
        expect(formatTimeUntil(inSeconds(offset), NOW)).toBe(expected);
    });
});

describe("formatNextEpisode", () => {
    it("combines the episode number and the time left", () => {
        expect(formatNextEpisode({ episode: 4, airingAt: inSeconds(DAY + 2 * HOUR) }, NOW)).toBe("Ep 4 · in 1d 2h");
    });
});
