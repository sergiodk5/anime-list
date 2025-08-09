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
});
