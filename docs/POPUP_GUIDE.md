# Popup Development Guide

## Overview

This guide provides comprehensive documentation for developing and extending the Chrome extension popup component. The popup serves as the primary user interface when users click the extension icon, providing quick access to anime tracking features.

## Current Architecture

### File Structure

```
src/popup/
├── index.html         # Popup HTML entry point
├── index.ts           # Popup application bootstrap
└── PopupPage.vue      # Main popup Vue component
```

### Core Technologies

-   **Vue 3** with Composition API
-   **TypeScript** for type safety
-   **Tailwind CSS** for styling
-   **Chrome Extension APIs** for browser integration

## Current Popup Features

### 1. Brand Identity

-   **AnimeList branding** with custom icon
-   **Modern gradient design** (purple to pink)
-   **Animated background elements** for visual appeal

### 2. Quick Actions

-   **Dashboard Access**: One-click navigation to options page
-   **Chrome API Integration**: Seamless browser integration

### 3. Visual Design

-   **320x240px dimensions** (80x60 Tailwind units)
-   **Anime-themed styling** with star patterns
-   **Responsive animations** and hover effects
-   **Accessibility-compliant** button interactions

## Component Structure

### PopupPage.vue Architecture

```vue
<template>
    <!-- Main container with fixed dimensions -->
    <div
        data-testid="anime-popup"
        class="h-60 w-80"
    >
        <!-- Animated background layer -->
        <div data-testid="popup-background">
            <!-- Decorative animated elements -->
        </div>

        <!-- Content layer -->
        <div data-testid="popup-content">
            <!-- Header section -->
            <div data-testid="popup-header">
                <div data-testid="anime-icon"><!-- SVG Icon --></div>
                <h1 data-testid="popup-title">AnimeList</h1>
            </div>

            <!-- Description section -->
            <p data-testid="popup-description">Manage your anime watch list and track your progress</p>

            <!-- Action section -->
            <button
                data-testid="options-button"
                @click="openOptions"
            >
                <span data-testid="button-icon">⚙️</span>
                <span data-testid="button-text">Open Dashboard</span>
            </button>

            <!-- Footer section -->
            <div data-testid="popup-footer">
                <div data-testid="decorative-dots">
                    <!-- Animated dots -->
                </div>
            </div>
        </div>
    </div>
</template>
```

### Key Components Breakdown

#### 1. Container (`anime-popup`)

-   Fixed 320x240px dimensions
-   Gradient background
-   Overflow hidden for clean edges

#### 2. Background Layer (`popup-background`)

-   Animated decorative elements
-   Low opacity overlay
-   Pure visual enhancement

#### 3. Content Areas

-   **Header**: Branding and identity
-   **Description**: Clear value proposition
-   **Actions**: Primary user interactions
-   **Footer**: Visual polish

## Styling Guidelines

### Design System

```css
/* Color Palette */
--gradient-start: purple-600 /* #9333ea */ --gradient-middle: purple-700 /* #7c3aed */ --gradient-end: pink-600
    /* #db2777 */ --text-primary: white /* #ffffff */ --text-secondary: white/90 /* rgba(255,255,255,0.9) */ --accent:
    white/20 /* rgba(255,255,255,0.2) */ /* Typography */ --font-title: text-xl font-bold --font-body: text-sm
    --font-button: text-sm font-semibold /* Spacing */ --padding-container: 1.5rem (24px) --gap-elements: 0.75rem (12px)
    --gap-header: 0.75rem (12px);
```

### Responsive Constraints

```css
/* Fixed popup dimensions */
.popup-container {
  width: 320px;   /* w-80 */
  height: 240px;  /* h-60 */
}

/* Chrome popup limitations */
- Maximum width: ~800px
- Maximum height: ~600px
- Minimum width: 300px
- Minimum height: 200px
```

## Testing Strategy

### Test Categories

#### 1. Component Rendering Tests

```typescript
// Verify all elements render correctly
expect(wrapper.find('[data-testid="anime-popup"]').exists()).toBe(true);
expect(wrapper.find('[data-testid="popup-header"]').exists()).toBe(true);
expect(wrapper.find('[data-testid="options-button"]').exists()).toBe(true);
```

#### 2. User Interaction Tests

```typescript
// Test button clicks and user actions
const button = wrapper.find('[data-testid="options-button"]');
await button.trigger("click");
expect(mockOpenOptionsPage).toHaveBeenCalledTimes(1);
```

#### 3. Chrome API Integration Tests

```typescript
// Test Chrome extension API interactions
mockOpenOptionsPage.mockImplementationOnce(() => {
    throw new Error("Chrome API error");
});
// Verify graceful error handling
```

#### 4. Accessibility Tests

```typescript
// Verify semantic HTML and accessibility
expect(button.element.tagName).toBe("BUTTON");
expect(title.element.tagName).toBe("H1");
```

### Testing Best Practices

-   **Use data-testid attributes** for element selection
-   **Mock Chrome APIs** comprehensively
-   **Test error handling** for all Chrome API calls
-   **Verify accessibility** compliance
-   **Maintain 100% coverage** for all popup code

