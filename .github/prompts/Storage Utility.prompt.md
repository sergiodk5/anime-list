# Storage Utility

Your goal is to create or modify a storage utility function for the AnimeList Chrome Extension.

Ask for the utility purpose, data model, and operations needed if not provided.

## Storage Utility Standards:

### File Location:

- Place in `src/commons/utils/`
- Use camelCase naming: `episodeProgressUtil.ts`, `planToWatchUtil.ts`
- Export a single utility object with consistent method names

### Chrome Storage API:

- Always use `chrome.storage.local` (never browser localStorage)
- Use Promise-based API with proper error handling
- Return meaningful results, not just success/failure

### Standard Method Pattern:

```typescript
import { EpisodeProgress, StorageKeys } from "../models/index.js";

export const EpisodeProgressUtil = {
    async get(animeId: string): Promise<EpisodeProgress | null> {
        // Implementation with error handling
    },

    async getAll(): Promise<{ [key: string]: EpisodeProgress }> {
        // Get all records as object
    },

    async getAllAsArray(): Promise<EpisodeProgress[]> {
        // Get all records as array
    },

    async set(data: EpisodeProgress): Promise<void> {
        // Add or update record
    },

    async remove(animeId: string): Promise<void> {
        // Remove specific record
    },

    async clear(): Promise<void> {
        // Remove all records
    },
};
```

### Error Handling:

- Wrap all chrome.storage calls in try-catch
- Log errors to console with context
- Return sensible defaults (null, empty object, empty array)
- Never throw errors to calling code

### TypeScript Types:

- Import interfaces from `src/commons/models/index.ts`
- Use proper return types for all methods
- Add JSDoc comments for complex functions

### Storage Keys:

- Use enum values from `StorageKeys` in models
- Never hardcode storage key strings
- Keep storage keys organized and documented

### Testing Considerations:

- All methods must be testable with 100% coverage
- Design for easy mocking in tests
- Avoid complex logic that's hard to test
- Return data in formats useful for UI components

### Data Validation:

- Validate required fields before storage operations
- Ensure data consistency (e.g., animeId format)
- Handle missing or malformed data gracefully

### Performance:

- Minimize storage operations (batch when possible)
- Use efficient data structures for lookups
- Consider storage size limits for large datasets
