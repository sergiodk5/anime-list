# AnimeUtil Class - Comprehensive Guide

## Overview

The `AnimeUtil` class is the **unified high-level interface** for all anime management operations in the Chrome extension. It orchestrates interactions between multiple specialized storage utilities and provides comprehensive anime tracking workflows.

## Architecture

```
AnimeUtil (High-level API)
    │
    ├── EpisodeProgressUtil (Currently watching anime)
    ├── PlanToWatchUtil (Planned anime)
    └── HiddenAnimeUtil (Hidden anime)
```

### Data Models

The system uses three core data models:

#### `AnimeData` (Base)
```typescript
interface AnimeData {
    animeId: string;      // Unique identifier
    animeTitle: string;   // Display title
    animeSlug: string;    // URL-friendly identifier
}
```

#### `EpisodeProgress` (Currently Watching)
```typescript
interface EpisodeProgress extends AnimeData {
    currentEpisode: number;    // Current episode number
    episodeId: string;         // Current episode identifier
    lastWatched: string;       // ISO timestamp
    totalEpisodes?: number;    // Total episodes (optional)
}
```

#### `PlanToWatch` (Planned)
```typescript
interface PlanToWatch extends AnimeData {
    addedAt: string;          // ISO timestamp when added
}
```

## Core Functionalities

### 1. Status Management

#### `getAnimeStatus(animeId: string)`
**Purpose**: Get comprehensive status of any anime across all lists.

**Returns**:
```typescript
{
    isTracked: boolean;        // In episode progress (watching)
    isPlanned: boolean;        // In plan to watch list
    isHidden: boolean;         // In hidden list
    progress?: EpisodeProgress; // Full progress data if tracked
    plan?: PlanToWatch;        // Full plan data if planned
}
```

**Use Cases**:
- Determine current state before adding buttons to UI
- Check conflicts before operations
- Display appropriate controls based on status

---

### 2. Tracking Workflows

#### `startTracking(animeData: AnimeData, episodeId?: string)`
**Purpose**: Begin actively tracking an anime's episode progress.

**Workflow**:
1. ✅ **Removes** anime from Plan to Watch list (if exists)
2. ✅ **Creates** new EpisodeProgress record
3. ✅ **Sets** currentEpisode to 1
4. ✅ **Records** current timestamp as lastWatched

**Data Transformation**:
```typescript
// Input: AnimeData
{
    animeId: "anime-123",
    animeTitle: "My Hero Academia",
    animeSlug: "my-hero-academia"
}

// Output: EpisodeProgress (saved to storage)
{
    animeId: "anime-123",
    animeTitle: "My Hero Academia", 
    animeSlug: "my-hero-academia",
    currentEpisode: 1,
    episodeId: episodeId || "",
    lastWatched: "2025-07-19T10:30:00.000Z"
}
```

**Conflict Resolution**:
- If anime is in Plan to Watch → **Moves** to Currently Watching
- If anime already tracked → **Overwrites** existing progress
- Hidden status remains unchanged

---

#### `addToPlan(animeData: AnimeData)`
**Purpose**: Add anime to Plan to Watch list.

**Workflow**:
1. ✅ **Creates** PlanToWatch record
2. ✅ **Records** current timestamp as addedAt

**Data Transformation**:
```typescript
// Input: AnimeData
{
    animeId: "anime-456",
    animeTitle: "Attack on Titan",
    animeSlug: "attack-on-titan"
}

// Output: PlanToWatch (saved to storage)
{
    animeId: "anime-456",
    animeTitle: "Attack on Titan",
    animeSlug: "attack-on-titan", 
    addedAt: "2025-07-19T10:30:00.000Z"
}
```

**Conflict Resolution**:
- If anime already in plan → **Overwrites** with new timestamp
- If anime currently tracked → **Adds to plan anyway** (creates duplicate)
- Hidden status remains unchanged

---

#### `stopTracking(animeId: string)`
**Purpose**: Completely remove anime from all tracking lists.

**Workflow**:
1. ✅ **Removes** from Episode Progress (if exists)
2. ✅ **Removes** from Plan to Watch (if exists)
3. ❌ **Does NOT remove** from Hidden list

**Use Cases**:
- "Remove from lists" functionality
- Clean slate for re-adding anime
- User wants to stop tracking completely

