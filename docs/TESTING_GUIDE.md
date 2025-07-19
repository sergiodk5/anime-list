# Testing Guide - Comprehensive Coverage Achievement

## Overview

This guide will help new team members understand our testing strategy, tools, and best practices for the Anime List Chrome Extension project. **We maintain 100% test coverage** across all components, with this guide documenting proven strategies for achieving perfect coverage.

## Testing Stack

### Core Tools

- **Vitest**: Fast unit testing framework with Vue.js support
- **@vitest/coverage-v8**: Code coverage reporting using V8 engine
- **jsdom**: Browser environment simulation for DOM testing
- **Playwright**: End-to-end testing (configured but not covered in this guide)

### Project Structure

```
anime-list/
├── src/                    # Source code
│   ├── content/           # Content scripts (injected into web pages)
│   ├── background/        # Service worker/background scripts
│   ├── popup/            # Extension popup UI
│   ├── options/          # Full dashboard/options page
│   └── commons/
│       ├── models/         # TypeScript interfaces and types
│       ├── services/       # Business logic services (our main test focus)
│       ├── repositories/   # Data access layer
│       └── adapters/       # External API adapters
├── test/                   # Test files (mirrors src structure)
│   ├── setup.ts           # Test environment setup and Chrome API mocks
│   ├── content/           # Content script tests
│   ├── popup/             # Popup component tests
│   ├── options/           # Options page tests
│   └── commons/
│       ├── services/       # Service layer tests
│       ├── repositories/   # Repository layer tests
│       └── adapters/       # Adapter layer tests
├── vitest.config.ts        # Vitest configuration
└── coverage/               # Generated coverage reports
```

## Getting Started

### Installation

All testing dependencies are already included in `package.json`. If you need to install them:

```bash
npm install
```

### Running Tests

```bash
# Run all tests once
npm run test:unit

# Run tests in watch mode (re-runs on file changes)
npm run test:unit:watch

# Run tests with coverage report
npm run test:unit:coverage

# Run tests with coverage and open HTML report
npm run test:unit:coverage:ui

# Run specific test file with coverage
npm run test:unit:coverage -- test/content/contentScript.test.ts
```

## 🎯 100% Coverage Achievement Strategy

### Understanding Coverage Metrics

We track four coverage metrics, all at 100%:

1. **Line Coverage**: Every executable line of code is tested
2. **Branch Coverage**: Every conditional path is tested (if/else, ternary operators, logical OR/AND)
3. **Function Coverage**: Every function is called in tests
4. **Statement Coverage**: Every statement is executed

### Coverage Analysis Workflow

When working toward 100% coverage:

1. **Start with basic functionality tests**
2. **Run coverage report to identify gaps**
3. **Analyze uncovered lines systematically**
4. **Create targeted tests for each uncovered path**
5. **Focus on branch coverage - often the trickiest to achieve**

```bash
# Generate coverage report to see uncovered lines
npm run test:unit:coverage -- test/path/to/your.test.ts

# The report will show exactly which lines/branches are uncovered
# Example output:
# | % Lines | Uncovered Line #s
# |   92.43 | 202-204,227,330-331
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

Key configuration points:

- **Environment**: `jsdom` for browser-like testing
- **Test Pattern**: `test/**/*.test.ts`
- **Setup File**: `test/setup.ts` for Chrome API mocking
- **Coverage**: V8 provider with 100% thresholds for utilities

### Chrome API Mocking (`test/setup.ts`)

Our setup file provides comprehensive Chrome extension API mocks:

```typescript
// Mocked APIs available in tests:
chrome.storage.local.get;
chrome.storage.local.set;
chrome.storage.local.remove;
chrome.storage.local.clear;
```

## Writing Tests

### Test File Structure

Tests should mirror the source structure:

- `src/commons/services/animeService.ts` → `test/commons/services/animeService.test.ts`
- `src/commons/repositories/EpisodeProgressRepository.ts` → `test/commons/repositories/episodeProgressRepository.test.ts`
- `src/commons/adapters/StorageAdapter.ts` → `test/commons/adapters/storageAdapter.test.ts`

### Basic Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnimeService } from "@/commons/services";

describe("AnimeService", () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();

        // Clear storage state
        (chrome.storage.local.get as any).mockResolvedValue({});
    });

    describe("methodName", () => {
        it("should handle normal case", async () => {
            // Arrange
            const expectedData = { key: "value" };

            // Act
            const result = await YourUtil.methodName();

            // Assert
            expect(result).toEqual(expectedData);
        });

        it("should handle error case", async () => {
            // Arrange
            (chrome.storage.local.get as any).mockRejectedValue(new Error("Storage error"));

            // Act & Assert
            await expect(YourUtil.methodName()).rejects.toThrow("Storage error");
        });
    });
});
```

