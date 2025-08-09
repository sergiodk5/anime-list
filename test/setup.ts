import { beforeEach, vi } from "vitest";

// Mock Chrome APIs for testing
const mockChromeStorage = {
    local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
    },
};

const mockChromeRuntime = {
    lastError: null,
};

// Global Chrome mock
global.chrome = {
    storage: mockChromeStorage,
    runtime: mockChromeRuntime,
} as any;

// Mock matchMedia for VueUse and other browser APIs
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock console for cleaner test output
global.console = {
    ...console,
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
};

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    mockChromeRuntime.lastError = null;

    // Ensure document.body exists for each test - rely on Vitest's jsdom environment
    if (document.body) {
        document.body.innerHTML = "";
    }
});
