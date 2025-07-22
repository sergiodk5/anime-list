import { beforeEach, vi } from "vitest";

// Mock Chrome APIs for testing
const mockChromeStorage = {
    local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
    },
    sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
    },
    onChanged: {
        addListener: vi.fn(),
    },
};

const mockChromeRuntime = {
    sendMessage: vi.fn(),
    onMessage: {
        addListener: vi.fn(),
    },
};

// Global Chrome mock
vi.stubGlobal("chrome", {
    storage: mockChromeStorage,
    runtime: mockChromeRuntime,
});

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
});
