# AnimeList Chrome Extension - Development Plan

> **Comprehensive development roadmap after AnimeService architecture completion**  
> Created: July 19, 2025  
> Updated: July 20, 2025 - Added Single Anime Page Modal Implementation  
> Status: Phase 0 (Single Page Modal) - Ready for Implementation

---

## 🎯 **PHASE 0: Single Anime Page Modal Implementation**

> **Priority**: IMMEDIATE - New Core Feature Request  
> **Estimated Time**: 1-2 weeks  
> **URL Pattern**: Pages containing `/watch/` path (e.g., `https://hianime.to/watch/immoral-guild-uncensored-18216`)

### **Requirements Analysis**

#### **Single Anime Page Identification**

- **URL Detection**: Page URL must contain `/watch/` path segment
- **Page Type**: Individual anime watch/detail pages (not anime listing pages)
- **Trigger**: "Anime Info" button that opens a modal with comprehensive anime management

#### **Modal Window Specifications**

**Modal Content Based on Anime Status:**

1. **Hidden Anime:**
    - ✅ "Remove from Hidden" button
    - 🚫 No other actions available

2. **Planned Anime:**
    - ✅ "Remove from Plan" button
    - ✅ "Start Watching" button (moves to watching list)
    - 🚫 Cannot hide planned anime

3. **Currently Watching Anime:**
    - ✅ "Stop Watching" button (removes from watching list)
    - ✅ Episode input/selector to update current episode
    - 🚫 Cannot plan or hide watching anime

4. **Untracked Anime (Clean State):**
    - ✅ "Add to Plan" button
    - ✅ "Hide Anime" button
    - 🚫 Cannot start watching without planning first (business rule)

#### **Toast Notification Requirements**

- **Position**: Top-right corner of page
- **Stacking**: Multiple notifications stack vertically
- **Auto-dismiss**: 3-4 second timer
- **Types**: Success (green), Error (red), Info (blue)
- **Styling**: Glass-morphism design matching extension theme

### **0.1 Content Script Architecture Refactoring**

**Objective**: Break down the 1386-line `index.ts` into modular architecture

**Current State**: Single monolithic file with all functionality
**Target State**: Clean separation of concerns with dedicated modules

#### **Proposed File Structure**

```
src/content/
├── index.ts                    # Main entry point and page detection
├── controllers/
│   ├── ListPageController.ts   # Handles anime listing pages (current functionality)
│   └── SinglePageController.ts # NEW: Handles individual anime pages
├── components/
│   ├── ui/
│   │   ├── ToastSystem.ts      # Toast notification management
│   │   ├── ModalManager.ts     # Modal window management
│   │   └── ButtonFactory.ts    # Button creation utilities
│   ├── buttons/
│   │   ├── PlanButton.ts       # Plan to watch button logic
│   │   ├── WatchingControls.ts # Episode tracking controls
│   │   ├── HideButton.ts       # Hide anime button logic
│   │   └── InfoButton.ts       # NEW: Anime info button for single pages
│   └── modals/
│       └── AnimeInfoModal.ts   # NEW: Single page anime info modal
├── services/
│   ├── PageDetector.ts         # Determines page type (list vs single)
│   ├── AnimeExtractor.ts       # Extracts anime data from DOM
│   └── BusinessRules.ts        # Centralized business rule validation
└── types/
    └── ContentTypes.ts         # Content script specific types
```

#### **Tasks for Architecture Refactoring**

- [x] **Create `PageDetector.ts`**
    - ✅ Page type detection (LIST_PAGE, SINGLE_PAGE, UNKNOWN)
    - ✅ URL pattern matching for watch pages (/watch/ detection)
    - ✅ Dual functionality support (watch pages can have both single page modal AND anime lists)
    - ✅ Helper methods: `shouldRunSinglePageLogic()`, `shouldRunListPageLogic()`

- [x] **Create `SinglePageController.ts`**
    - ✅ Anime info floating button creation with glass-morphism styling
    - ✅ CSS-based hover effects (no JavaScript event listeners)
    - ✅ Modal creation and management with proper z-index and animations
    - ✅ Status-based action buttons with episode input validation
    - ✅ Integration with AnimeService for all CRUD operations
    - ✅ Business rule enforcement in modal actions

- [x] **Create `AnimeExtractor.ts`**
    - ✅ Watch page anime data extraction with multiple selector fallbacks
    - ✅ List page compatibility maintenance for existing functionality

