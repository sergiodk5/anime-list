# Project Structure Guide

## Overview

This guide explains the architecture and organization of the Anime List Chrome Extension project. Each folder under the `src` directory has a specific purpose and contains files relevant to different parts of the Chrome extension.

## Chrome Extension Architecture

Chrome extensions have several distinct components that run in different contexts:

-   **Background Script**: Runs persistently in the background
-   **Content Script**: Injected into web pages
-   **Popup**: The UI that appears when clicking the extension icon
-   **Options Page**: Settings and configuration interface

## Source Directory Structure

```
src/
├── background/         # Background script files
├── commons/           # Shared utilities, models, and assets
├── content/           # Content script files
├── options/           # Options page files
├── popup/             # Extension popup files
├── App.vue            # Main Vue application component
└── main.ts            # Application entry point
```

## Folder Purposes

### `background/` - Background Worker

**Purpose**: Contains all files related to the extension's background script (service worker in Manifest V3).

**What it contains**:

-   Background script logic
-   Event listeners for extension lifecycle events
-   Cross-tab communication handlers
-   Background data processing

**Key characteristics**:

-   Runs persistently in the background
-   No direct UI components
-   Handles extension-wide events and state
-   Communicates with content scripts and popup

**Example files**:

```
background/
├── index.ts           # Main background script entry point
├── eventHandlers.ts   # Extension event handlers
└── messaging.ts       # Inter-component communication
```

### `content/` - Content Scripts

**Purpose**: Contains files for scripts that are injected into web pages to interact with page content.

**What it contains**:

-   Page manipulation logic
-   DOM interaction code
-   Data extraction from anime websites
-   Communication with background script

**Key characteristics**:

-   Runs in the context of web pages
-   Can access and modify page DOM
-   Limited access to Chrome APIs
-   Communicates via message passing

**Example files**:

```
content/
├── index.ts           # Main content script entry point
├── domHelpers.ts      # DOM manipulation utilities
├── dataExtractors.ts  # Extract anime data from pages
└── pageDetectors.ts   # Detect anime websites
```

### `popup/` - Extension Popup

**Purpose**: Contains all files for the popup UI that appears when users click the extension icon.

**What it contains**:

-   Vue components for popup interface
-   Popup-specific styling
-   Quick actions and controls
-   Display of current page anime information

**Key characteristics**:

-   Small, focused UI
-   Quick access to main features
-   Limited screen real estate
-   Should load quickly

**Current structure**:

```
popup/
├── index.html         # Popup HTML template
├── index.ts           # Popup entry point
└── PopupPage.vue      # Main popup Vue component
```

### `options/` - Options/Settings Page

**Purpose**: Contains files for the extension's settings and configuration interface.

**What it contains**:

-   Settings UI components
-   Configuration forms
-   User preferences management
-   Advanced features interface

**Key characteristics**:

-   Full-page interface
-   Comprehensive settings
-   More complex UI than popup
-   Persistent user configurations

**Current structure**:

```
options/
├── index.html         # Options page HTML
├── index.ts           # Options page entry point
├── OptionsPage.vue    # Main options component
├── api/               # API-related utilities
├── components/        # Reusable UI components
│   ├── HeaderLayout.vue
│   └── SidebarLayout.vue
├── layouts/           # Page layout components
│   └── DashboardLayout.vue
├── router/            # Vue router configuration
│   └── index.ts
└── views/             # Page view components
    ├── AllWatchLists.vue
    └── HomeView.vue
```

### `commons/` - Shared Resources

**Purpose**: Contains utilities, models, and resources that can be used across all other extension components.

**What it contains**:

-   TypeScript interfaces and types
-   Storage utilities
-   Business logic utilities
-   Shared constants and enums
-   Static assets (CSS, images, fonts)

**Key characteristics**:

-   Framework-agnostic code
-   Reusable across all contexts
-   Well-tested utilities
-   No UI components

**Current structure**:

```
commons/
├── assets/            # Shared static assets
│   └── main.css       # Global CSS styles
├── models/            # TypeScript interfaces and types
│   └── index.ts       # Anime, episode, storage interfaces
└── utils/             # Utility functions
    ├── index.ts       # Utility exports
    ├── storageUtil.ts # Generic storage operations
    ├── episodeProgressUtil.ts  # Episode tracking
    ├── planToWatchUtil.ts      # Plan to watch management
    ├── hiddenAnimeUtil.ts      # Hidden anime management
    └── animeUtil.ts   # High-level anime operations
```

## Cross-Component Communication

### Message Passing

Components communicate using Chrome's message passing API:

```typescript
// From content script to background
chrome.runtime.sendMessage({
    type: "EPISODE_DETECTED",
    data: episodeData,
});

// From popup to background
chrome.runtime.sendMessage({
    type: "GET_CURRENT_ANIME",
    tabId: currentTab.id,
});
```

### Shared Storage

Components share data through Chrome's storage API (abstracted through commons utilities):

```typescript
// Any component can use these utilities
import { EpisodeProgressUtil, AnimeUtil } from "@/commons/utils";

// Save episode progress
await EpisodeProgressUtil.save(animeId, progressData);

// Get anime data
const anime = await AnimeUtil.getAnimeById(animeId);
```