## 🚀 Content Script Testing - Advanced Patterns

Content scripts are complex to test because they manipulate DOM, handle async operations, and interact with Chrome APIs. Here's our proven approach for achieving 100% coverage.

### DOM Environment Setup

Content scripts need a realistic DOM environment:

```typescript
import { JSDOM } from "jsdom";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Content Script", () => {
    let dom: JSDOM;
    let document: Document;
    let window: Window;

    beforeEach(() => {
        // Create realistic DOM structure that matches target websites
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head><title>Test</title></head>
            <body>
                <div class="film_list-wrap">
                    <div class="flw-item" data-testid="anime-item-1">
                        <div class="film-poster">
                            <img src="poster1.jpg" alt="Anime 1">
                        </div>
                        <div class="film-detail">
                            <h3 class="film-name">
                                <a href="/test-anime-123" title="Test Anime" class="dynamic-name">
                                    Test Anime
                                </a>
                            </h3>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);

        document = dom.window.document;
        window = dom.window as unknown as Window;

        // Setup global objects for content script environment
        global.document = document;
        global.window = window as any;

        // Mock browser APIs that content scripts use
        global.MutationObserver = vi.fn(() => ({
            observe: vi.fn(),
            disconnect: vi.fn(),
        })) as any;

        // Mock console methods to avoid noise
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});

        // Reset all mocks for clean state
        vi.clearAllMocks();
    });

    afterEach(() => {
        dom.window.close();
    });
});
```

### Testing Strategies by Coverage Type

#### 1. Line Coverage - Testing Every Executable Line

**Strategy**: Create tests that exercise every code path, including initialization, user interactions, and cleanup.

```typescript
describe("Initialization", () => {
    it("should initialize content script", async () => {
        const { AnimeService } = await import("@/commons/services");

        // Mock dependencies
        const mockAnimeService = {
            getAnimeStatus: vi.fn().mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            }),
        };
        vi.mocked(AnimeService).mockImplementation(() => mockAnimeService);

        const contentScript = await import("@/content/index");
        await contentScript.init();

        expect(console.log).toHaveBeenCalledWith("AnimeList content script loaded");
    });
});

describe("DOM Manipulation", () => {
    it("should create and add controls to anime items", async () => {
        // Setup mocks
        const { AnimeService } = await import("@/commons/services");
        const mockAnimeService = {
            getAnimeStatus: vi.fn().mockResolvedValue({
                isTracked: false,
                isPlanned: false,
                isHidden: false,
            }),
        };
        vi.mocked(AnimeService).mockImplementation(() => mockAnimeService);
        vi.mocked(PlanToWatchUtil.isPlanned).mockResolvedValue(false);

        const { initializeControls } = await import("@/content/index");
        await initializeControls();

        // Verify DOM changes
        const controls = document.querySelectorAll(".anime-list-controls");
        expect(controls.length).toBeGreaterThan(0);
    });
});
```

#### 2. Branch Coverage - Testing All Conditional Paths

**Strategy**: Identify every `if/else`, ternary operator (`? :`), and logical operator (`||`, `&&`) and create tests for both/all paths.