---

### 3. Visibility Management

#### `hide(animeId: string)` / `unhide(animeId: string)`
**Purpose**: Control anime visibility in content script.

**Workflow**:
- `hide()`: Adds animeId to hidden list
- `unhide()`: Removes animeId from hidden list
- ❌ **Does NOT affect** tracking or plan status

#### `toggleHidden(animeId: string)`
**Purpose**: Toggle visibility status.

**Returns**: `boolean` - New hidden state (true = now hidden)

**Workflow**:
1. ✅ **Checks** current hidden status
2. ✅ **Toggles** to opposite state
3. ✅ **Returns** new state for UI updates

---

### 4. Progress Management

#### `updateEpisode(animeId: string, episodeNumber: number)`
**Purpose**: Update current episode for tracked anime.

**Requirements**:
- ⚠️ Anime **MUST** already be in Episode Progress
- ⚠️ Will fail silently if anime not tracked

**Workflow**:
1. ✅ **Updates** currentEpisode number
2. ✅ **Updates** lastWatched timestamp
3. ❌ **Does NOT** update episodeId

---

### 5. Data Retrieval

#### `getAllAnimeByStatus()`
**Purpose**: Get all anime organized by their current status.

**Returns**:
```typescript
{
    tracked: EpisodeProgress[];    // Currently watching
    planned: PlanToWatch[];        // Plan to watch
    hidden: string[];             // Hidden anime IDs only
}
```

**Use Cases**:
- Dashboard display
- Statistics calculation
- Bulk operations

---

#### `searchAnime(searchTerm: string)`
**Purpose**: Search across tracked and planned anime.

**Search Logic**:
- ✅ **Searches** anime titles (case-insensitive)
- ✅ **Includes** both tracked and planned anime
- ❌ **Excludes** hidden anime from results

**Returns**:
```typescript
{
    tracked: EpisodeProgress[];    // Matching tracked anime
    planned: PlanToWatch[];        // Matching planned anime  
}
```

---

#### `getStatistics()`
**Purpose**: Get comprehensive statistics for dashboard.

**Returns**:
```typescript
{
    totalTracked: number;              // Count of tracked anime
    totalPlanned: number;              // Count of planned anime  
    totalHidden: number;               // Count of hidden anime
    recentlyWatched: EpisodeProgress[]; // Last 5 watched
    recentlyPlanned: PlanToWatch[];     // Last 5 planned
}
```

**Use Cases**:
- Dashboard statistics display
- User engagement metrics
- Recent activity feeds

---

### 6. Data Management

#### `clearAll()`
**Purpose**: Nuclear option - removes ALL anime data.

**Workflow**:
1. ✅ **Clears** all episode progress
2. ✅ **Clears** all plan to watch 
3. ✅ **Clears** all hidden anime
4. ⚠️ **Irreversible** operation

---

#### `clearHidden()`
**Purpose**: Remove all hidden anime (makes them visible again).

**Workflow**:
1. ✅ **Clears** hidden anime list only
2. ❌ **Does NOT affect** tracking or plan data

---

#### `exportData()`
**Purpose**: Export all anime data for backup/migration.

**Returns**:
```typescript
{
    episodeProgress: Record<string, EpisodeProgress>;
    planToWatch: Record<string, PlanToWatch>; 
    hiddenAnime: string[];
    exportedAt: string;  // ISO timestamp
}
```

**Use Cases**:
- Data backup
- Migration between devices
- Debugging and analysis

---

## Common Workflows & Scenarios

### Scenario 1: Adding Anime to Plan While Already Planned
```typescript
// Current state: Anime already in Plan to Watch
const status = await AnimeUtil.getAnimeStatus("anime-123");
// status.isPlanned = true, status.plan = existing PlanToWatch

// User clicks "Add to Plan" again
await AnimeUtil.addToPlan(animeData);

// Result: New PlanToWatch record overwrites old one with new timestamp
// No duplicates created, just updates the "addedAt" timestamp
```

