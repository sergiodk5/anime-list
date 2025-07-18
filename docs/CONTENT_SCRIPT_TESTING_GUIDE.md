# Content Script Testing Guide - 100% Coverage Mastery

## Overview

This guide documents our proven approach to achieving 100% test coverage for Chrome extension content scripts. Content scripts are complex because they:

- Manipulate DOM elements on external websites
- Handle async operations with unpredictable timing
- Interact with Chrome APIs
- Manage user interactions and state
- Deal with various DOM ready states

Our content script achieved **perfect 100% coverage** (lines, branches, functions, statements) using the strategies documented here.

## The Journey: 80.47% → 100% Coverage

### Initial State (80.47% coverage)

- Basic functionality tests
- Happy path scenarios
- Missing error handling
- Incomplete branch coverage

### Final Achievement (100% coverage)

- 39 comprehensive tests
- All error scenarios covered
- Complete branch coverage
- Production-ready reliability

## Test Environment Setup

### Essential DOM Mocking

```typescript
import { JSDOM } from "jsdom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock utilities before importing content script
vi.mock("@/commons/utils", () => ({
    HiddenAnimeUtil: {
        add: vi.fn(),
        remove: vi.fn(),
        isHidden: vi.fn(),
        clear: vi.fn(),
    },
    PlanToWatchUtil: {
        add: vi.fn(),
        remove: vi.fn(),
        isPlanned: vi.fn(),
    },
}));

describe("Content Script", () => {
    let dom: JSDOM;
    let document: Document;
    let window: Window;

    beforeEach(() => {
        // Create realistic DOM structure matching target website
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head><title>Test</title></head>
            <body>
                <div class="film_list-wrap">
                    <div class="flw-item" data-testid="anime-item-1">
                        <div class="film-poster">
                            <img src="poster1.jpg" alt="Anime 1">
                            <a href="/watch/test-anime-123" class="film-poster-ahref">
                                <i class="fas fa-play"></i>
                            </a>
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

        // Setup globals for content script environment
        global.document = document;
        global.window = window as any;
        global.MutationObserver = vi.fn(() => ({
            observe: vi.fn(),
            disconnect: vi.fn(),
        })) as any;

        // Mock console to avoid test noise
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

## Coverage Strategy: Systematic Approach

### 1. Line Coverage (100%)

**Goal**: Every executable line runs in tests

**Strategy**: Create comprehensive test scenarios covering:

- Initialization and setup
- User interactions
- DOM manipulation
- Async operations
- Cleanup and teardown

```typescript
describe("Initialization", () => {
    it("should initialize content script", async () => {
        const { HiddenAnimeUtil, PlanToWatchUtil } = await import("@/commons/utils");

        vi.mocked(HiddenAnimeUtil.isHidden).mockResolvedValue(false);
        vi.mocked(PlanToWatchUtil.isPlanned).mockResolvedValue(false);

        const contentScript = await import("@/content/index");
        await contentScript.init();

        expect(console.log).toHaveBeenCalledWith("AnimeList content script loaded");
    });
});
```

### 2. Branch Coverage (100%)

**Goal**: Every conditional path is tested

**Strategy**: Identify all conditionals and test each branch:

#### Logical OR Operators (`||`)

```typescript
// For: const href = titleLink.getAttribute("href") || "";
it("should handle null href attribute", async () => {
    const linkElement = document.querySelector(".dynamic-name");
    vi.spyOn(linkElement, "getAttribute").mockImplementation((attr) => {
        if (attr === "href") return null; // Forces || "" branch
        return "Test";
    });

    const { extractAnimeData } = await import("@/content/index");
    const result = extractAnimeData(element);
    expect(result).toBeNull(); // Empty href returns null
});
```

#### Ternary Operators (`? :`)

```typescript
// For: const animeId = numericIdMatch ? numericIdMatch[1] : slug;
it("should use full slug when no numeric ID found", async () => {
    const element = createElementWithHref("/watch/anime-name-without-id");

    const { extractAnimeData } = await import("@/content/index");
    const result = extractAnimeData(element);

    expect(result?.animeId).toBe("anime-name-without-id"); // Tests : branch
});
```

#### If-Else Statements

```typescript
// For: if (condition) { ... } else { ... }
it("should handle condition=true path", async () => {
    // Setup to make condition true
    // Test the if branch
});

