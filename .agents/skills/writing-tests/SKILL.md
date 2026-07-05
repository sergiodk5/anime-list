---
name: writing-tests
description: Guides writing Vitest tests for Chrome extension code. Use when creating tests, improving coverage, or testing Vue components, content scripts, or Chrome APIs.
---

# Writing Tests

Testing patterns for the AnimeList Chrome extension using Vitest.

## Commands

```bash
npm run test:unit              # Run all tests
npm run test:unit:watch        # Watch mode for TDD
npm run test:unit:coverage     # Coverage report
npm run test:unit:coverage -- test/path/file.test.ts  # Single file
```

## Test File Structure

Mirror source structure: `src/commons/services/animeService.ts` → `test/commons/services/animeService.test.ts`

## Basic Template

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("ComponentName", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (chrome.storage.local.get as any).mockResolvedValue({});
    });

    describe("methodName", () => {
        it("should handle normal case", async () => {
            const result = await method();
            expect(result).toEqual(expected);
        });

        it("should handle error case", async () => {
            (chrome.storage.local.get as any).mockRejectedValue(new Error("Storage error"));
            await expect(method()).rejects.toThrow("Storage error");
        });
    });
});
```

## Chrome API Mocking

Mocks are set up in `test/setup.ts`. Available APIs:

```typescript
chrome.storage.local.get
chrome.storage.local.set
chrome.storage.local.remove
chrome.storage.local.clear
```

### Usage Patterns

```typescript
// Mock successful retrieval
(chrome.storage.local.get as any).mockResolvedValue({ key: { data: "value" } });

// Mock storage error
(chrome.storage.local.set as any).mockRejectedValue(new Error("Quota exceeded"));

// Verify calls
expect(chrome.storage.local.set).toHaveBeenCalledWith({ key: data });
expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
```

## Content Script Testing (JSDOM)

```typescript
// @vitest-environment jsdom
import { JSDOM } from "jsdom";
import { beforeEach, afterEach, describe, it, vi } from "vitest";

describe("Content Script", () => {
    let dom: JSDOM;

    beforeEach(() => {
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html><body>
                <div class="flw-item" data-testid="anime-item">
                    <a href="/anime-123" class="dynamic-name">Test Anime</a>
                </div>
            </body></html>
        `);
        global.document = dom.window.document;
        global.window = dom.window as any;

        global.MutationObserver = vi.fn(() => ({
            observe: vi.fn(),
            disconnect: vi.fn(),
        })) as any;

        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.clearAllMocks();
    });

    afterEach(() => {
        dom.window.close();
    });
});
```

## Vue Component Testing

```typescript
import { mount } from "@vue/test-utils";
import Component from "@/popup/Component.vue";

it("should render correctly", () => {
    const wrapper = mount(Component);
    expect(wrapper.find('[data-testid="element"]').exists()).toBe(true);
});

it("should handle interactions", async () => {
    const wrapper = mount(Component);
    await wrapper.find('[data-testid="button"]').trigger("click");
    expect(mockFunction).toHaveBeenCalled();
});
```

Always use `data-testid` attributes for element selection, not CSS classes.

## Branch Coverage Patterns

Every conditional creates branches that need testing:

```typescript
// For: const value = getValue() || "default";
it("should use returned value when truthy", () => {
    vi.mocked(getValue).mockReturnValue("actual");
    // Verify "actual" is used
});

it("should use default when falsy", () => {
    vi.mocked(getValue).mockReturnValue(null);
    // Verify "default" is used
});

// For: const result = condition ? "yes" : "no";
it("should return yes when condition is true", () => { /* ... */ });
it("should return no when condition is false", () => { /* ... */ });
```

## Error Handling Coverage

Test every try-catch block:

```typescript
it("should handle async operation errors", async () => {
    vi.mocked(asyncOperation).mockRejectedValue(new Error("Test error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await functionWithTryCatch();

    expect(consoleSpy).toHaveBeenCalledWith("Error message:", expect.any(Error));
});
```

## Async Testing

```typescript
// Wait for promises to resolve
await new Promise((resolve) => setTimeout(resolve, 0));

// Wait for DOM updates
await wrapper.vm.$nextTick();

// Wait for specific timeout
vi.useFakeTimers();
vi.advanceTimersByTime(2000);
vi.useRealTimers();
```

## Coverage Requirements

- Statements: 85%+
- Branches: 80%+
- Functions: 85%+
- Lines: 85%+

### Reading Coverage Reports

```
File                     | % Stmts | % Branch | Uncovered Line #s
content/index.ts         |   92.43 |    84.48 | 202-204,227
```

Lines 202-204 are uncovered - examine the source to understand what conditions trigger those lines, then write targeted tests.

## Test Organization

```typescript
describe("Service", () => {
    describe("Normal Operations", () => {
        it("should handle typical use case");
        it("should handle edge cases");
    });

    describe("Error Scenarios", () => {
        it("should handle dependency errors");
        it("should handle invalid input");
    });

    describe("Branch Coverage", () => {
        it("should handle condition=true path");
        it("should handle condition=false path");
    });
});
```

## Naming Convention

Format: `should [expected behavior] when [condition]`

- `should return empty array when no episodes exist`
- `should throw error when storage is unavailable`
- `should update existing episode progress`

## Common Pitfalls

1. **Not resetting mocks**: Always use `vi.clearAllMocks()` in `beforeEach`
2. **Testing implementation**: Test behavior/outcomes, not internal methods
3. **Missing error tests**: Test both success and failure paths
4. **Ignoring async timing**: Use proper async patterns with await

## Checklist

- [ ] Happy path tests
- [ ] Error handling tests
- [ ] Edge case tests
- [ ] Branch coverage (all conditionals)
- [ ] Mocks properly reset
- [ ] Descriptive test names
- [ ] data-testid for DOM selection