### Scenario 2: Starting to Watch Planned Anime
```typescript
// Current state: Anime in Plan to Watch
const status = await AnimeUtil.getAnimeStatus("anime-123");
// status.isPlanned = true, status.isTracked = false

// User starts watching
await AnimeUtil.startTracking(animeData, "episode-1");

// Result: 
// ✅ Removed from Plan to Watch
// ✅ Added to Episode Progress (episode 1)
// ✅ Seamless transition from planned → watching
```

### Scenario 3: What Data is Required for Each Operation

#### For `addToPlan()`:
**Required**: Complete `AnimeData`
```typescript
{
    animeId: string;     // ✅ Required - unique identifier
    animeTitle: string;  // ✅ Required - for display
    animeSlug: string;   // ✅ Required - for URL routing
}
```

#### For `startTracking()`:
**Required**: Complete `AnimeData` + Optional `episodeId`
```typescript
// Minimum required
{
    animeId: string;     // ✅ Required
    animeTitle: string;  // ✅ Required  
    animeSlug: string;   // ✅ Required
}

// Optional
episodeId?: string;      // ⚠️ Optional - defaults to ""
```

#### For Status Operations (`hide`, `unhide`, `updateEpisode`):
**Required**: Only `animeId`
```typescript
animeId: string;  // ✅ Required - that's it!
```

### Scenario 4: Complex State Transitions

```typescript
// Initial state: Fresh anime
await AnimeUtil.getAnimeStatus("anime-123");
// Result: all false, no data

// Step 1: Add to plan
await AnimeUtil.addToPlan(animeData);
// State: isPlanned=true, others false

// Step 2: Hide anime  
await AnimeUtil.hide("anime-123");
// State: isPlanned=true, isHidden=true, isTracked=false

// Step 3: Start tracking
await AnimeUtil.startTracking(animeData);
// State: isTracked=true, isHidden=true, isPlanned=false
// Note: Hidden status persists, but moved from plan to tracking

// Step 4: Unhide
await AnimeUtil.unhide("anime-123"); 
// State: isTracked=true, isHidden=false, isPlanned=false
// Perfect state: actively watching and visible
```

## Best Practices

### 1. Always Check Status First
```typescript
// ❌ Bad: Assume state
await AnimeUtil.addToPlan(animeData);

// ✅ Good: Check first
const status = await AnimeUtil.getAnimeStatus(animeData.animeId);
if (!status.isPlanned && !status.isTracked) {
    await AnimeUtil.addToPlan(animeData);
}
```

### 2. Handle State Transitions Gracefully
```typescript
// ✅ Good: Handle plan → tracking transition
const status = await AnimeUtil.getAnimeStatus(animeData.animeId);
if (status.isPlanned) {
    // User understands this will move from plan to tracking
    await AnimeUtil.startTracking(animeData, episodeId);
} else {
    await AnimeUtil.startTracking(animeData, episodeId);
}
```

### 3. Use Batch Operations for Performance
```typescript
// ✅ Good: Single call for dashboard
const stats = await AnimeUtil.getStatistics();
const allData = await AnimeUtil.getAllAnimeByStatus();

// ❌ Bad: Multiple individual calls
const tracked = await EpisodeProgressUtil.getAllAsArray();
const planned = await PlanToWatchUtil.getAllAsArray(); 
// ... individual calls
```

## Error Handling

### Silent Failures
- `updateEpisode()` on non-tracked anime → No error, no effect
- `unhide()` on non-hidden anime → No error, no effect  
- `remove()` operations on non-existent items → No error

### Data Validation
- All operations expect valid `animeId` strings
- `AnimeData` objects must have all required fields
- Timestamps are automatically generated (ISO format)

## Integration Points

### Content Script Usage
```typescript
// Check status before showing buttons
const status = await AnimeUtil.getAnimeStatus(animeId);

// Show appropriate buttons based on status
if (!status.isPlanned && !status.isTracked) {
    showPlanButton();
}
if (!status.isHidden) {
    showHideButton(); 
}
```

### Dashboard Usage
```typescript
// Get all data for display
const stats = await AnimeUtil.getStatistics();
const allAnime = await AnimeUtil.getAllAnimeByStatus();

// Display counts
displayStats(stats.totalTracked, stats.totalPlanned);

// Show recent activity
showRecentlyWatched(stats.recentlyWatched);
```

This comprehensive guide covers all `AnimeUtil` functionalities, workflows, and best practices for implementation across the Chrome extension.