- [x] **Create `ToastSystem.ts`**
    - ✅ Singleton toast notification system with glass-morphism design
    - ✅ Multiple toast stacking in top-right corner
    - ✅ Auto-dismiss with configurable timing (3.5 seconds)
    - ✅ Success/Error/Info toast types with color coding
    - ✅ Click-to-dismiss functionality

- [x] **Create `ContentTypes.ts`**
    - ✅ TypeScript interfaces for AnimeData, AnimeStatus, ModalAction, Toast
    - ✅ PageType enum and ContentFeature enum for feature flags
    - ✅ Proper type safety for all content script components

- [x] **Update main `index.ts`**
    - ✅ Modular initialization based on page type detection
    - ✅ Support for both single page and list page functionality on same page
    - ✅ MutationObserver for SPA navigation handling
    - ✅ Proper error handling and logging

### **0.2 Single Page Anime Data Extraction**

**Objective**: Extract anime information from individual watch pages

**Tasks**:

- [ ] **Analyze watch page DOM structure**
    - Identify anime title selectors on watch pages
    - Identify anime ID extraction patterns
    - Map different anime sites' watch page structures

- [ ] **Create `WatchPageExtractor.ts`**

    ```typescript
    export class WatchPageExtractor {
        static extractAnimeData(): AnimeData | null {
            // Try different selectors based on site
            const titleSelectors = [
                ".ani_detail-info h2", // Common pattern 1
                ".watch-detail .title", // Common pattern 2
                "h1.anime-title", // Common pattern 3
                "[data-title]", // Fallback pattern
            ];

            // Extract from URL as fallback
            const urlMatch = window.location.href.match(/\/watch\/([^/\?]+)/);
            if (!urlMatch) return null;

            const animeId = urlMatch[1];

            // Try to get title from DOM
            let animeTitle = animeId; // Fallback to ID
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element?.textContent?.trim()) {
                    animeTitle = element.textContent.trim();
                    break;
                }
            }

            return {
                animeId,
                animeTitle,
                animeSlug: animeId.toLowerCase(),
            };
        }
    }
    ```

### **0.3 Modal UI Implementation**

**Objective**: Create responsive modal with glass-morphism design

**Tasks**:

- [ ] **Design modal layout**

    ```css
    .anime-info-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .anime-info-modal-content {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 2rem;
        min-width: 400px;
        max-width: 500px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    ```

- [ ] **Implement modal state management**
    - Open/close animations
    - Keyboard navigation (ESC to close)
    - Click outside to close
    - Prevent body scrolling when modal is open

- [ ] **Add responsive design**
    - Mobile-friendly modal sizing
    - Touch-friendly button sizes
    - Proper spacing for different screen sizes

### **0.4 Business Rule Integration**

**Objective**: Enforce same business rules as list pages in modal actions

**Tasks**:

- [ ] **Implement action validation**

    ```typescript
    class ModalActionValidator {
        static validateAction(action: string, status: AnimeStatus): boolean {
            switch (action) {
                case "addToPlan":
                    return canAddToPlan(status);
                case "startWatching":
                    return canStartWatching(status);
                case "hide":
                    return canHide(status);
                // ... other actions
            }
        }

        static getBlockedReason(action: string, status: AnimeStatus): string {
            // Return user-friendly error messages
            if (action === "hide" && status.isPlanned) {
                return "Cannot hide planned anime. Remove from plan first.";
            }
            // ... other blocked actions
        }
    }
    ```

- [ ] **Add action feedback**
    - Success toasts for completed actions
    - Error toasts for blocked actions
    - Loading states during API calls

### **0.5 Testing & Integration**

**Tasks**:

- [ ] **Create test structure for new architecture**

    ```
    test/content/
    ├── controllers/
    │   ├── SinglePageController.test.ts
    │   └── ListPageController.test.ts
    ├── components/
    │   └── modals/
    │       └── AnimeInfoModal.test.ts
    └── services/
        └── PageDetector.test.ts
    ```

- [ ] **Test single page detection**
    - Various watch page URL patterns
    - Correct page type identification
    - Anime data extraction accuracy

- [ ] **Test modal functionality**
    - Modal open/close behavior
    - Action button availability based on status
    - Toast notification integration
    - Business rule enforcement

- [ ] **Test responsive behavior**
    - Different screen sizes
    - Mobile interaction
    - Accessibility compliance