## Development Guidelines

### Component Separation

1. **Background**: Focus on data processing and coordination
2. **Content**: Focus on page interaction and data extraction
3. **Popup**: Focus on quick actions and status display
4. **Options**: Focus on configuration and detailed management
5. **Commons**: Focus on reusable, testable utilities

### Folder-Specific Rules

#### Background Folder

-   No Vue components
-   No direct DOM manipulation
-   Focus on extension lifecycle management
-   Handle cross-component communication

#### Content Folder

-   Minimal UI (prefer native DOM manipulation)
-   Focus on page integration
-   Robust error handling for unknown page structures
-   Respect page performance

#### Popup Folder

-   Keep bundle size small
-   Optimize for quick loading
-   Use shared components from commons when possible
-   Handle offline states gracefully

#### Options Folder

-   Can use full Vue.js features
-   Implement proper routing
-   Use Vue components for complex UI
-   Handle form validation and persistence

#### Commons Folder

-   Write framework-agnostic code
-   Ensure 100% test coverage
-   Use TypeScript for type safety
-   Follow SOLID principles

### Import Guidelines

```typescript
// ✅ Correct: Import from commons
import { EpisodeProgressUtil } from "@/commons/utils";
import type { AnimeData } from "@/commons/models";

// ❌ Avoid: Cross-component imports
import { PopupComponent } from "@/popup/components"; // Don't import popup code in content

// ✅ Correct: Background to commons
import { StorageUtil } from "@/commons/utils";

// ✅ Correct: Content to commons
import { AnimeUtil } from "@/commons/utils";
```

## File Naming Conventions

### TypeScript Files

-   Use camelCase: `episodeTracker.ts`
-   Suffix utilities with `Util`: `storageUtil.ts`
-   Use descriptive names: `animeDataExtractor.ts`

### Vue Components

-   Use PascalCase: `EpisodeList.vue`
-   Suffix with component type: `HeaderLayout.vue`
-   Use descriptive names: `AnimeSearchForm.vue`

### HTML Files

-   Use lowercase: `index.html`
-   Match the component purpose: `popup.html`, `options.html`

## Best Practices

### 1. Maintain Clear Boundaries

```typescript
// ✅ Good: Commons utility used by multiple components
// commons/utils/animeUtil.ts
export class AnimeUtil {
    static async getCurrentAnime(): Promise<AnimeData | null> {
        // Reusable logic
    }
}

// popup/PopupPage.vue
import { AnimeUtil } from "@/commons/utils";

// content/index.ts
import { AnimeUtil } from "@/commons/utils";
```

### 2. Use Commons for Shared Logic

```typescript
// ✅ Good: Shared interface in commons
// commons/models/index.ts
export interface AnimeData {
    id: string;
    title: string;
    // ...
}

// ❌ Bad: Duplicating interfaces across components
```

### 3. Keep Context-Specific Code Isolated

```typescript
// ✅ Good: DOM manipulation stays in content
// content/domHelpers.ts
export function extractAnimeTitle(): string {
    return document.querySelector('.anime-title')?.textContent || '';
}

// ✅ Good: UI logic stays in popup/options
// popup/PopupPage.vue
<template>
    <div class="popup-container">
        <!-- Popup-specific UI -->
    </div>
</template>
```

### 4. Error Handling Per Context

```typescript
// Background: Log errors, don't break extension
try {
    await processAnimeData();
} catch (error) {
    console.error("Background processing failed:", error);
    // Continue running
}

// Content: Handle page-specific errors gracefully
try {
    const animeData = extractAnimeData();
} catch (error) {
    console.warn("Could not extract anime data from this page:", error);
    // Fail silently
}

// Popup: Show user-friendly errors
try {
    const data = await loadAnimeData();
} catch (error) {
    this.showErrorMessage("Failed to load anime data");
}
```

## Testing Strategy

### Per-Folder Testing

-   **Commons**: 100% unit test coverage required
-   **Background**: Integration tests for event handling
-   **Content**: Mock DOM environments for testing
-   **Popup/Options**: Component testing with Vue Test Utils

### Test File Organization

```
test/
├── commons/           # Mirror commons structure
│   ├── models/
│   └── utils/
├── background/        # Background script tests
├── content/           # Content script tests
├── popup/             # Popup component tests
└── options/           # Options page tests
```

## Migration Between Contexts

When moving functionality between folders:

1. **Extract to Commons**: Move reusable logic to commons utilities
2. **Update Imports**: Use the new commons utilities
3. **Remove Duplicates**: Delete old context-specific code
4. **Update Tests**: Test the commons utilities thoroughly
5. **Verify All Contexts**: Ensure all components still work

## Summary

This folder structure ensures:

-   **Clear separation of concerns** between extension components
-   **Reusable code** in the commons folder
-   **Context-appropriate implementations** in each folder
-   **Maintainable architecture** that scales with the project
-   **Testable components** with clear boundaries

When adding new features, always consider which folder the code belongs in based on its purpose and which other components might need to use it.
