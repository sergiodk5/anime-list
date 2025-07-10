# Options Page Development Guide

## Overview

This guide provides comprehensive documentation for developing and extending the Chrome extension options page. The options page serves as the full-featured dashboard for managing anime watch lists, providing a complete interface for anime tracking and management.

## Current Architecture

### File Structure

```
src/options/
├── index.html              # Options page HTML entry point
├── index.ts                # Options application bootstrap
├── OptionsPage.vue         # Main options Vue component
├── api/                    # API integration (future expansion)
├── components/             # Reusable UI components
│   ├── HeaderLayout.vue    # Top navigation and breadcrumbs
│   └── SidebarLayout.vue   # Side navigation menu
├── layouts/                # Page layout templates
│   └── DashboardLayout.vue # Main dashboard layout wrapper
├── router/                 # Vue Router configuration
│   └── index.ts            # Routes definition
└── views/                  # Page-level components
    ├── HomeView.vue        # Dashboard home page
    └── AllWatchLists.vue   # Watch lists management page
```

### Core Technologies

- **Vue 3** with Composition API
- **Vue Router** for single-page application navigation
- **Pinia** for state management
- **TypeScript** for type safety
- **Tailwind CSS** for styling and glass-morphism effects
- **Chrome Extension APIs** for browser integration

## Current Options Features

### 1. Modern Anime-Themed UI

- **Glass-morphism design** with backdrop blur effects
- **Purple-to-pink gradients** for anime aesthetic
- **Darkness (KonoSuba) branding** with consistent icon usage
- **Animated background particles** for visual appeal
- **Responsive design** supporting multiple screen sizes

### 2. Navigation System

- **Sidebar Navigation**: Fixed sidebar with brand and menu items
- **Breadcrumb Navigation**: Context-aware page navigation
- **Router Integration**: Vue Router for seamless page transitions
- **Active State Management**: Visual feedback for current page

### 3. Dashboard Features

- **Welcome Section**: Branded introduction with anime theming
- **Statistics Cards**: Watching, completed, and plan-to-watch counters
- **Quick Actions**: Direct access to key features
- **Recent Activity**: Latest anime tracking activity

### 4. Watch Lists Management

- **All Watch Lists View**: Comprehensive list management
- **Status Categories**: Currently watching, completed, plan to watch
- **Search and Filter**: Find specific anime quickly
- **Progress Tracking**: Episode progress management

## Component Architecture

### 1. OptionsPage.vue (Root Component)

```vue
<template>
    <DashboardLayout>
        <template #content>
            <RouterView />
        </template>
    </DashboardLayout>
</template>
```

**Purpose**: Serves as the root component that wraps all options pages in the dashboard layout.

**Key Features**:

- Provides layout structure for all pages
- Houses the router view for page navigation
- Ensures consistent layout across all options pages

### 2. DashboardLayout.vue (Layout Template)

```vue
<template>
    <div class="flex h-screen bg-linear-to-br from-purple-600 via-purple-700 to-pink-600">
        <!-- Animated background pattern -->
        <div class="fixed inset-0 opacity-10">
            <!-- Decorative animated elements -->
        </div>

        <SidebarLayout />

        <!-- Main Content Area -->
        <div class="flex flex-1 flex-col">
            <HeaderLayout />
            <main class="flex-1 overflow-y-auto p-6">
                <slot name="content"></slot>
            </main>
        </div>
    </div>
</template>
```

**Purpose**: Provides the main dashboard layout structure with sidebar and header.

**Key Features**:

- Full-screen gradient background
- Animated background particles
- Flexible content area with slot system
- Responsive layout structure

### 3. SidebarLayout.vue (Navigation Component)

```vue
<template>
    <aside class="flex w-64 flex-col border-r border-white/20 bg-black/30 text-white backdrop-blur-xs">
        <!-- Logo/Brand Section -->
        <div class="flex h-16 items-center justify-center border-b border-white/20 bg-black/40">
            <div class="flex items-center gap-3">
                <div
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/20 backdrop-blur-xs"
                >
                    <img
                        src="/assets/images/darkness_32x32.png"
                        alt="Darkness from KonoSuba"
                        class="h-6 w-6 rounded-sm"
                    />
                </div>
                <span class="text-lg font-bold tracking-tight text-white drop-shadow-md">AnimeList</span>
            </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 space-y-2 p-4">
            <RouterLink
                to="/"
                class="navigation-item"
            >
                <span>🏠</span>
                <span>Home</span>
            </RouterLink>
            <RouterLink
                to="/watch-lists"
                class="navigation-item"
            >
                <span>📺</span>
                <span>Watch Lists</span>
            </RouterLink>
            <!-- Additional nav items -->
        </nav>
    </aside>
</template>
```