```typescript
// For code like: const href = titleLink.getAttribute("href") || "";
it("should handle null href attribute (testing || fallback)", async () => {
    const itemWithNullHref = document.createElement("div");
    itemWithNullHref.className = "flw-item";
    itemWithNullHref.innerHTML = `
        <div class="film-detail">
            <h3 class="film-name">
                <a title="Test Anime" class="dynamic-name">Test Anime</a>
            </h3>
        </div>
    `;

    // Mock getAttribute to return null, forcing || "" branch
    const linkElement = itemWithNullHref.querySelector(".dynamic-name");
    vi.spyOn(linkElement, "getAttribute").mockImplementation((attr) => {
        if (attr === "href") return null; // Forces || "" branch
        return "Test Anime";
    });

    const { extractAnimeData } = await import("@/content/index");
    const result = extractAnimeData(itemWithNullHref);
    expect(result).toBeNull(); // Empty href should return null
});

// For code like: const animeId = numericIdMatch ? numericIdMatch[1] : slug;
it("should handle slug without numeric ID (testing ternary operator)", async () => {
    const itemWithSlugNoId = document.createElement("div");
    itemWithSlugNoId.innerHTML = `
        <div class="film-detail">
            <h3 class="film-name">
                <a href="/watch/anime-name-without-id" title="Test" class="dynamic-name">Test</a>
            </h3>
        </div>
    `;

    const { extractAnimeData } = await import("@/content/index");
    const result = extractAnimeData(itemWithSlugNoId);

    // Should use full slug as ID when no numeric match
    expect(result?.animeId).toBe("anime-name-without-id");
});
```

#### 3. Error Handling Coverage

**Strategy**: Mock dependencies to throw errors and verify graceful handling.

```typescript
describe("Error Handling", () => {
    it("should handle storage errors gracefully", async () => {
        const { HiddenAnimeUtil, PlanToWatchUtil } = await import("@/commons/utils");

        // Force storage operations to throw errors
        vi.mocked(HiddenAnimeUtil.isHidden).mockRejectedValue(new Error("Storage error"));
        vi.mocked(PlanToWatchUtil.isPlanned).mockRejectedValue(new Error("Storage error"));

        const { initializeControls } = await import("@/content/index");

        // Should not throw, should handle errors gracefully
        await expect(initializeControls()).resolves.not.toThrow();
    });

    it("should handle button click errors", async () => {
        // Mock successful setup, then failing operation
        vi.mocked(PlanToWatchUtil.add).mockRejectedValue(new Error("Storage error"));

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // Simulate user interaction that triggers error
        const watchButton = document.querySelector('[data-testid="anime-watch-button"]');
        watchButton?.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error handling watch click:", expect.any(Error));
    });
});
```

### Advanced Testing Techniques

#### 1. Testing Async Operations with Proper Timing

```typescript
it("should handle async feedback removal", async () => {
    // Trigger action that shows feedback
    const clearButton = document.querySelector('[data-testid="anime-clear-hidden-button"]');
    clearButton?.click();

    // Wait for feedback to appear
    await new Promise((resolve) => setTimeout(resolve, 10));

    const feedbackElement = document.querySelector(".anime-list-feedback");
    expect(feedbackElement).toBeTruthy();

    // Mock the remove function to verify it's called
    const removeSpy = vi.spyOn(feedbackElement!, "remove").mockImplementation(() => {});

    // Wait for timeout to complete (original code has 2 second timeout)
    await new Promise((resolve) => setTimeout(resolve, 2100));

    expect(removeSpy).toHaveBeenCalled();
});
```

#### 2. Testing Mutation Observer Functionality

```typescript
it("should handle DOM mutations", async () => {
    let capturedCallback: MutationCallback | null = null;

    // Capture the mutation observer callback
    global.MutationObserver = vi.fn().mockImplementation((callback) => {
        capturedCallback = callback;
        return { observe: vi.fn(), disconnect: vi.fn() };
    });

    const { init } = await import("@/content/index");
    await init();

    // Test the mutation observer callback directly
    if (capturedCallback) {
        const newAnimeElement = document.createElement("div");
        newAnimeElement.className = "flw-item";

        const mutations = [
            {
                type: "childList" as const,
                addedNodes: [newAnimeElement] as any,
            },
        ] as MutationRecord[];

        expect(() => capturedCallback(mutations, {} as MutationObserver)).not.toThrow();
    }
});
```

#### 3. Testing DOM Ready State Variations