it("should handle condition=false path", async () => {
    // Setup to make condition false
    // Test the else branch
});
```

### 3. Function Coverage (100%)

**Goal**: Every function is called at least once

**Strategy**: Ensure every exported and internal function is invoked:

```typescript
describe("All Functions", () => {
    it("should call init function", async () => {
        const { init } = await import("@/content/index");
        await init(); // Covers init function
    });

    it("should call initializeControls function", async () => {
        const { initializeControls } = await import("@/content/index");
        await initializeControls(); // Covers initializeControls function
    });

    it("should call extractAnimeData function", async () => {
        const { extractAnimeData } = await import("@/content/index");
        extractAnimeData(element); // Covers extractAnimeData function
    });
});
```

### 4. Statement Coverage (100%)

**Goal**: Every statement executes in tests

**Strategy**: Often achieved automatically with line coverage, but verify all statements run:

```typescript
it("should execute all statements in complex function", async () => {
    // Setup conditions that execute every statement
    // including variable assignments, function calls, etc.
});
```

## Error Handling: The Coverage Killer

Error handling code is often uncovered because errors don't occur in normal flow. Here's how to test every error scenario:

### Mock Dependencies to Throw Errors

```typescript
describe("Error Scenarios", () => {
    it("should handle storage read errors", async () => {
        vi.mocked(HiddenAnimeUtil.isHidden).mockRejectedValue(new Error("Storage error"));

        const { initializeControls } = await import("@/content/index");
        await expect(initializeControls()).resolves.not.toThrow();
    });

    it("should handle storage write errors", async () => {
        vi.mocked(PlanToWatchUtil.add).mockRejectedValue(new Error("Storage full"));

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const button = document.querySelector('[data-testid="anime-watch-button"]');
        button?.click();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error handling watch click:", expect.any(Error));
    });
});
```

### Test All Try-Catch Blocks

```typescript
it("should handle DOM manipulation errors", async () => {
    // Mock DOM method to throw error
    const originalAppendChild = document.head.appendChild;
    document.head.appendChild = vi.fn().mockImplementation(() => {
        throw new Error("DOM manipulation error");
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
        const { init } = await import("@/content/index");
        await init();

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error initializing AnimeList content script:", expect.any(Error));
    } finally {
        document.head.appendChild = originalAppendChild;
    }
});
```

## Advanced Testing Patterns

### Testing Async Operations

```typescript
it("should handle async feedback display and removal", async () => {
    const { initializeControls } = await import("@/content/index");
    await initializeControls();

    const clearButton = document.querySelector('[data-testid="anime-clear-hidden-button"]');
    clearButton?.click();

    // Wait for feedback to appear
    await new Promise((resolve) => setTimeout(resolve, 10));

    const feedbackElement = document.querySelector(".anime-list-feedback");
    expect(feedbackElement).toBeTruthy();

    // Test timeout removal
    const removeSpy = vi.spyOn(feedbackElement!, "remove").mockImplementation(() => {});
    await new Promise((resolve) => setTimeout(resolve, 2100)); // Wait for 2s timeout

    expect(removeSpy).toHaveBeenCalled();
});
```

### Testing Mutation Observer

```typescript
it("should handle DOM mutations", async () => {
    let capturedCallback: MutationCallback | null = null;
    const originalMutationObserver = global.MutationObserver;

    global.MutationObserver = vi.fn().mockImplementation((callback) => {
        capturedCallback = callback;
        return { observe: vi.fn(), disconnect: vi.fn() };
    });

    try {
        const { init } = await import("@/content/index");
        await init();

        if (capturedCallback) {
            const newElement = document.createElement("div");
            newElement.className = "flw-item";

            const mutations = [
                {
                    type: "childList" as const,
                    addedNodes: [newElement] as any,
                },
            ] as MutationRecord[];

            expect(() => capturedCallback(mutations, {} as MutationObserver)).not.toThrow();
        }
    } finally {
        global.MutationObserver = originalMutationObserver;
    }
});
```

### Testing DOM Ready States

```typescript
["loading", "interactive", "complete"].forEach((readyState) => {
    it(`should handle document.readyState: ${readyState}`, async () => {
        Object.defineProperty(document, "readyState", {
            value: readyState,
            writable: true,
            configurable: true,
        });

        const addEventListenerSpy = vi.spyOn(document, "addEventListener");

        const { init } = await import("@/content/index");
        await init();

        if (readyState === "loading") {
            expect(addEventListenerSpy).toHaveBeenCalledWith("DOMContentLoaded", init);
        } else {
            expect(addEventListenerSpy).not.toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));
        }
    });
});
```

## Edge Cases: The Final Coverage Push

### Missing DOM Elements

```typescript
it("should handle missing container", async () => {
    const container = document.querySelector(".film_list-wrap");
    container?.remove();

    const { initializeControls } = await import("@/content/index");
    await expect(initializeControls()).resolves.not.toThrow();
});