### **0.6 Documentation Updates**

**Tasks**:

- [ ] **Update content script documentation**
    - Document new architecture
    - Add usage examples for single pages
    - Update API documentation

- [ ] **Create modal design guide**
    - Glass-morphism styling patterns
    - Responsive design guidelines
    - Animation specifications

## � **CORE BUSINESS REQUIREMENTS**

### **Anime Item Logic** (Content Script - Website Integration)

1. **Anime doesn't belong to any list:**
    - ✅ User can add it to **plan list**
    - ✅ User can add it to **hidden list**

2. **Anime is on plan list:**
    - ✅ User can **remove it from plan list**
    - ❌ User can **add it to watch list** (removes from plan list automatically + episode input)
    - 🚫 User **can't add it to hidden list**

3. **Anime is on watch list:**
    - ❌ User can **remove it from watch list**
    - ❌ User can **update current episode**
    - 🚫 User **can't add it to plan list**
    - 🚫 User **can't add it to hidden list**

4. **Anime is on hidden list:**
    - ✅ User can **remove it from hidden list** (via Clear Hidden)
    - 🚫 User **can't add it to plan list**
    - 🚫 User **can't add it to watch list**

### **List Page Logic** (Options Page - Dashboard)

- **Same as Anime Item Logic** except:
    - Watch list items show **current episode display only** (no update controls)
- **Global Actions:**
    - ✅ User can **clear hidden list**
- **Toast Notifications:**
    - ❌ Every action shows **notification toast** (top-right corner)
    - ❌ Multiple actions = **stacked notifications**

## �🚦 Current State Assessment

### ✅ **COMPLETED - Architecture Foundation**

- **AnimeService Architecture**: Complete service-repository pattern with 506-line AnimeService
- **Clean Architecture**: 100% AnimeService line coverage with 459/459 tests passing (98.44% overall coverage)
- **Content Script Integration**: Working Plan/Hide buttons with AnimeService integration
- **Chrome Extension Setup**: Complete manifest v3, popup, options page, and background scripts
- **UI Design System**: Glass-morphism components with anime branding (Darkness/KonoSuba theme)
- **Git Integration**: Feature branch with comprehensive commit history

### ⚠️ **GAPS IDENTIFIED - Missing Core Features**

Based on original business requirements analysis:

1. **Watch List Functionality**: Content script has Plan/Hide but missing "Start Watching" workflow
2. **Episode Progress UI**: No interface for episode tracking (service methods exist but unused)
3. **Frontend-Backend Integration**: Options page shows static data instead of real storage data
4. **State Transition Enforcement**: Business rules not fully implemented in content script
5. **Route Architecture**: Missing individual list detail pages and favorites route

### 📊 **Current Content Script Capabilities vs Requirements**

**Currently Implemented:**

- ✅ Plan to Watch: `animeService.addToPlanToWatch()` / `removeFromPlanToWatch()`
- ✅ Hide/Unhide: `animeService.hideAnime()` / `clearAllHidden()`
- ✅ Status Checking: `animeService.getAnimeStatus()`

**Missing from Original Plan:**

- ❌ Start Watching: `animeService.startWatching()` method exists but no UI
- ❌ Episode Progress: `animeService.updateEpisodeProgress()` method exists but no UI
- ❌ Watch List Display: Currently watching anime should be shown differently from planned
- ❌ State Enforcement: Business rules not fully implemented (prevent invalid state transitions)
- ❌ Toast Notifications: No user feedback system for actions

### 🚫 **BUSINESS RULE VIOLATIONS IN CURRENT CODE**

Current content script allows these **INVALID** operations:

1. **Planned anime can be hidden** (should be blocked per business rules)
2. **Watching anime can be planned** (should be blocked per business rules)
3. **Watching anime can be hidden** (should be blocked per business rules)
4. **Hidden anime can be planned/watched** (should be blocked until unhidden)

---

## 🎯 PHASE 1: Watch List Feature Implementation (List Pages)

> **Priority**: High - Core missing functionality for anime listing pages  
> **Estimated Time**: 1-2 weeks  
> **Dependencies**: Phase 0 (architecture refactoring complete)

### 1.1 Content Script Watch List UI

**Objective**: Implement complete business rule logic for anime state management

**Tasks**:

- [x] **Create `createStartWatchingButton()` function**
    - Episode number input (1-999 range validation)
    - "Start Watching" button with episode selection
    - Glass-morphism styling consistent with existing buttons