```typescript
it("should wait for DOM when document is loading", async () => {
    Object.defineProperty(document, "readyState", {
        value: "loading",
        writable: true,
        configurable: true,
    });

    const addEventListenerSpy = vi.spyOn(document, "addEventListener");

    const { init } = await import("@/content/index");
    await init();

    expect(addEventListenerSpy).toHaveBeenCalledWith("DOMContentLoaded", init);
});

it("should initialize immediately when DOM is ready", async () => {
    Object.defineProperty(document, "readyState", {
        value: "complete",
        writable: true,
        configurable: true,
    });

    const addEventListenerSpy = vi.spyOn(document, "addEventListener");

    const { init } = await import("@/content/index");
    await init();

    expect(addEventListenerSpy).not.toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));
});
```

### Systematic Coverage Improvement Process

1. **Run coverage report**: `npm run test:unit:coverage -- test/content/contentScript.test.ts`
2. **Identify uncovered lines**: Look for specific line numbers in the report
3. **Analyze code context**: Understand what conditions trigger those lines
4. **Create targeted tests**: Write tests that specifically exercise uncovered paths
5. **Verify improvement**: Re-run coverage to confirm progress

### Common Coverage Challenges and Solutions

#### Challenge: Complex Conditional Expressions

```javascript
// Complex expression with multiple branches
const title = titleLink.getAttribute("title") || titleLink.textContent?.trim() || "";
```

**Solution**: Test each fallback path separately:

```typescript
it("should fallback to textContent when title is null", async () => {
    // Mock getAttribute to return null for title
    // Mock textContent to return a value
});

it("should fallback to empty string when both title and textContent are null", async () => {
    // Mock both getAttribute and textContent to return null/empty
});
```

#### Challenge: Error Handling in Try-Catch Blocks

```javascript
try {
    await someAsyncOperation();
} catch (error) {
    console.error("Error message:", error); // This line needs coverage
}
```

**Solution**: Mock the async operation to throw:

```typescript
it("should handle async operation errors", async () => {
    vi.mocked(someAsyncOperation).mockRejectedValue(new Error("Test error"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await yourFunction();

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error message:", expect.any(Error));
});
```

### Content Script Testing Checklist

- [ ] **Initialization**: Test script loading and setup
- [ ] **DOM Manipulation**: Test all DOM changes and element creation
- [ ] **User Interactions**: Test all button clicks and form submissions
- [ ] **Async Operations**: Test all promises and setTimeout/setInterval usage
- [ ] **Error Handling**: Test all try-catch blocks and error scenarios
- [ ] **Edge Cases**: Test with missing DOM elements, invalid data, etc.
- [ ] **Mutation Observer**: Test dynamic content detection
- [ ] **Storage Integration**: Test all Chrome storage operations
- [ ] **CSS Injection**: Test style injection and removal
- [ ] **Cleanup**: Test proper cleanup and memory management

## Basic Testing Patterns

### Testing Patterns

#### 1. Chrome Storage Testing

```typescript
it("should save data to chrome storage", async () => {
    const testData = { id: "123", name: "Test Anime" };

    await YourUtil.save("anime123", testData);

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
        storageKey: { anime123: testData },
    });
});

it("should retrieve data from chrome storage", async () => {
    const mockData = { storageKey: { anime123: { name: "Test" } } };
    (chrome.storage.local.get as any).mockResolvedValue(mockData);

    const result = await YourUtil.get("anime123");

    expect(result).toEqual({ name: "Test" });
});
```

#### 2. Error Handling Testing

```typescript
it("should handle storage errors gracefully", async () => {
    (chrome.storage.local.get as any).mockRejectedValue(new Error("Storage unavailable"));

    await expect(YourUtil.getData()).rejects.toThrow("Storage unavailable");
});

it("should return default value when data not found", async () => {
    (chrome.storage.local.get as any).mockResolvedValue({});

    const result = await YourUtil.getWithDefault("missing-key", "default");

    expect(result).toBe("default");
});
```

#### 3. Edge Cases Testing

```typescript
it("should handle empty storage", async () => {
    (chrome.storage.local.get as any).mockResolvedValue({});

    const result = await YourUtil.getAll();

    expect(result).toEqual({});
});

it("should handle malformed data", async () => {
    (chrome.storage.local.get as any).mockResolvedValue({
        storageKey: "invalid-json",
    });

    const result = await YourUtil.getAll();

    expect(result).toEqual({});
});
```

#### 4. Vue Component Testing

