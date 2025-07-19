# AnimeService - Comprehensive Guide

## Overview

The `AnimeService` class is the **primary business logic layer** for all anime management operations in the Chrome extension. It follows a clean service-repository pattern, coordinating between multiple repositories to provide high-level anime tracking workflows.

## Architecture

```
AnimeService (Business Logic)
    │
    ├── EpisodeProgressRepository (Currently watching anime)
    ├── PlanToWatchRepository (Planned anime)
    ├── HiddenAnimeRepository (Hidden anime)
    └── AnimeStateValidator (Business rules)
```

### Data Models

The system uses three core data models:

#### `AnimeData` (Base)

```typescript
interface AnimeData {
    animeId: string; // Unique identifier
    animeTitle: string; // Display title
    animeSlug: string; // URL-friendly identifier
}
```

#### `EpisodeProgress` (Watching Progress)

```typescript
interface EpisodeProgress extends AnimeData {
    currentEpisode: string; // Episode identifier
    dateWatched: string; // ISO timestamp
    totalEpisodes?: number; // Optional total count
    seasonYear?: number; // Optional season info
    imageUrl?: string; // Optional thumbnail
}
```

#### `PlanToWatch` (Planned Anime)

```typescript
interface PlanToWatch extends AnimeData {
    dateAdded: string; // ISO timestamp
    plannedFor?: string; // Optional target date
    priority?: number; // Optional priority level
    reason?: string; // Optional reason for planning
}
```

#### `AnimeStatus` (Comprehensive Status)

```typescript
interface AnimeStatus {
    isTracked: boolean; // Currently watching
    isPlanned: boolean; // Planned to watch
    isHidden: boolean; // Hidden from view
    progress?: EpisodeProgress; // Current progress if tracked
    plan?: PlanToWatch; // Plan details if planned
}
```

## Core Methods

### Status Management

#### `getAnimeStatus(animeId: string): Promise<AnimeStatus>`

Gets the complete status of an anime across all repositories:

```typescript
const animeService = new AnimeService();
const status = await animeService.getAnimeStatus("anime-123");

if (status.isTracked) {
    console.log(`Currently on episode: ${status.progress.currentEpisode}`);
}
if (status.isPlanned) {
    console.log(`Planned on: ${status.plan.dateAdded}`);
}
if (status.isHidden) {
    console.log("This anime is hidden");
}
```

### Episode Progress Management

#### `updateEpisodeProgress(animeId: string, episode: string): Promise<ActionResult>`

Updates or creates episode progress:

```typescript
const result = await animeService.updateEpisodeProgress("anime-123", "episode-5");

if (result.success) {
    console.log(`Updated to episode ${episode}`);
} else {
    console.error(`Failed: ${result.error}`);
}
```

#### `startTracking(animeData: AnimeData, episode?: string): Promise<ActionResult>`

Begins tracking an anime (removes from plan if exists):

```typescript
const animeData = {
    animeId: "anime-123",
    animeTitle: "My Hero Academia",
    animeSlug: "my-hero-academia",
};

const result = await animeService.startTracking(animeData, "episode-1");
```

#### `stopTracking(animeId: string): Promise<ActionResult>`

Removes an anime from tracking:

```typescript
const result = await animeService.stopTracking("anime-123");
```

### Plan to Watch Management

#### `addToPlan(animeData: AnimeData): Promise<ActionResult>`

Adds an anime to the plan to watch list:

```typescript
const result = await animeService.addToPlan(animeData);
```

#### `removeFromPlan(animeId: string): Promise<ActionResult>`

Removes an anime from the plan:

```typescript
const result = await animeService.removeFromPlan("anime-123");
```

### Hidden Anime Management

#### `hideAnime(animeId: string): Promise<ActionResult>`

Hides an anime (removes from other lists):

```typescript
const result = await animeService.hideAnime("anime-123");
```

#### `unhideAnime(animeId: string): Promise<ActionResult>`

