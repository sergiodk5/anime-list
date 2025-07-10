# Testing Guide

## Overview

This guide will help new team members understand our testing strategy, tools, and best practices for the Anime List Chrome Extension project.

## Testing Stack

### Core Tools

-   **Vitest**: Fast unit testing framework with Vue.js support
-   **@vitest/coverage-v8**: Code coverage reporting using V8 engine
-   **jsdom**: Browser environment simulation for DOM testing
-   **Playwright**: End-to-end testing (configured but not covered in this guide)

### Project Structure

```
anime-list/
├── src/                    # Source code
│   └── commons/
│       ├── models/         # TypeScript interfaces and types
│       └── utils/          # Utility functions (our main test focus)
├── test/                   # Test files (mirrors src structure)
│   ├── setup.ts           # Test environment setup and Chrome API mocks
│   └── commons/
│       └── utils/          # Utility function tests
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
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

Key configuration points:

-   **Environment**: `jsdom` for browser-like testing
-   **Test Pattern**: `test/**/*.test.ts`
-   **Setup File**: `test/setup.ts` for Chrome API mocking
-   **Coverage**: V8 provider with 100% thresholds for utilities

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

-   `src/commons/utils/storageUtil.ts` → `test/commons/utils/storageUtil.test.ts`

### Basic Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { YourUtil } from "@/commons/utils";

describe("YourUtil", () => {
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

-   Use descriptive test names that explain the scenario and expected outcome
-   Format: `should [expected behavior] when [condition]`
-   Examples:
    -   `should return empty array when no episodes exist`
    -   `should throw error when storage is unavailable`
    -   `should update existing episode progress`

## Coverage Requirements

### Current Standards

All utility functions must maintain:

-   **Statements**: 100%
-   **Branches**: 100%
-   **Functions**: 100%
-   **Lines**: 100%

### Coverage Reports

```bash
# Generate coverage report
npm run test:unit:coverage

# View detailed HTML report
npm run test:unit:coverage:ui
```

Coverage reports show:

-   Line-by-line coverage visualization
-   Uncovered code highlighting
-   Branch coverage analysis
-   Function coverage tracking

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
npm run test:unit -- storageUtil.test.ts

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

-   [ ] Tests cover all public methods
-   [ ] Error cases are tested
-   [ ] Edge cases are considered
-   [ ] Mocks are properly reset
-   [ ] Test names are descriptive
-   [ ] Coverage requirements are met

## Additional Resources

-   [Vitest Documentation](https://vitest.dev/)
-   [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
-   [jsdom Documentation](https://github.com/jsdom/jsdom)
-   [TypeScript Testing Best Practices](https://typescript-eslint.io/docs/linting/troubleshooting#testing)

## Support

If you have questions about testing:

1. Check this guide first
2. Look at existing test files for examples
3. Run tests locally to understand current patterns
4. Ask team members for clarification on specific patterns

---

Happy Testing! 🧪