```typescript
import { mount } from "@vue/test-utils";
import PopupPage from "@/popup/PopupPage.vue";

// Mock Chrome APIs for component tests
const mockOpenOptionsPage = vi.fn();
global.chrome = {
    runtime: {
        openOptionsPage: mockOpenOptionsPage,
    },
} as any;

it("should render component correctly", () => {
    const wrapper = mount(PopupPage);
    expect(wrapper.exists()).toBe(true);
    // Use data-testid attributes for robust element selection
    expect(wrapper.find('[data-testid="anime-popup"]').exists()).toBe(true);
});

it("should handle user interactions", async () => {
    const wrapper = mount(PopupPage);
    // Use data-testid instead of CSS classes for test selectors
    const button = wrapper.find('[data-testid="options-button"]');

    await button.trigger("click");

    expect(mockOpenOptionsPage).toHaveBeenCalledTimes(1);
});

it("should handle Chrome API errors gracefully", async () => {
    mockOpenOptionsPage.mockImplementationOnce(() => {
        throw new Error("Chrome API error");
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const wrapper = mount(PopupPage);
    const button = wrapper.find('[data-testid="options-button"]');

    await button.trigger("click");

    expect(consoleSpy).toHaveBeenCalledWith("Failed to open options page:", expect.any(Error));
    consoleSpy.mockRestore();
});
```

### Vue Component Testing Best Practices

- **Use data-testid attributes**: Instead of CSS classes, use `data-testid` attributes for element selection in tests. This ensures tests remain stable even when styling changes.

    ```vue
    <!-- In component template -->
    <button data-testid="submit-button" class="btn btn-primary">Submit</button>
    ```

    ```typescript
    // In test file
    const button = wrapper.find('[data-testid="submit-button"]');
    ```

- **Test component structure**: Verify that all key elements are rendered correctly using data-testid selectors.
- **Test user interactions**: Simulate clicks, form submissions, and other user events.
- **Test error handling**: Ensure components handle API errors and edge cases gracefully.
- **Mock external dependencies**: Always mock Chrome APIs and other external services.
- **Maintain 100% coverage**: All Vue components should have comprehensive test coverage.

## Test Organization

### Describe Blocks

Use nested `describe` blocks for clear organization:

```typescript
describe("StorageUtil", () => {
    describe("get", () => {
        it("should retrieve existing data");
        it("should return undefined for missing data");
        it("should handle storage errors");
    });

    describe("set", () => {
        it("should save data successfully");
        it("should handle storage errors");
    });
});
```

### Test Naming Convention

- Use descriptive test names that explain the scenario and expected outcome
- Format: `should [expected behavior] when [condition]`
- Examples:
    - `should return empty array when no episodes exist`
    - `should throw error when storage is unavailable`
    - `should update existing episode progress`

## Coverage Requirements

### Current Standards

All utilities and components must maintain:

- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

**Coverage applies to:**

- All service classes in `src/commons/services/`
- Repository classes in `src/commons/repositories/`
- Adapter classes in `src/commons/adapters/`
- Vue components in `src/popup/`, `src/options/`
- Business logic in `src/background/`, `src/content/`

### Coverage Reports

```bash
# Generate coverage report
npm run test:unit:coverage

# View detailed HTML report
npm run test:unit:coverage:ui
```

Coverage reports show:

- Line-by-line coverage visualization
- Uncovered code highlighting
- Branch coverage analysis
- Function coverage tracking

## Best Practices

### 1. Test Independence

```typescript
beforeEach(() => {
    // Reset all mocks to ensure test isolation
    vi.clearAllMocks();

    // Reset Chrome storage state
    (chrome.storage.local.get as any).mockResolvedValue({});
});
```

### 2. Comprehensive Error Testing

Always test error paths:

```typescript
it("should handle chrome storage errors", async () => {
    const storageError = new Error("Storage quota exceeded");
    (chrome.storage.local.set as any).mockRejectedValue(storageError);

    await expect(YourUtil.save(data)).rejects.toThrow("Storage quota exceeded");
});
```

### 3. Mock Verification

Verify that mocks are called correctly:

```typescript
it("should call chrome storage with correct parameters", async () => {
    await YourUtil.save("key", { data: "value" });

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
        expectedKey: { key: { data: "value" } },
    });
    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
});
```