**Purpose**: Provides consistent navigation and branding across all pages.

**Key Features**:

- Fixed 256px width sidebar
- Darkness (KonoSuba) brand icon integration
- Glass-morphism styling with backdrop blur
- Active state management for current page
- Emoji-based icon system

### 4. HeaderLayout.vue (Top Navigation Component)

```vue
<template>
    <header class="border-b border-white/20 bg-black/20 px-6 py-4 backdrop-blur-xs">
        <div class="flex items-center justify-between">
            <!-- Breadcrumb Navigation -->
            <nav class="flex items-center space-x-2 text-sm text-white/80">
                <RouterLink
                    to="/"
                    class="hover:text-white"
                    >Dashboard</RouterLink
                >
                <span
                    v-if="currentPageName !== 'Home'"
                    class="text-white/60"
                    >•</span
                >
                <span
                    v-if="currentPageName !== 'Home'"
                    class="font-medium text-white"
                    >{{ currentPageName }}</span
                >
            </nav>

            <!-- Header Actions -->
            <div class="flex items-center gap-3">
                <button class="glass-button">
                    <span>⚙️</span>
                    <span>Settings</span>
                </button>
            </div>
        </div>
    </header>
</template>
```

**Purpose**: Provides contextual navigation and page-specific actions.

**Key Features**:

- Dynamic breadcrumb generation
- Glass-morphism header styling
- Responsive action buttons
- Context-aware page titles

### 5. HomeView.vue (Dashboard Home Page)

```vue
<template>
    <div class="space-y-8">
        <!-- Welcome Section -->
        <div class="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xs">
            <div class="mb-6 flex items-center gap-4">
                <div class="brand-icon-large">
                    <span>🎌</span>
                </div>
                <div>
                    <h1 class="text-3xl font-bold text-white drop-shadow-md">Welcome to AnimeList</h1>
                    <p class="text-lg text-white/80 drop-shadow-xs">Your ultimate anime tracking companion</p>
                </div>
            </div>
        </div>

        <!-- Quick Stats Grid -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div class="stat-card">
                <span>▶️</span>
                <div>
                    <h3>Currently Watching</h3>
                    <p class="text-2xl font-bold text-purple-200">12</p>
                </div>
            </div>
            <!-- Additional stat cards -->
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- Action cards -->
        </div>
    </div>
</template>
```

**Purpose**: Serves as the main dashboard landing page with overview and quick actions.

**Key Features**:

- Welcome section with anime branding
- Statistics cards with glass-morphism styling
- Quick action buttons for common tasks
- Responsive grid layouts

### 6. AllWatchLists.vue (Watch Lists Management)

```vue
<template>
    <div class="space-y-8">
        <!-- Page Header -->
        <div class="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xs">
            <div class="flex items-center gap-4">
                <div class="brand-icon-large">
                    <span>📺</span>
                </div>
                <div>
                    <h1 class="text-3xl font-bold text-white drop-shadow-md">All Watch Lists</h1>
                    <p class="text-lg text-white/80 drop-shadow-xs">Manage your anime collections</p>
                </div>
            </div>
        </div>

        <!-- Filter and Search -->
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <!-- Filter controls -->
        </div>

        <!-- Watch Lists Grid -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <!-- Watch list cards -->
        </div>
    </div>
</template>
```

**Purpose**: Provides comprehensive watch list management interface.

**Key Features**:

- Search and filter functionality
- Responsive grid layout for lists
- Glass-morphism card styling
- Intuitive list management actions

## Router Configuration

### Routes Definition

```typescript
const router = createRouter({
    history: createMemoryHistory(),
    routes: [
        {
            path: "/",
            name: "home",
            component: HomeView,
        },
        {
            path: "/watch-lists",
            name: "watch-lists",
            component: () => import("@/options/views/AllWatchLists.vue"),
        },
        // Future routes can be added here
    ],
});
```

**Key Features**:

- Memory history for Chrome extension compatibility
- Lazy loading for performance optimization
- Named routes for programmatic navigation
- Extensible structure for future pages

## Styling Guidelines

