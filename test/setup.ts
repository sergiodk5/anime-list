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

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    mockChromeRuntime.lastError = null;
});