### 4. Data Validation Testing

Test input validation and sanitization:

```typescript
it("should validate required fields", async () => {
    await expect(YourUtil.save("", {})).rejects.toThrow("ID is required");
});

it("should sanitize input data", async () => {
    const input = { id: "  123  ", name: "Test" };
    await YourUtil.save(input);

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
        key: { "123": { id: "123", name: "Test" } },
    });
});
```

## 🔍 Coverage Analysis and Debugging

### Reading Coverage Reports

When coverage is less than 100%, the report shows exactly what's missing:

```bash
# Example coverage output
-------------------------|---------|----------|---------|---------|-------------------
File                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------------|---------|----------|---------|---------|-------------------
content/index.ts         |   92.43 |    84.48 |     100 |   92.43 | 202-204,227,330-331
-------------------------|---------|----------|---------|---------|-------------------
```

**How to interpret**:

- **Lines 202-204**: These are consecutive uncovered lines (likely an error handling block)
- **Line 227**: Single uncovered line (possibly a cleanup operation)
- **Lines 330-331**: Another error handling block

### Systematic Coverage Investigation

1. **Open the source file** and examine the uncovered lines
2. **Understand the context** - what conditions trigger these lines?
3. **Identify the test needed** - what scenario would execute this code?
4. **Create targeted tests** - write specific tests for these scenarios

### Example Coverage Investigation

For uncovered lines 202-204 in error handling:

```typescript
// Source code (lines 202-204)
} catch (error) {
    console.error("Error handling clear hidden click:", error);
    showFeedback(button, "Error occurred", "error");
}
```

**Analysis**: This catch block is uncovered, meaning we need a test where `HiddenAnimeUtil.clear()` throws an error.

**Solution**:

```typescript
it("should handle error in clear hidden button functionality", async () => {
    // Mock clear to throw an error
    vi.mocked(HiddenAnimeUtil.clear).mockRejectedValue(new Error("Storage error"));

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const clearButton = document.querySelector('[data-testid="anime-clear-hidden-button"]');
    clearButton?.click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    // This test will now cover lines 202-204
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error handling clear hidden click:", expect.any(Error));
});
```

### Branch Coverage Deep Dive

Branch coverage is often the trickiest to achieve. Every conditional creates branches:

```typescript
// This creates 2 branches
if (condition) {
    // Branch 1: condition is true
} else {
    // Branch 2: condition is false
}

// This creates 2 branches
const value = someValue || "default";
// Branch 1: someValue is truthy
// Branch 2: someValue is falsy, use "default"

// This creates 2 branches
const result = condition ? "yes" : "no";
// Branch 1: condition is true, return "yes"
// Branch 2: condition is false, return "no"
```

**Strategy**: For each conditional, create tests that exercise both paths.

### Coverage Debugging Tools

#### 1. HTML Coverage Report

```bash
npm run test:unit:coverage:ui
```

Opens an interactive HTML report showing:

- Line-by-line coverage visualization
- Highlighted uncovered code
- Branch coverage details
- Function coverage tracking

#### 2. Detailed Console Output

```bash
npm run test:unit:coverage -- --reporter=verbose
```

Shows detailed information about what's covered and what's missing.

#### 3. Single File Coverage

```bash
npm run test:unit:coverage -- test/specific/file.test.ts
```

Focus on one file at a time for easier analysis.

## Debugging Tests

### Console Output

Use `console.log` sparingly in tests, prefer descriptive assertions:

```typescript
// ❌ Avoid
console.log("Result:", result);

// ✅ Better
expect(result).toEqual(expectedValue);
expect(result).toHaveProperty("id", "123");
```

### Test Debugging

```bash
# Run specific test file
npm run test:unit -- animeService.test.ts

# Run tests with verbose output
npm run test:unit -- --reporter=verbose

# Run single test by name pattern
npm run test:unit -- --grep "should save data"
```

### Mock Debugging

Inspect mock calls:

```typescript
it("should call storage correctly", async () => {
    await YourUtil.method();

    // Debug mock calls
    console.log(chrome.storage.local.set.mock.calls);

    expect(chrome.storage.local.set).toHaveBeenCalled();
});
```

## 📚 Lessons Learned - 100% Coverage Journey