it("should handle items without poster", async () => {
    const itemWithoutPoster = document.createElement("div");
    itemWithoutPoster.className = "flw-item";
    itemWithoutPoster.innerHTML = `
        <div class="film-detail">
            <h3 class="film-name">
                <a href="/test-anime-999" title="Test">Test</a>
            </h3>
        </div>
    `;

    const container = document.querySelector(".film_list-wrap");
    container?.appendChild(itemWithoutPoster);

    const { initializeControls } = await import("@/content/index");
    await expect(initializeControls()).resolves.not.toThrow();
});
```

### Invalid Data Scenarios

```typescript
it("should handle invalid href patterns", async () => {
    const invalidItem = document.createElement("div");
    invalidItem.innerHTML = `
        <div class="film-detail">
            <h3 class="film-name">
                <a href="invalid-url" title="Invalid">Invalid</a>
            </h3>
        </div>
    `;

    const { extractAnimeData } = await import("@/content/index");
    const result = extractAnimeData(invalidItem);
    expect(result).toBeNull();
});

it("should handle empty href", async () => {
    const emptyHrefItem = document.createElement("div");
    emptyHrefItem.innerHTML = `
        <div class="film-detail">
            <h3 class="film-name">
                <a href="" title="Empty">Empty</a>
            </h3>
        </div>
    `;

    const { extractAnimeData } = await import("@/content/index");
    const result = extractAnimeData(emptyHrefItem);
    expect(result).toBeNull();
});
```

## Coverage Verification Process

### 1. Run Coverage Report

```bash
npm run test:unit:coverage -- test/content/contentScript.test.ts
```

### 2. Analyze Uncovered Lines

```bash
# Example output showing uncovered lines
| % Lines | Uncovered Line #s
|   92.43 | 202-204,227,330-331
```

### 3. Examine Source Code

Look at the specific line numbers to understand what's not covered:

- Line 202-204: Error handling in try-catch
- Line 227: Timeout callback in async operation
- Line 330-331: Another error handling block

### 4. Create Targeted Tests

Write tests specifically for those uncovered lines:

```typescript
it("should cover lines 202-204: error handling", async () => {
    // Mock to force error that triggers lines 202-204
    vi.mocked(HiddenAnimeUtil.clear).mockRejectedValue(new Error("Storage error"));

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const button = document.querySelector('[data-testid="anime-clear-hidden-button"]');
    button?.click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error handling clear hidden click:", expect.any(Error));
});
```

### 5. Verify Improvement

Re-run coverage to confirm the lines are now covered:

```bash
npm run test:unit:coverage -- test/content/contentScript.test.ts
```

## Final Test Structure

A 100% coverage test suite should include:

```typescript
describe("Content Script", () => {
    // Test environment setup
    beforeEach(() => {
        /* DOM setup */
    });
    afterEach(() => {
        /* cleanup */
    });

    describe("Initialization", () => {
        // Basic initialization tests
    });

    describe("Controls Creation", () => {
        // DOM manipulation tests
    });

    describe("Button Functionality", () => {
        // User interaction tests
    });

    describe("CSS Injection", () => {
        // Style injection tests
    });

    describe("Hidden Anime Handling", () => {
        // State management tests
    });

    describe("Error Handling", () => {
        // All error scenarios
    });

    describe("DOM Ready State Handling", () => {
        // Different ready states
    });

    describe("Additional Coverage", () => {
        // Complex scenarios and mutation observer
    });

    describe("Edge Cases", () => {
        // All edge cases and error conditions
    });
});
```

## Success Metrics

Achieving 100% coverage for content scripts means:

- ✅ **100% Line Coverage**: Every executable line runs
- ✅ **100% Branch Coverage**: Every conditional path tested
- ✅ **100% Function Coverage**: Every function called
- ✅ **100% Statement Coverage**: Every statement executed
- ✅ **Production Ready**: All error scenarios handled
- ✅ **Maintainable**: Clear test structure and naming
- ✅ **Reliable**: Consistent test results

## Time Investment

From our experience:

- **Initial setup**: 2-3 hours (DOM mocking, basic tests)
- **80% coverage**: 4-6 hours (main functionality)
- **80% → 95%**: 3-4 hours (error handling, edge cases)
- **95% → 100%**: 2-3 hours (branch coverage, final gaps)

**Total**: 11-16 hours for perfect coverage of a complex content script.

## Maintenance

To maintain 100% coverage:

1. **Never allow coverage to drop** - set up CI/CD gates
2. **Test new features immediately** - don't accumulate technical debt
3. **Review coverage reports** - in every pull request
4. **Update tests with refactoring** - keep tests current

## Conclusion

Achieving 100% test coverage for content scripts is challenging but achievable with systematic approach:

1. **Start with comprehensive DOM mocking**
2. **Test all user interactions and DOM manipulation**
3. **Focus heavily on error handling scenarios**
4. **Systematically test every branch condition**
5. **Use coverage reports to guide your testing**
6. **Don't give up on the final 5% - it's the most valuable**

The result is production-ready, bulletproof code that users can rely on.
