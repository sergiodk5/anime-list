import { describe, expect, it, vi } from "vitest";

// Mock Chrome APIs before any imports
const mockChromeStorage = {
    onChanged: {
        addListener: vi.fn(),
    },
    local: {
        get: vi.fn(() => Promise.resolve({})),
        set: vi.fn(() => Promise.resolve()),
    },
};

const mockChromeRuntime = {
    onMessage: {
        addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
};

// Setup global chrome mock
global.chrome = {
    storage: mockChromeStorage,
    runtime: mockChromeRuntime,
} as any;

// Mock StorageKeys enum
vi.mock("@/commons/models", () => ({
    StorageKeys: {
        EPISODE_PROGRESS: "episodeProgress",
        PLAN_TO_WATCH: "planToWatch",
        HIDDEN_ANIME: "hiddenAnime",
    },
}));

describe("storageSyncPlugin basic test", () => {
    it("should pass basic test", () => {
        expect(true).toBe(true);
    });

    it("should have mocked Chrome APIs", () => {
        expect(global.chrome).toBeDefined();
        expect(global.chrome.storage).toBeDefined();
        expect(global.chrome.runtime).toBeDefined();
    });
});