- [x] **Create `createWatchingControls()` function**
    - Current episode display with ± buttons for increment/decrement
    - Episode input field for direct episode entry
    - "Stop Watching" button to remove from watch list

- [x] **Implement business rule enforcement in button creation**

    ```typescript
    // State-based button logic per business requirements:

    if (status.isHidden) {
        // Hidden anime: No buttons shown (only Clear Hidden globally)
        return []; // No controls
    } else if (status.isTracked) {
        // Watching: Episode controls + Stop Watching only
        return [createWatchingControls(), createStopWatchingButton()];
    } else if (status.isPlanned) {
        // Planned: Start Watching + Remove Plan (NO HIDE button)
        return [createStartWatchingButton(), createRemovePlanButton()];
    } else {
        // Not tracked: Plan + Hide buttons
        return [createPlanButton(), createHideButton()];
    }
    ```

- [x] **Implement `handleStartWatchingClick()` workflow**
    - Validate episode number input (1-999)
    - Use `animeService.startWatching(animeData, episodeNumber)`
    - Auto-remove from plan list (service handles this)
    - Update button states based on new status
    - Show success toast notification

- [x] **Implement episode update workflows**
    - `handleEpisodeIncrement()` - increment current episode by 1
    - `handleEpisodeDecrement()` - decrement current episode by 1
    - `handleDirectEpisodeInput()` - set episode from input field
    - All use `animeService.updateEpisodeProgress()`

### 1.2 Business Rule Validation & State Management

**Objective**: Enforce all business rules to prevent invalid state transitions

**Tasks**:

- [x] **Create state validation helper functions**

    ```typescript
    function canAddToPlan(status: AnimeStatus): boolean {
        // Only if not planned, not watching, and not hidden
        return !status.isPlanned && !status.isTracked && !status.isHidden;
    }

    function canStartWatching(status: AnimeStatus): boolean {
        // Only if not already watching and not hidden
        return !status.isTracked && !status.isHidden;
    }

    function canHide(status: AnimeStatus): boolean {
        // Only if not planned and not watching
        return !status.isPlanned && !status.isTracked;
    }
    ```

- [x] **Update `addControlsToItem()` with strict business rules**
    - Remove all current button creation logic
    - Implement state-based button creation per business requirements
    - Ensure buttons are only shown when actions are allowed
    - Add visual indicators for current state (planned/watching icons)

- [x] **Add action validation in button handlers**
    - Double-check permissions before executing actions
    - Show error messages for blocked actions
    - Prevent race conditions during state transitions

### 1.3 Toast Notification System

**Objective**: Implement user feedback system for all actions

**Tasks**:

- [x] **Create toast notification system**

    ```typescript
    function showToast(message: string, type: "success" | "error" | "info"): void {
        // Create toast in top-right corner
        // Auto-dismiss after 3-4 seconds
        // Stack multiple notifications
        // Match glass-morphism design
    }
    ```

- [x] **Add toast notifications to all action handlers**
    - Success: "Added to plan to watch", "Started watching Episode X", "Episode updated to X"
    - Error: "Cannot hide planned anime", "Cannot plan watching anime"
    - Info: "Removed from plan", "Stopped watching anime"

- [x] **Implement toast stacking for multiple actions**
    - Multiple toasts stack vertically in top-right corner
    - Each toast has independent dismiss timer
    - Smooth slide-in/slide-out animations

### 1.4 Testing & Integration

**Tasks**:

- [x] **Update `test/content/contentScriptIntegration.test.ts`**
    - Test business rule enforcement (blocked actions)
    - Test complete state transition workflows
    - Test episode update scenarios
    - Test toast notification display
    - Test invalid input validation (episode numbers)

- [x] **Add content script demo updates**
    - Update `demo/content-script-demo.html` with all button states
    - Show complete business logic workflow demos
    - Document all possible state transitions
    - Add examples of blocked actions

---

## 🎯 PHASE 2: Options Page Data Integration

> **Priority**: High - UI shows static data
> **Estimated Time**: 1-2 weeks  
> **Dependencies**: Phase 1 (watch functionality should be working)

### 2.1 Vue Composables Creation

**Objective**: Create reactive data layer for Options page

**Tasks**:

- [ ] **Create `src/options/composables/useAnimeStorage.ts`**

    ```typescript
    // Reactive wrapper for AnimeService
    export function useAnimeStorage() {
        const currentlyWatching = ref<EpisodeProgress[]>([]);
        const planToWatch = ref<PlanToWatch[]>([]);
        const statistics = ref<AnimeStatistics>();

        const refreshData = async () => {
            const service = new AnimeService();
            const allAnime = await service.getAllAnime();
            const stats = await service.getStatistics();

            currentlyWatching.value = allAnime.currentlyWatching;
            planToWatch.value = allAnime.planToWatch;
            statistics.value = stats;
        };

        return { currentlyWatching, planToWatch, statistics, refreshData };
    }
    ```

- [ ] **Create episode progress composable**

    ```typescript
    // src/options/composables/useEpisodeProgress.ts
    export function useEpisodeProgress() {
        const updateEpisode = async (animeId: string, episode: number) => {
            const service = new AnimeService();
            return await service.updateEpisodeProgress(animeId, episode);
        };

        return { updateEpisode };
    }
    ```

### 2.2 Home View Dynamic Data

**Objective**: Replace static numbers with real statistics

**Tasks**:

- [ ] **Update `src/options/views/HomeView.vue`**
    - Replace hardcoded statistics with `useAnimeStorage()` composable
    - Add loading states for data fetching
    - Update dashboard cards with real counts

- [ ] **Implement `AnimeService.getStatistics()` method**
    ```typescript
    // Add to AnimeService.ts
    async getStatistics(): Promise<{
      totalCurrentlyWatching: number;
      totalPlanned: number;
      totalHidden: number;
      recentActivity: AnimeActivity[];
    }> {
      // Implementation using repositories
    }
    ```

### 2.3 Options Page Business Rules & Toast System

**Objective**: Implement list page logic with display-only episode tracking and toast notifications

**Tasks**:

- [ ] **Update `src/options/views/AllWatchLists.vue`**
    - Connect to real data via `useAnimeStorage()`
    - Replace static counts (12 series, 87 series, etc.) with dynamic values
    - Add loading states and empty states
    - Show current episode for watching anime (display-only, no controls)

- [ ] **Create Options page toast notification system**

    ```typescript
    // src/options/composables/useToast.ts
    export function useToast() {
        const toasts = ref<Toast[]>([]);

        const showToast = (message: string, type: "success" | "error" | "info") => {
            // Add toast to top-right corner stack
            // Auto-dismiss after 4 seconds
            // Handle multiple simultaneous toasts
        };

        return { toasts, showToast };
    }
    ```

- [ ] **Add global Clear Hidden functionality to Options page**
    - Clear Hidden button in appropriate views
    - Use `animeService.clearAllHidden()`
    - Show toast notification on completion
    - Refresh data after clearing

- [ ] **Implement business rule enforcement for Options page**
    - Watch list items show episode number only (no update controls)
    - All other business rules same as content script
    - Actions trigger toast notifications

---

## 🎯 PHASE 3: Missing Routes & Navigation

> **Priority**: Medium - UI completeness  
> **Estimated Time**: 1 week
> **Dependencies**: Phase 2 (data integration)

### 3.1 Individual List Detail Pages

**Tasks**:

- [ ] **Create `/currently-watching` route**
    - `src/options/views/CurrentlyWatchingView.vue`
    - List all currently watching anime with episode controls
    - Batch operations (mark multiple as completed)

- [ ] **Create `/plan-to-watch` route**
    - `src/options/views/PlanToWatchView.vue`
    - List planned anime with start watching actions
    - Sorting by date added, title, etc.

- [ ] **Create `/completed` route**
    - `src/options/views/CompletedView.vue`
    - Display completed anime (if implemented)
    - Statistics and completion dates

- [ ] **Create `/hidden` route**
    - `src/options/views/HiddenAnimeView.vue`
    - Show hidden anime with unhide options
    - Bulk unhide functionality

### 3.2 Router Configuration

**Tasks**:

- [ ] **Update `src/options/router/index.ts`**
    - Add all new routes
    - Configure route guards if needed
    - Set up proper navigation flow

- [ ] **Update navigation components**
    - Fix "View →" buttons in `AllWatchLists.vue` to link to correct routes
    - Update sidebar navigation in `SidebarLayout.vue`
    - Add breadcrumb navigation

### 3.3 Favorites Implementation

**Tasks**:

- [ ] **Create favorites system**
    - Add `FavoritesRepository` if needed
    - Or use existing repositories with favorite flag
    - Create `/favorites` route and view

---

## 🎯 PHASE 4: UI Polish & Advanced Features

> **Priority**: Low - Enhancement phase
> **Estimated Time**: 2-3 weeks
> **Dependencies**: Phases 1-3 complete

### 4.1 Advanced List Management

**Tasks**:

- [ ] **Add anime search functionality**
    - Global search across all lists using `animeService.searchAnime()`
    - Search UI component with filters
    - Results display with actions

- [ ] **Implement "Add New Anime" button**
    - Manual anime entry form
    - Validation and duplicate checking
    - Integration with existing storage

- [ ] **Bulk operations UI**
    - Multi-select anime functionality
    - Bulk status changes (plan → watching, etc.)
    - Bulk hide/unhide operations

### 4.2 Episode Progress Enhancement

**Tasks**:

- [ ] **Enhanced episode tracking**
    - Total episodes integration
    - Progress percentage display
    - Auto-completion detection

- [ ] **Episode notes/timestamps**
    - Add episode notes functionality to storage models
    - UI for adding/editing episode notes
    - Timestamp tracking for episodes

### 4.3 Advanced Status System

**Tasks**:

- [ ] **Additional anime states**
    - "On Hold" status implementation
    - "Dropped" status implementation
    - Status change history

- [ ] **Completion workflows**
    - Auto-mark as completed when reaching final episode
    - Completion date tracking
    - Completion statistics

---

## 🎯 PHASE 5: Documentation & Deployment

> **Priority**: Critical for maintenance
> **Estimated Time**: 1 week
> **Dependencies**: Core features complete

### 5.1 Documentation Updates

**Tasks**:

- [ ] **Update README.md**
    - Remove "static data" warnings
    - Update feature status to reflect completion
    - Add new screenshots showing watch functionality
    - Update roadmap section

- [ ] **Update guides in `docs/`**
    - `ANIMEUTIL_GUIDE.md`: Add AnimeService patterns
    - `OPTIONS_GUIDE.md`: Document new Vue composables
    - `UI_DESIGN_GUIDE.md`: Add watch button design patterns
    - `TESTING_GUIDE.md`: Document new test patterns for watch functionality

- [ ] **Create user documentation**
    - Usage guide for watch list features
    - Content script workflow documentation
    - Troubleshooting guide

### 5.2 Chrome Web Store Preparation

**Tasks**:

- [ ] **Extension store assets**
    - Create store listing screenshots
    - Write store description highlighting watch features
    - Update extension icons if needed

- [ ] **Final testing**
    - Cross-browser compatibility testing
    - Extension performance testing
    - Complete user workflow testing

---

## 📋 Implementation Checklist

### **Immediate Next Steps (This Week - Phase 0)**

- [ ] **Phase 0.1**: Create `PageDetector.ts` to identify list vs single pages
- [ ] **Phase 0.1**: Break down monolithic `index.ts` into controller architecture
- [ ] **Phase 0.2**: Create `SinglePageController.ts` for watch page handling
- [ ] **Phase 0.2**: Implement anime data extraction from watch pages
- [ ] **Phase 0.3**: Create `AnimeInfoModal.ts` with glass-morphism design
- [ ] **Phase 0.4**: Integrate business rules and toast notifications for modal actions
- [ ] **Phase 0.5**: Add comprehensive testing for new architecture

### **Short Term (Next 2 Weeks - Phase 1)**

- [ ] **Phase 1.1**: Implement business rule validation functions (`canAddToPlan()`, `canStartWatching()`, `canHide()`)
- [ ] **Phase 1.1**: Create `createStartWatchingButton()` with episode input validation
- [ ] **Phase 1.1**: Create `createWatchingControls()` with episode increment/decrement
- [ ] **Phase 1.2**: Refactor `addControlsToItem()` to enforce all business rules strictly
- [ ] **Phase 1.3**: Implement toast notification system for content script
- [ ] **Phase 1.4**: Update integration tests for business rule enforcement

### **Short Term (Next 2 Weeks)**

- [ ] **Phase 2.1**: Create Vue composables for Options page
- [ ] **Phase 2.2**: Replace static data in HomeView with dynamic data
- [ ] **Phase 2.3**: Connect AllWatchLists to real storage data
- [ ] **Phase 3.1**: Create individual list detail route pages