## Future Development Areas

### Planned Features

#### 1. Current Page Anime Detection

```typescript
// Future implementation
interface CurrentAnimeData {
    title: string;
    episode: number;
    status: "watching" | "completed" | "plan-to-watch";
    progress: number;
}

// Popup will show current anime from active tab
const currentAnime = await getCurrentPageAnime();
```

#### 2. Quick Episode Tracking

```vue
<!-- Future episode tracking UI -->
<div data-testid="episode-tracker">
  <span>{{ currentAnime.title }}</span>
  <div class="episode-controls">
    <button @click="decrementEpisode">-</button>
    <span>Episode {{ currentEpisode }}</span>
    <button @click="incrementEpisode">+</button>
  </div>
</div>
```

#### 3. Quick Status Changes

```vue
<!-- Future status change UI -->
<div data-testid="status-controls">
  <button @click="markCompleted">✓ Complete</button>
  <button @click="addToPlan">+ Plan to Watch</button>
  <button @click="removeFromList">✗ Remove</button>
</div>
```

#### 4. Recent Activity Summary

```vue
<!-- Future activity display -->
<div data-testid="recent-activity">
  <h3>Recent Activity</h3>
  <ul>
    <li v-for="activity in recentActivities">
      {{ activity.title }} - Episode {{ activity.episode }}
    </li>
  </ul>
</div>
```

### Expansion Guidelines

#### File Organization for Growth

```
src/popup/
├── index.html
├── index.ts
├── PopupPage.vue          # Main container component
├── components/            # Future popup-specific components
│   ├── AnimeDetector.vue  # Current anime detection
│   ├── EpisodeTracker.vue # Quick episode controls
│   ├── StatusChanger.vue  # Status modification
│   └── ActivitySummary.vue # Recent activity
├── composables/           # Vue composition functions
│   ├── useCurrentAnime.ts # Current anime detection logic
│   ├── useEpisodeTracking.ts # Episode management
│   └── usePopupState.ts   # Popup-specific state
└── utils/                 # Popup-specific utilities
    ├── popupLayoutHelper.ts # Layout calculations
    └── chromeApiWrapper.ts  # Chrome API abstractions
```

#### Component Communication Pattern

```typescript
// Future composable for popup state management
export function usePopupState() {
    const currentAnime = ref<AnimeData | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const loadCurrentAnime = async () => {
        isLoading.value = true;
        try {
            // Detect anime from current tab
            currentAnime.value = await detectCurrentPageAnime();
        } catch (err) {
            error.value = "Failed to detect anime";
        } finally {
            isLoading.value = false;
        }
    };

    return {
        currentAnime,
        isLoading,
        error,
        loadCurrentAnime,
    };
}
```

#### Layout Expansion Strategy

```vue
<!-- Future expandable popup design -->
<template>
    <div
        class="popup-container"
        :class="{ expanded: showDetails }"
    >
        <!-- Always visible: Header + Primary action -->
        <div class="popup-core">
            <!-- Current header content -->
        </div>

        <!-- Conditionally visible: Extended features -->
        <div
            v-if="showDetails"
            class="popup-extended"
        >
            <AnimeDetector />
            <EpisodeTracker v-if="currentAnime" />
            <StatusChanger v-if="currentAnime" />
            <ActivitySummary />
        </div>

        <!-- Toggle for extended view -->
        <button
            @click="toggleDetails"
            class="expand-toggle"
        >
            {{ showDetails ? "−" : "+" }}
        </button>
    </div>
</template>
```

## Development Workflow

### Adding New Features

#### 1. Plan the Feature

-   Define user stories and acceptance criteria
-   Design the UI layout within popup constraints
-   Plan data flow and Chrome API interactions

#### 2. Create Components

```bash
# Create new popup component
touch src/popup/components/NewFeature.vue

# Create corresponding test
touch test/popup/components/NewFeature.test.ts

# Create composable if needed
touch src/popup/composables/useNewFeature.ts
```

#### 3. Update Main Component

```vue
<!-- Add to PopupPage.vue -->
<script setup lang="ts">
import NewFeature from "./components/NewFeature.vue";
import { useNewFeature } from "./composables/useNewFeature";

const { featureState, featureActions } = useNewFeature();
</script>

<template>
    <div data-testid="anime-popup">
        <!-- ...existing content... -->
        <NewFeature
            :state="featureState"
            @action="featureActions.handleAction"
        />
    </div>
</template>
```

#### 4. Add Tests

```typescript
// test/popup/components/NewFeature.test.ts
import { mount } from "@vue/test-utils";
import NewFeature from "@/popup/components/NewFeature.vue";

describe("NewFeature", () => {
    it("should render correctly", () => {
        const wrapper = mount(NewFeature);
        expect(wrapper.find('[data-testid="new-feature"]').exists()).toBe(true);
    });

    // Add comprehensive tests
});
```

#### 5. Update Documentation

-   Update this guide with new features
-   Add usage examples
-   Document any new patterns or conventions

### Performance Considerations

#### Bundle Size Management

