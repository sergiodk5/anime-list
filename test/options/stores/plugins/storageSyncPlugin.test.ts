import { createPinia, defineStore, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "vue";

// Create comprehensive Chrome API mock
const mockStorageListener = vi.fn();
const mockMessageListener = vi.fn();

const mockChromeStorage = {
    onChanged: {
        addListener: vi.fn((callback) => {
            mockStorageListener.mockImplementation(callback);
        }),
        removeListener: vi.fn(),
    },
    local: {
        get: vi.fn(() => Promise.resolve({})),
        set: vi.fn(() => Promise.resolve()),
        remove: vi.fn(() => Promise.resolve()),
        clear: vi.fn(() => Promise.resolve()),
    },
};

const mockChromeRuntime = {
    onMessage: {
        addListener: vi.fn((callback) => {
            mockMessageListener.mockImplementation(callback);
        }),
        removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
    lastError: null,
};

// Setup comprehensive global chrome mock
Object.defineProperty(global, "chrome", {
    value: {
        storage: mockChromeStorage,
        runtime: mockChromeRuntime,
    },
    writable: true,
    configurable: true,
});

// Import after mocking
import { storageSyncPlugin } from "@/options/stores/plugins/storageSyncPlugin";

describe("storageSyncPlugin", () => {
    let pinia: ReturnType<typeof createPinia>;
    let app: ReturnType<typeof createApp>;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup window object properly
        Object.defineProperty(global, "window", {
            value: {},
            writable: true,
            configurable: true,
        });

        // Clear global registry
        if ((global as any).window) {
            delete (global as any).window.__piniaStoreRegistry;
        }

        // Create fresh pinia instance with plugin and app context (required for plugins)
        app = createApp({});
        pinia = createPinia().use(storageSyncPlugin);
        app.use(pinia);
        setActivePinia(pinia);
    });

    it("should execute plugin when pinia.use() is called", () => {
        let pluginWasCalled = false;

        // Create a simple plugin that marks when it's called
        const testPlugin = () => {
            pluginWasCalled = true;
        };

        // Create a new test pinia instance
        const testApp = createApp({});
        const testPinia = createPinia().use(testPlugin);
        testApp.use(testPinia);

        // Create a store to trigger plugin
        const useTestStore = defineStore("test", () => ({
            data: [] as any[],
        }));

        useTestStore();

        expect(pluginWasCalled).toBe(true);
    });

    it("should call storageSyncPlugin when registered", () => {
        // Track if plugin function is called
        const mockPlugin = vi.fn(storageSyncPlugin);

        // Create a new test pinia instance with plugin
        const testApp = createApp({});
        const testPinia = createPinia().use(mockPlugin);
        testApp.use(testPinia);
        setActivePinia(testPinia);

        // Create a store to trigger plugin initialization
        const useTestStore = defineStore("test", () => ({
            data: [] as any[],
        }));

        useTestStore();

        // Verify plugin was called
        expect(mockPlugin).toHaveBeenCalled();
    });

    it("should create global store registry when plugin runs", () => {
        // Create a store to trigger plugin initialization (plugin already added in beforeEach)
        const useTestStore = defineStore("test", () => ({
            data: [] as any[],
            init: vi.fn(),
        }));

        const store = useTestStore();

        // The plugin should create the registry regardless of Chrome APIs
        expect((global as any).window.__piniaStoreRegistry).toBeDefined();
        expect((global as any).window.__piniaStoreRegistry instanceof Map).toBe(true);
        expect((global as any).window.__piniaStoreRegistry.has("test")).toBe(true);
        expect((global as any).window.__piniaStoreRegistry.get("test")).toBe(store);
    });

    it("should register Chrome listeners when chrome APIs are available", () => {
        // Create a store to trigger plugin initialization (plugin already added in beforeEach)
        const useTestStore = defineStore("test", () => ({
            data: [] as any[],
            init: vi.fn(),
        }));

        useTestStore();

        // Chrome listeners should be called for first store
        expect(mockChromeStorage.onChanged.addListener).toHaveBeenCalled();
        expect(mockChromeRuntime.onMessage.addListener).toHaveBeenCalled();
    });

    describe("storage change handling", () => {
        it("should ignore non-local storage changes", () => {
            vi.useFakeTimers();
            const mockRefresh = vi.fn();
            const useTestStore = defineStore("watching", () => ({
                data: [] as any[],
                refreshFromStorage: mockRefresh,
            }));

            useTestStore();

            // Simulate sync storage change (should be ignored)
            mockStorageListener({ episodeProgress: { newValue: {} } }, "sync");

            // Give debounce time
            vi.advanceTimersByTime(200);

            expect(mockRefresh).not.toHaveBeenCalled();
            vi.useRealTimers();
        });

        it("should handle episodeProgress storage changes for watching store", async () => {
            vi.useFakeTimers();
            const mockRefresh = vi.fn();
            const useTestStore = defineStore("watching", () => ({
                data: [] as any[],
                refreshFromStorage: mockRefresh,
            }));

            useTestStore();

            // Simulate local storage change for episodeProgress
            mockStorageListener({ episodeProgress: { newValue: {}, oldValue: null } }, "local");

            // Advance timers to trigger debounced handler
            vi.advanceTimersByTime(600);

            expect(mockRefresh).toHaveBeenCalled();
            vi.useRealTimers();
        });

        it("should handle planToWatch storage changes", async () => {
            vi.useFakeTimers();
            const mockRefresh = vi.fn();
            const useTestStore = defineStore("planToWatch", () => ({
                data: [] as any[],
                refreshFromStorage: mockRefresh,
            }));

            useTestStore();

            // Simulate local storage change for planToWatch
            mockStorageListener({ planToWatch: { newValue: [], oldValue: null } }, "local");

            vi.advanceTimersByTime(600);

            expect(mockRefresh).toHaveBeenCalled();
            vi.useRealTimers();
        });

        it("should handle hiddenAnime storage changes", async () => {
            vi.useFakeTimers();
            const mockRefresh = vi.fn();
            const useTestStore = defineStore("hidden", () => ({
                data: [] as any[],
                refreshFromStorage: mockRefresh,
            }));

            useTestStore();

            // Simulate local storage change for hiddenAnime
            mockStorageListener({ hiddenAnime: { newValue: [], oldValue: null } }, "local");

            vi.advanceTimersByTime(600);

            expect(mockRefresh).toHaveBeenCalled();
            vi.useRealTimers();
        });

        it("should ignore unknown storage keys", async () => {
            vi.useFakeTimers();
            const mockRefresh = vi.fn();
            const useTestStore = defineStore("watching", () => ({
                data: [] as any[],
                refreshFromStorage: mockRefresh,
            }));

            useTestStore();

            // Simulate local storage change for unknown key
            mockStorageListener({ unknownKey: { newValue: {}, oldValue: null } }, "local");

            vi.advanceTimersByTime(600);

            expect(mockRefresh).not.toHaveBeenCalled();
            vi.useRealTimers();
        });
    });

    describe("runtime message handling", () => {
        it("should handle ANIME_STATE_CHANGED messages for episodeProgress", async () => {
            vi.useFakeTimers();
            const mockRefresh = vi.fn();
            const useTestStore = defineStore("watching", () => ({
                data: [] as any[],
                refreshFromStorage: mockRefresh,
            }));

            useTestStore();

            // Simulate runtime message
            mockMessageListener(
                { type: "ANIME_STATE_CHANGED", storageKey: "episodeProgress" },
                { tab: { id: 1 } },
            );

            vi.advanceTimersByTime(600);

            expect(mockRefresh).toHaveBeenCalled();
            vi.useRealTimers();
        });

        it("should ignore non-ANIME_STATE_CHANGED messages", async () => {
            vi.useFakeTimers();
            const mockRefresh = vi.fn();
            const useTestStore = defineStore("watching", () => ({
                data: [] as any[],
                refreshFromStorage: mockRefresh,
            }));

            useTestStore();

            // Simulate runtime message with different type
            mockMessageListener({ type: "OTHER_MESSAGE", storageKey: "episodeProgress" }, { tab: { id: 1 } });

            vi.advanceTimersByTime(600);

            expect(mockRefresh).not.toHaveBeenCalled();
            vi.useRealTimers();
        });
    });

    describe("store action hooks", () => {
        it("should hook into store actions for write tracking", async () => {
            const useTestStore = defineStore("test", {
                state: () => ({ data: [] as any[] }),
                actions: {
                    startWatching() {
                        this.data.push({ id: 1 });
                    },
                },
            });

            const store = useTestStore();

            // Action should work without errors
            await store.startWatching();

            expect(store.data.length).toBe(1);
        });
    });
});