### **Medium Term (Next Month)**

- [ ] **Phase 3.2**: Fix all navigation and routing issues
- [ ] **Phase 4.1**: Implement advanced list management features
- [ ] **Phase 4.2**: Add enhanced episode progress tracking

### **Long Term (Next 2 Months)**

- [ ] **Phase 4.3**: Additional anime status system
- [ ] **Phase 5**: Complete documentation and Chrome Web Store preparation

---

## 🚀 Success Criteria

### **Phase 0 Success**: Single Anime Page Modal Implementation

- [ ] **Page Detection**: Correctly identifies watch pages containing `/watch/` URL pattern
- [ ] **Modal Functionality**: "Anime Info" button opens responsive modal with anime management
- [ ] **Business Rules Enforced**: Same state transition rules as list pages
    - ✅ Hidden anime: Only "Remove from Hidden" action available
    - ✅ Planned anime: "Remove from Plan" and "Start Watching" actions available
    - ✅ Watching anime: "Stop Watching" and episode update available
    - ✅ Clean state: "Add to Plan" and "Hide" actions available
- [ ] **Toast Notifications**: All modal actions trigger appropriate notifications
- [ ] **Responsive Design**: Modal works on desktop and mobile devices
- [ ] **Architecture Refactoring**: Content script broken into modular, testable components

### **Phase 1 Success**: List Page Business Rule Implementation

- [ ] **Business Rules Enforced**: All anime state transitions follow exact specifications on listing pages
    - ✅ Planned anime cannot be hidden
    - ✅ Watching anime cannot be planned or hidden
    - ✅ Hidden anime cannot be planned or watched (until unhidden)
    - ✅ Clean state: anime can be planned or hidden only
- [ ] **Watch Functionality**: Users can start watching planned anime with episode selection
- [ ] **Episode Tracking**: Users can update episode progress for watching anime
- [ ] **Toast Notifications**: All actions provide immediate user feedback
- [ ] **Button States**: Only valid actions shown based on current anime status

### **Phase 2 Success**: Options Page Business Rule Integration

- [ ] **Display-Only Episode Tracking**: Watch list shows current episodes without update controls
- [ ] **Toast Notification System**: All Options page actions show stacked notifications
- [ ] **Real Data Integration**: No static data remaining, all connected to AnimeService
- [ ] **Business Rule Consistency**: Same state rules as content script enforced in Options page
- [ ] **Real-time Updates**: Data refreshes when content script modifies storage

### **Phase 3 Success**: Complete Navigation

- [ ] All routes functional with no 404s
- [ ] Proper navigation flow between all pages
- [ ] Breadcrumbs and back button functionality
- [ ] Deep linking works correctly

### **Overall Project Success**

- [ ] 100% test coverage maintained throughout development
- [ ] All original business requirements from user's plan implemented
- [ ] Extension ready for Chrome Web Store publication
- [ ] Complete user workflow from discovery to completion tracking

---

## 📚 References

- **AnimeService API**: Use existing methods like `startWatching()`, `updateEpisodeProgress()`, `getAnimeStatus()`
- **UI Design Patterns**: Follow glass-morphism patterns in `docs/UI_DESIGN_GUIDE.md`
- **Testing Patterns**: Match existing test patterns in `test/` directory
- **Storage Models**: Use existing `AnimeData`, `EpisodeProgress`, `PlanToWatch` interfaces
- **Business Logic**: Reference original plan requirements for complete state management
- **Single Page URL Pattern**: `/watch/` segment indicates individual anime page (e.g., `https://hianime.to/watch/anime-name-12345`)

## 📋 Architecture Decision Records

### **ADR-001: Content Script Refactoring**

- **Decision**: Break monolithic `index.ts` (1386 lines) into modular controller architecture
- **Reasoning**: Single responsibility principle, better testability, cleaner maintenance
- **Impact**: New developers can understand and modify specific features without touching entire codebase

### **ADR-002: Page Detection Strategy**

- **Decision**: Use URL pattern matching for page type detection
- **Reasoning**: Reliable across different anime sites, easily extendable
- **Pattern**: `/watch/` segment indicates single anime page vs listing page

### **ADR-003: Modal vs Inline UI**

- **Decision**: Use modal overlay for single page anime management
- **Reasoning**: Doesn't interfere with watch page layout, provides focused interaction area
- **Implementation**: Glass-morphism modal matching extension design system
