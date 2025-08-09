# Anime List Development Roadmap

> **Priority-based roadmap for AnimeList Chrome Extension**  
> Updated: July 19, 2025

---

## 🚦 Current Status

**✅ Completed:**

**✅ Completed (Aug 2025):**

- Content script integration (Watch / Hide / Plan actions)
- Chrome extension popup with dashboard navigation
- Service–repository architecture (AnimeService + repositories + adapter)
- Glass-morphism UI design system
- Pinia store layer (watching / plan / hidden) with optimistic actions & rollback
- Cross-context sync (storage + runtime messaging) & debounced refresh
- Smart stats composable (throttled, cache-aware)
- Offline action queue (persistence, backoff, conflict detection)
- Visibility-aware performance enhancements
- Undo system (bounded stack + plugin + button)
- Toast notifications, skeleton loaders, retry & error classification helpers
- 100% test coverage (613 tests across services, stores, UI, offline, undo)

**🎯 Next Phase:** Connect the backend storage system to the frontend UI

## 🚀 **HIGH PRIORITY** - Core Integration

### 📊 **Backend-Frontend Integration**

**Issue**: UI shows static data instead of real anime data from storage

    - [ ] Update HomeView statistics to use real data from AnimeService
    - [ ] Connect AllWatchLists to actual anime collections
    - [ ] Replace hardcoded counts with service layer calls

    - [ ] `composables/useAnimeStorage.ts` - wrapper for AnimeService
    - [ ] `composables/useEpisodeProgress.ts` - reactive episode tracking
    - [ ] `composables/usePlanToWatch.ts` - plan management
    - [ ] `composables/useHiddenAnime.ts` - hidden anime management

    - [ ] "Add New Anime" button functionality
    - [ ] Episode progress tracking interface
    - [ ] Plan to watch management
    - [ ] Hidden anime management UI

**Issue (Resolved)**: Static UI replaced with dynamic reactive stores & stats.

- [x] Replace static data with dynamic content (HomeView, AllWatchLists)
- [x] Create Vue composables (stats, cache, offline, visibility, action helpers)
- [x] Integrate store actions (watching / plan / hidden) with optimistic + undo
- [x] Real-time sync + cache + offline queue

### 🧩 **Missing Navigation & Routes**

**Issue**: UI elements exist but routes/functionality are missing

    - [ ] Create `/favorites` route (sidebar links to it but doesn't exist)
    - [ ] Add individual list detail routes (`/currently-watching`, `/completed`, etc.)
    - [ ] Connect "View →" buttons for proper navigation
    - [ ] Implement breadcrumb navigation

-- [ ] **Navigation Completion** - [ ] `/favorites` route implementation - [ ] List detail routes (`/currently-watching`, `/completed`, `/on-hold`, `/dropped`) - [ ] Connect all "View →" buttons - [ ] Breadcrumb / contextual navigation component

    - [ ] `AnimeCard.vue` component for displaying real anime data
    - [ ] Anime detail pages with edit/remove functionality
    - [ ] Search functionality across anime collections
    - [ ] Loading states and error boundaries

-- [ ] **UI Components** - [ ] `AnimeCard.vue` (dynamic data, progress badge, status tag) - [ ] Anime detail / edit drawer or modal - [ ] Search bar + filter panel - [ ] Reusable loading skeleton variants (list, detail) - [ ] ErrorBoundary component (slot-based)

## 🎨 **MEDIUM PRIORITY** - Enhanced Features

### 📱 **Advanced List Management**

    - [ ] Drag-and-drop for reordering anime
    - [ ] Bulk operations (multi-select, bulk status change)
    - [ ] Advanced filtering and sorting options
    - [ ] Import/export functionality

-- [ ] **Interactive Lists** - [ ] Drag-and-drop for reordering (watching list ordering) - [ ] Bulk operations (multi-select, status change) - [ ] Advanced filtering (status, progress %, hidden state) - [ ] Import/export functionality (JSON schema definition)

    - [ ] Complete anime status lifecycle (plan → watching → completed)
    - [ ] "On Hold" and "Dropped" status options
    - [ ] Automatic completion detection
    - [ ] Status change history

-- [ ] **Status System Enhancements** - [ ] Lifecycle transitions UI (plan → watching → completed) - [ ] Add On Hold / Dropped state handling - [ ] Automatic completion detection (episode == total) - [ ] Status change history (lightweight log)

### 🔗 **Content Script Enhancement**

    - [ ] Better anime page detection
    - [ ] Handle single-page applications (SPA sites)
    - [ ] Mobile-responsive content script UI
    - [ ] Enhanced error handling for edge cases

    - [ ] Current anime detection from active tab
    - [ ] Mini episode tracker in popup
    - [ ] Quick actions for current anime
    - [ ] Recent activity summary

-- [ ] **Popup Enhancement** - [ ] Current anime detection from active tab - [ ] Mini episode tracker - [ ] Quick actions (add to plan, start watching) - [ ] Recent activity summary

## 🚀 **LOW PRIORITY** - Future Enhancements

### 🌐 **External Integration**

    - [ ] Automatic anime metadata fetching
    - [ ] Cover art integration
    - [ ] Episode count and air date information
    - [ ] Sync with MyAnimeList account

-- [ ] **MyAnimeList / External API** - [ ] Metadata fetching service abstraction - [ ] Cover art integration (fallback placeholder) - [ ] Episode count & air date enrichment - [ ] Optional sync toggle per user

### 📊 **Analytics & Insights**

    - [ ] Weekly/monthly viewing patterns
    - [ ] Genre preference analysis
    - [ ] Progress velocity metrics
    - [ ] Viewing streaks and achievements

-- [ ] **Viewing Statistics (Advanced)** - [ ] Weekly/monthly viewing patterns - [ ] Genre preference analysis (after metadata) - [ ] Progress velocity metrics - [ ] Viewing streaks & achievements

### 🎯 **Smart Features**

    - [ ] Similar anime suggestions
    - [ ] Seasonal anime recommendations
    - [ ] Smart notifications for new episodes

-- [ ] **Recommendations** - [ ] Similar anime suggestions - [ ] Seasonal recommendations - [ ] Smart notifications (new episodes)

## 📅 **Development Phases**

### **Phase 1: Core Integration** (Weeks 1-2)

### **Phase 1–5 (Complete)**

- Foundation, stores, actions, UI integration, real-time sync

### **Phase 2: Interactive Features** (Weeks 3-4)

### **Phase 6–10 (Complete)**

- Aggregated stats, performance, offline, conflicts, undo

### **Phase 3: External Integration** (Weeks 5-6)

### **Phase 4: Advanced Features** (Future)

### **Phase Next: Feature Expansion** (Rolling)

- Routes & detail views, episode editor, search, management flows

### **Phase Future: Enrichment**

- External metadata, analytics, recommendations, import/export

---

## 🎯 **Success Metrics**

### **Technical Quality**

- [ ] Maintain 100% test coverage as features are added
- [ ] Zero runtime errors in production
- [ ] All UI interactions respond within 200ms
- [ ] Extension bundle stays under 1MB

### **User Experience**

- [ ] All static placeholder data replaced with real functionality
- [ ] Seamless anime tracking workflow
- [ ] Mobile-responsive design
- [ ] Accessibility compliance (WCAG 2.1 AA)

### **Feature Completeness**

- [ ] Full anime lifecycle management
- [ ] Rich metadata integration
- [ ] Cross-browser compatibility
- [ ] Chrome Web Store ready

---

_This roadmap focuses on completing the integration between the robust backend system and the beautiful frontend UI._
