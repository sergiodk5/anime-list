import { beforeEach, describe, expect, it, vi } from "vitest";

const refreshDue = vi.fn();

vi.mock("@/commons/services/AnimeMetadataService", () => ({
    METADATA_REFRESH_MESSAGE: "ANIME_METADATA_REFRESH",
    AnimeMetadataService: class {
        refreshDue = refreshDue;
    },
}));

type Listener = (...args: any[]) => unknown;
const listeners: Record<string, Listener[]> = {};
const on = (name: string) => ({ addListener: (fn: Listener) => (listeners[name] ??= []).push(fn) });

(globalThis as any).chrome = {
    ...(globalThis as any).chrome,
    runtime: {
        lastError: null,
        onInstalled: on("installed"),
        onStartup: on("startup"),
        onMessage: on("message"),
    },
    alarms: { create: vi.fn(), onAlarm: on("alarm") },
};

const { REFRESH_ALARM, REFRESH_PERIOD_MINUTES } = await import("@/background/index");

const fire = (name: string, ...args: unknown[]) => listeners[name].forEach((fn) => fn(...args));
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("background worker", () => {
    beforeEach(() => {
        refreshDue.mockResolvedValue({ fetched: 0, failed: 0, pruned: 0, rateLimited: false });
    });

    it("schedules the periodic refresh and refreshes on install", async () => {
        fire("installed");
        await flush();

        expect(chrome.alarms.create).toHaveBeenCalledWith(REFRESH_ALARM, { periodInMinutes: REFRESH_PERIOD_MINUTES });
        expect(refreshDue).toHaveBeenCalledTimes(1);
    });

    it("refreshes on its own alarm only", async () => {
        fire("alarm", { name: "something-else" });
        fire("alarm", { name: REFRESH_ALARM });
        await flush();

        expect(refreshDue).toHaveBeenCalledTimes(1);
    });

    it("refreshes when a page asks and ignores other messages", async () => {
        fire("message", { type: "ANIME_STATE_CHANGED" });
        fire("message", { type: "ANIME_METADATA_REFRESH", animeId: "overgeared" });
        await flush();

        expect(refreshDue).toHaveBeenCalledTimes(1);
    });

    it("shares one run between overlapping triggers", async () => {
        let finish!: () => void;
        refreshDue.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));

        fire("alarm", { name: REFRESH_ALARM });
        fire("message", { type: "ANIME_METADATA_REFRESH" });
        finish();
        await flush();

        expect(refreshDue).toHaveBeenCalledTimes(1);
    });
});