```typescript
// Use dynamic imports for optional features
const HeavyComponent = defineAsyncComponent(() => import("./components/HeavyComponent.vue"));

// Lazy load based on user interaction
const showAdvanced = ref(false);
const AdvancedFeatures = computed(() => (showAdvanced.value ? HeavyComponent : null));
```

#### Loading Optimization

```typescript
// Prioritize critical popup content
onMounted(async () => {
    // Load essential data first
    await loadCriticalData();

    // Load optional data after initial render
    nextTick(() => {
        loadOptionalData();
    });
});
```

## API Integration Patterns

### Chrome Extension APIs

#### Tab Information

```typescript
// Get current tab information
export async function getCurrentTab(): Promise<chrome.tabs.Tab> {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    return tab;
}
```

#### Message Passing

```typescript
// Send messages to content scripts
export async function sendToContentScript(message: any) {
    const tab = await getCurrentTab();
    return chrome.tabs.sendMessage(tab.id!, message);
}

// Send messages to background script
export async function sendToBackground(message: any) {
    return chrome.runtime.sendMessage(message);
}
```

#### Storage Operations

```typescript
// Use commons utilities for consistency
import { AnimeUtil, EpisodeProgressUtil } from "@/commons/utils";

// Popup-specific data operations
export class PopupDataService {
    static async getCurrentAnimeData(): Promise<AnimeData | null> {
        const tab = await getCurrentTab();
        // Extract anime data from current page
        return AnimeUtil.extractFromUrl(tab.url);
    }

    static async updateEpisodeProgress(animeId: string, episode: number) {
        return EpisodeProgressUtil.updateEpisode(animeId, episode);
    }
}
```

## Error Handling Strategies

### Chrome API Errors

```typescript
// Robust Chrome API interaction
export async function safeOpenOptionsPage(): Promise<boolean> {
    try {
        if (typeof chrome !== "undefined" && chrome?.runtime?.openOptionsPage) {
            await chrome.runtime.openOptionsPage();
            return true;
        } else {
            console.warn("Chrome extension API not available");
            return false;
        }
    } catch (error) {
        console.error("Failed to open options page:", error);
        return false;
    }
}
```

### User-Friendly Error Messages

```vue
<template>
    <div class="popup-container">
        <!-- Error state -->
        <div
            v-if="error"
            data-testid="error-message"
            class="error-banner"
        >
            <span>{{ error.message }}</span>
            <button @click="retryAction">Retry</button>
        </div>

        <!-- Loading state -->
        <div
            v-else-if="loading"
            data-testid="loading-spinner"
        >
            <span>Loading...</span>
        </div>

        <!-- Normal content -->
        <div v-else>
            <!-- Popup content -->
        </div>
    </div>
</template>
```

## Accessibility Guidelines

### Semantic HTML

```vue
<template>
    <!-- Use proper heading hierarchy -->
    <h1 data-testid="popup-title">AnimeList</h1>

    <!-- Use button elements for actions -->
    <button
        type="button"
        @click="openOptions"
    >
        Open Dashboard
    </button>

    <!-- Use proper ARIA labels -->
    <div
        role="status"
        aria-live="polite"
    >
        {{ statusMessage }}
    </div>
</template>
```

### Keyboard Navigation

```vue
<script setup lang="ts">
// Handle keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
        case "Enter":
        case " ":
            if (event.target === optionsButton.value) {
                openOptions();
            }
            break;
        case "Escape":
            // Close popup or cancel action
            break;
    }
};

onMounted(() => {
    document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    document.removeEventListener("keydown", handleKeydown);
});
</script>
```

### Screen Reader Support

```vue
<template>
    <!-- Provide descriptive labels -->
    <button
        aria-label="Open anime dashboard in new tab"
        data-testid="options-button"
    >
        <span aria-hidden="true">⚙️</span>
        Open Dashboard
    </button>

    <!-- Announce dynamic content changes -->
    <div
        role="alert"
        aria-live="assertive"
        v-if="importantMessage"
    >
        {{ importantMessage }}
    </div>
</template>
```

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Update dependencies** when new versions are available
2. **Review Chrome API changes** for compatibility
3. **Test across different Chrome versions** for stability
4. **Monitor popup performance** and bundle size
5. **Update documentation** as features are added

### Version Migration Strategy

When updating popup functionality:

1. **Maintain backward compatibility** with existing user data
2. **Provide smooth upgrade paths** for new features
3. **Test migration scenarios** thoroughly
4. **Document breaking changes** clearly

### Code Quality Standards

-   **TypeScript strict mode** enabled
-   **ESLint and Prettier** for code formatting
-   **100% test coverage** for all popup code
-   **Vue 3 Composition API** patterns
-   **Tailwind CSS** for consistent styling

## Conclusion

This guide provides the foundation for popup development and expansion. As new features are added, this document should be updated to reflect the current architecture and best practices.

Key principles for popup development:

1. **Keep it fast and lightweight**
2. **Prioritize user experience**
3. **Maintain consistent styling**
4. **Test everything thoroughly**
5. **Plan for future growth**
6. **Follow accessibility guidelines**
7. **Handle errors gracefully**

For questions or suggestions about popup development, refer to this guide and update it as the project evolves.