### From 80% to 100% Coverage: Key Insights

Our content script journey from 80.47% to 100% coverage taught us valuable lessons:

#### 1. Error Handling is Often Uncovered

**Problem**: Try-catch blocks frequently contain uncovered lines because errors don't occur in normal flow.

**Solution**: Systematically mock dependencies to throw errors:

```typescript
// For every async operation that has error handling
vi.mocked(dependency.method).mockRejectedValue(new Error("Test error"));
```

#### 2. Branch Coverage Requires Methodical Approach

**Problem**: Logical operators (`||`, `&&`) and ternary operators (`? :`) create multiple branches.

**Solution**: Test each branch explicitly:

```typescript
// For: const value = getValue() || "default";
it("should use returned value when getValue() returns truthy", () => {
    vi.mocked(getValue).mockReturnValue("actual");
    // Test that "actual" is used
});

it("should use default when getValue() returns falsy", () => {
    vi.mocked(getValue).mockReturnValue(null);
    // Test that "default" is used
});
```

#### 3. DOM Ready State Matters

**Problem**: Content scripts behave differently based on `document.readyState`.

**Solution**: Test all ready states:

```typescript
["loading", "interactive", "complete"].forEach((readyState) => {
    it(`should handle document.readyState: ${readyState}`, () => {
        Object.defineProperty(document, "readyState", { value: readyState });
        // Test behavior
    });
});
```

#### 4. Mock Function Calls Need Verification

**Problem**: Tests pass but don't verify that correct functions were called.

**Solution**: Always verify mock interactions:

```typescript
it("should call correct storage method", async () => {
    await yourFunction();

    expect(mockedMethod).toHaveBeenCalledWith(expectedParams);
    expect(mockedMethod).toHaveBeenCalledTimes(1);
});
```

### Testing Patterns That Achieve 100% Coverage

#### 1. Comprehensive Test Structure

```typescript
describe("Component/Function", () => {
    describe("Normal Operations", () => {
        it("should handle typical use case");
        it("should handle edge cases");
    });

    describe("Error Scenarios", () => {
        it("should handle dependency errors");
        it("should handle invalid input");
        it("should handle network failures");
    });

    describe("Branch Coverage", () => {
        it("should handle condition=true path");
        it("should handle condition=false path");
        it("should handle null/undefined values");
    });
});
```

#### 2. Systematic Error Testing

```typescript
// Test every async operation's error path
const asyncMethods = [
    "HiddenAnimeUtil.isHidden",
    "PlanToWatchUtil.isPlanned",
    "HiddenAnimeUtil.add",
    "PlanToWatchUtil.add",
];

asyncMethods.forEach((method) => {
    it(`should handle ${method} errors`, async () => {
        vi.mocked(eval(method)).mockRejectedValue(new Error("Test error"));
        // Test error handling
    });
});
```

#### 3. Edge Case Matrix

```typescript
// Test all combinations of conditions
const testCases = [
    { isHidden: true, isPlanned: false, expected: "hidden" },
    { isHidden: false, isPlanned: true, expected: "planned" },
    { isHidden: false, isPlanned: false, expected: "normal" },
    { isHidden: true, isPlanned: true, expected: "hidden" }, // hidden takes precedence
];

testCases.forEach(({ isHidden, isPlanned, expected }) => {
    it(`should handle isHidden=${isHidden}, isPlanned=${isPlanned}`, async () => {
        vi.mocked(HiddenAnimeUtil.isHidden).mockResolvedValue(isHidden);
        vi.mocked(PlanToWatchUtil.isPlanned).mockResolvedValue(isPlanned);

        const result = await processAnimeItem(element);
        expect(result.state).toBe(expected);
    });
});
```

### Time-Saving Coverage Strategies

#### 1. Start with Coverage Report

Always begin with a coverage report to identify gaps:

```bash
npm run test:unit:coverage -- test/your-file.test.ts
```

#### 2. Focus on Uncovered Lines First

Don't write random tests - target specific uncovered lines:

```typescript
// Instead of: "should test the function"
// Write: "should cover error handling in line 204"
it("should handle storage error in clear functionality (lines 202-204)", async () => {
    // Specific test for those exact lines
});
```