Removes an anime from the hidden list:

```typescript
const result = await animeService.unhideAnime("anime-123");
```

### Data Retrieval

#### `getAllWatchingAnime(): Promise<EpisodeProgress[]>`

Gets all currently tracked anime:

```typescript
const watching = await animeService.getAllWatchingAnime();
console.log(`Currently watching ${watching.length} anime`);
```

#### `getAllPlannedAnime(): Promise<PlanToWatch[]>`

Gets all planned anime:

```typescript
const planned = await animeService.getAllPlannedAnime();
```

#### `getAllHiddenAnime(): Promise<string[]>`

Gets all hidden anime IDs:

```typescript
const hidden = await animeService.getAllHiddenAnime();
```

## Business Rules

The AnimeService enforces these business rules:

1. **Mutual Exclusivity**: An anime cannot be both tracked and planned
2. **Hidden Overrides**: Hidden anime are removed from tracking and planning
3. **State Transitions**: Starting tracking automatically removes from plan
4. **Data Validation**: All anime data is validated before operations

## Error Handling

All service methods return `ActionResult` objects:

```typescript
interface ActionResult {
    success: boolean;
    error?: string;
}
```

Example usage:

```typescript
const result = await animeService.startTracking(animeData);

if (!result.success) {
    // Show error to user
    showErrorToast(result.error);
    return;
}

// Success - update UI
updateWatchingList();
```

## Usage Patterns

### Content Script Integration

```typescript
import { AnimeService } from "@/commons/services";

const animeService = new AnimeService();

async function handleStartWatching(animeData: AnimeData) {
    const result = await animeService.startTracking(animeData);

    if (result.success) {
        showSuccessToast("Started watching!");
    } else {
        showErrorToast(result.error);
    }
}
```

### Vue Component Integration

```typescript
// In a Vue component
import { AnimeService } from "@/commons/services";

export default {
    setup() {
        const animeService = new AnimeService();

        const watchingAnime = ref([]);

        const loadWatchingAnime = async () => {
            watchingAnime.value = await animeService.getAllWatchingAnime();
        };

        return {
            watchingAnime,
            loadWatchingAnime,
        };
    },
};
```

## Testing

The AnimeService is fully tested with 100% coverage. Test examples:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnimeService } from "@/commons/services";

describe("AnimeService", () => {
    let animeService: AnimeService;

    beforeEach(() => {
        vi.clearAllMocks();
        animeService = new AnimeService();
    });

    it("should start tracking anime successfully", async () => {
        const animeData = {
            animeId: "test-123",
            animeTitle: "Test Anime",
            animeSlug: "test-anime",
        };

        const result = await animeService.startTracking(animeData);

        expect(result.success).toBe(true);
    });
});
```

## Migration from AnimeUtil

If upgrading from the old AnimeUtil system:

### Before (AnimeUtil):

```typescript
import { AnimeUtil } from "@/commons/utils";

const status = await AnimeUtil.getAnimeStatus("anime-123");
await AnimeUtil.startTracking(animeData);
```

### After (AnimeService):

```typescript
import { AnimeService } from "@/commons/services";

const animeService = new AnimeService();
const status = await animeService.getAnimeStatus("anime-123");
await animeService.startTracking(animeData);
```

## Performance Considerations

- **Repository Caching**: Repositories handle their own caching
- **Batch Operations**: Use Promise.all for multiple operations
- **Error Resilience**: Service handles repository errors gracefully
- **Type Safety**: Full TypeScript support prevents runtime errors

## Extension Points

The service can be extended by:

1. **Custom Repositories**: Inject custom repository implementations
2. **Additional Validators**: Extend AnimeStateValidator for new rules
3. **Event Hooks**: Add callbacks for state changes
4. **Custom Storage**: Replace StorageAdapter for different storage backends

This architecture provides a clean, testable, and maintainable foundation for all anime operations in the extension.