### Glass-Morphism Pattern

```css
/* Primary glass cards */
.glass-card-primary {
    @apply rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm;
}

/* Secondary glass cards */
.glass-card-secondary {
    @apply rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm;
}

/* Interactive glass elements */
.glass-interactive {
    @apply transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20;
}
```

### Color System

```css
/* Background gradients */
.anime-gradient {
    @apply bg-linear-to-br from-purple-600 via-purple-700 to-pink-600;
}

/* Text hierarchy */
.text-primary {
    @apply text-white drop-shadow-md;
}

.text-secondary {
    @apply text-white/90 drop-shadow-sm;
}

.text-tertiary {
    @apply text-white/80 drop-shadow-sm;
}
```

## Testing Strategy

### Component Testing

Each options component includes comprehensive tests:

```typescript
// Example test structure
describe("HomeView", () => {
    it("should render welcome section correctly", () => {
        const wrapper = mount(HomeView);
        expect(wrapper.find('[data-testid="welcome-section"]').exists()).toBe(true);
    });

    it("should display stats cards", () => {
        const wrapper = mount(HomeView);
        expect(wrapper.find('[data-testid="stats-section"]').exists()).toBe(true);
    });
});
```

### Data-TestId Guidelines

All interactive elements include `data-testid` attributes:

```vue
<!-- Navigation elements -->
<nav data-testid="sidebar-nav">
    <RouterLink data-testid="nav-home" to="/">Home</RouterLink>
</nav>

<!-- Content sections -->
<section data-testid="welcome-section">
    <h1 data-testid="welcome-title">Welcome</h1>
</section>

<!-- Interactive elements -->
<button data-testid="primary-action">Click Me</button>
```

## Development Guidelines

### Adding New Pages

1. **Create the Vue component** in `src/options/views/`
2. **Add the route** to `router/index.ts`
3. **Update navigation** in `SidebarLayout.vue`
4. **Create comprehensive tests** in `test/options/`
5. **Follow UI Design Guide** patterns for styling
6. **Include data-testid** attributes for testing

### Component Development

1. **Follow composition API** patterns
2. **Use TypeScript** for type safety
3. **Apply glass-morphism** styling consistently
4. **Include responsive design** considerations
5. **Add proper accessibility** attributes
6. **Maintain 100% test coverage**

### Styling Requirements

1. **Use Tailwind CSS** exclusively (no custom CSS)
2. **Follow glass-morphism** patterns from UI Design Guide
3. **Include hover animations** and interactive states
4. **Ensure responsive design** with mobile-first approach
5. **Add proper drop-shadows** for text readability
6. **Use anime color palette** consistently

## Integration Patterns

### Chrome Extension Integration

```typescript
// Opening options page from popup
const openOptions = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/options/index.html") });
};
```

### State Management

```typescript
// Pinia store integration (future)
import { defineStore } from "pinia";

export const useAnimeStore = defineStore("anime", {
    state: () => ({
        watchLists: [],
        currentAnime: null,
    }),
    actions: {
        async loadWatchLists() {
            // Implementation
        },
    },
});
```

## Performance Considerations

### Lazy Loading

- Route-based code splitting
- Component lazy loading for large features
- Image lazy loading for anime artwork

### Memory Management

- Proper component cleanup
- Event listener management
- Chrome API resource disposal

## Future Expansion

### Planned Features

1. **Anime Search Integration**: MyAnimeList API integration
2. **Progress Tracking**: Episode progress management
3. **Recommendations**: AI-powered anime suggestions
4. **Statistics Dashboard**: Advanced analytics
5. **Export/Import**: Data portability features

### Architecture Considerations

- **API Layer**: Dedicated API service architecture
- **State Management**: Pinia stores for complex state
- **Caching Strategy**: Local storage optimization
- **Offline Support**: Service worker integration

## Troubleshooting

### Common Issues

1. **Router not working**: Ensure memory history is used
2. **Styles not applying**: Check Tailwind build process
3. **Tests failing**: Verify Vue Test Utils setup
4. **Chrome APIs not available**: Check manifest permissions

### Debugging Tips

1. **Use Vue Devtools** for component inspection
2. **Check console errors** for runtime issues
3. **Verify test coverage** with vitest coverage reports
4. **Use network tab** for API debugging

---

_This guide provides the foundation for developing robust, beautiful, and maintainable options page features for the AnimeList Chrome extension!_ ✨