#### 3. Use Coverage-Driven Test Development

1. Write basic functionality tests
2. Run coverage report
3. Identify gaps
4. Write targeted tests for gaps
5. Repeat until 100%

### Common Pitfalls and Solutions

#### Pitfall 1: Testing Implementation Details

```typescript
// ❌ Don't test internal implementation
expect(internalPrivateMethod).toHaveBeenCalled();

// ✅ Test observable behavior
expect(resultingDOMChange).toHaveOccurred();
expect(chromeAPI.storage.set).toHaveBeenCalledWith(expectedData);
```

#### Pitfall 2: Ignoring Async Timing

```typescript
// ❌ Not waiting for async operations
button.click();
expect(result).toBe(expected); // May fail due to timing

// ✅ Properly handle async operations
button.click();
await new Promise((resolve) => setTimeout(resolve, 0));
expect(result).toBe(expected);
```

#### Pitfall 3: Not Testing All Branches

```typescript
// For: const value = condition ? "yes" : "no";

// ❌ Only testing one branch
it("should return yes when condition is true", () => {
    // Only tests the "yes" branch
});

// ✅ Testing both branches
it("should return yes when condition is true", () => {
    // Tests "yes" branch
});
it("should return no when condition is false", () => {
    // Tests "no" branch
});
```

### 100% Coverage Maintenance

#### 1. Coverage Gates in CI/CD

Ensure coverage never drops below 100%:

```json
// vitest.config.ts
coverage: {
    thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100
    }
}
```

#### 2. New Code Coverage Requirements

Every new feature must include:

- [ ] Happy path tests
- [ ] Error handling tests
- [ ] Edge case tests
- [ ] Branch coverage tests
- [ ] 100% coverage verification

#### 3. Refactoring with Coverage Protection

When refactoring:

1. Run tests to ensure current functionality works
2. Refactor code
3. Run coverage to ensure no coverage loss
4. Update tests if needed to maintain 100%

### Success Metrics

Achieving 100% coverage means:

- ✅ Every line of code is executed in tests
- ✅ Every conditional branch is tested
- ✅ Every function is called
- ✅ Every error scenario is handled
- ✅ Code is production-ready and reliable

## Common Pitfalls

### 1. Not Resetting Mocks

```typescript
// ❌ Tests may interfere with each other
describe("Tests", () => {
    it("test 1", () => {
        /* ... */
    });
    it("test 2", () => {
        /* may fail due to previous test */
    });
});

// ✅ Clean state for each test
beforeEach(() => {
    vi.clearAllMocks();
});
```

### 2. Testing Implementation Details

```typescript
// ❌ Testing internal implementation
expect(internalMethod).toHaveBeenCalled();

// ✅ Testing behavior and outcomes
expect(result).toEqual(expectedResult);
expect(chrome.storage.local.set).toHaveBeenCalledWith(expectedData);
```

### 3. Incomplete Error Testing

```typescript
// ❌ Only testing happy path
it("should save data", async () => {
    const result = await save(data);
    expect(result).toBeTruthy();
});

// ✅ Testing both success and failure
it("should save data successfully", async () => {
    const result = await save(data);
    expect(result).toBeTruthy();
});

it("should handle save errors", async () => {
    (chrome.storage.local.set as any).mockRejectedValue(new Error("Failed"));
    await expect(save(data)).rejects.toThrow("Failed");
});
```

## Contributing

### Before Submitting

1. Run all tests: `npm run test:unit`
2. Check coverage: `npm run test:unit:coverage`
3. Ensure 100% coverage for new utilities
4. Follow naming conventions
5. Include both success and error test cases

### Code Review Checklist

- [ ] Tests cover all public methods
- [ ] Error cases are tested
- [ ] Edge cases are considered
- [ ] Mocks are properly reset
- [ ] Test names are descriptive
- [ ] Coverage requirements are met

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [jsdom Documentation](https://github.com/jsdom/jsdom)
- [TypeScript Testing Best Practices](https://typescript-eslint.io/docs/linting/troubleshooting#testing)

## Support

If you have questions about testing:

1. Check this guide first
2. Look at existing test files for examples
3. Run tests locally to understand current patterns
4. Ask team members for clarification on specific patterns

---

Happy Testing! 🧪
