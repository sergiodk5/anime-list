# Write Tests

Your goal is to create comprehensive unit tests for the AnimeList Chrome Extension.

Ask for the file or function to test if not provided.

## Testing Standards:

### Test Framework:

- Use Vitest with `@vitest/coverage-v8`
- Import from: `import { describe, it, expect, beforeEach, vi } from "vitest"`
- Environment: jsdom (configured automatically)

### Test File Structure:

- Mirror source structure: `src/commons/services/animeService.ts` → `test/commons/services/animeService.test.ts`
- Use descriptive test names that explain the behavior being tested
- Group related tests with `describe` blocks

### Chrome API Mocking:

- Chrome APIs are pre-mocked in `test/setup.ts`
- Available mocks: `chrome.storage.local.get/set/remove/clear`
- Always clear mocks in `beforeEach`: `vi.clearAllMocks()`

### Coverage Requirements:

- Maintain 100% test coverage for all service and repository classes
- Test all code paths including error conditions
- Test edge cases and boundary conditions

### Test Patterns:

#### Service Layer Tests:

```typescript
describe("AnimeService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        chrome.storage.local.get.mockImplementation(() => Promise.resolve({}));
    });

    it("should handle successful service operations", async () => {
        chrome.storage.local.set.mockResolvedValue();
        // Test implementation
    });

    it("should handle service errors gracefully", async () => {
        chrome.storage.local.set.mockRejectedValue(new Error("Storage error"));
        // Test error handling
    });
});
```

#### Vue Component Tests:

- Test component rendering and interactions
- Mock storage utilities and test data flow
- Test `data-testid` attributes for UI testing
- Use Vue Test Utils for component testing

### Type Safety:

- Use proper TypeScript types for test data
- Import interfaces from `src/commons/models/index.ts`
- Mock return types should match actual function signatures

### Documentation:

- Include comments for complex test scenarios
- Explain the purpose of each test group
- Document any special mock setups or test data requirements
