# Content Script Refactoring Plan - Implementation Guide

## 🎯 **Objective**

Break down the monolithic 1,970-line `src/content/index.ts` file into a modular, maintainable architecture while preserving all existing functionality and maintaining 100% test coverage.

## 📊 **Current State Analysis**

### **Problems with Current Architecture**

- **Monolithic File**: 1,970 lines in a single file
- **Mixed Responsibilities**: DOM manipulation, UI creation, business logic, and styling all in one place
- **Hard to Test**: Large functions with multiple responsibilities
- **Difficult Maintenance**: Changes risk breaking unrelated functionality
- **Poor Developer Experience**: IDE performance issues with large files

### **What We Have Working**

- ✅ Dual-build system with IIFE bundling for Chrome extension compatibility
- ✅ 100% test coverage (39 content script tests passing)
- ✅ Working AnimeService integration
- ✅ Glass-morphism UI design system
- ✅ Toast notification system
- ✅ Single page modal functionality
- ✅ Business rule validation

## 🏗️ **Target Architecture**

### **New File Structure**

```
src/content/
├── index.ts                    # Main entry point (~100-150 lines)
├── controllers/
│   ├── ListPageController.ts   # Handles anime listing pages
│   └── SinglePageController.ts # Handles individual anime watch pages
├── components/
│   ├── buttons/
│   │   ├── PlanButton.ts       # Plan to watch button creation & logic
│   │   ├── WatchingControls.ts # Episode tracking controls
│   │   ├── HideButton.ts       # Hide anime button creation & logic
│   │   ├── InfoButton.ts       # Single page info button
│   │   └── ButtonFactory.ts    # Centralized button creation utilities
│   ├── ui/
│   │   ├── ToastSystem.ts      # Toast notification management
│   │   ├── StyleInjector.ts    # CSS injection and management
│   │   └── ModalManager.ts     # Modal overlay system
│   └── forms/
│       └── EpisodeInput.ts     # Episode number input validation
├── services/
│   ├── PageDetector.ts         # Page type detection logic
│   ├── AnimeExtractor.ts       # DOM anime data extraction
│   ├── BusinessRules.ts        # Centralized validation logic
│   └── DOMObserver.ts          # MutationObserver management
├── types/
│   └── ContentTypes.ts         # Content script specific TypeScript types
└── styles/
    ├── buttons.css             # Button-specific styles
    ├── modal.css               # Modal-specific styles
    ├── toast.css               # Toast notification styles
    └── animations.css          # Animation utilities
```

## 📋 **Implementation Phases**

### **Phase 1: Foundation Setup (Day 1-2)**

#### **Task 1.1: Create Type Definitions**

**File**: `src/content/types/ContentTypes.ts`

```typescript
// Export all interfaces and types used across content script modules
export interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
    element: HTMLDivElement;
}

export interface AnimeControls {
    container: HTMLElement;
    buttons: HTMLElement[];
}

export enum PageType {
    LIST_PAGE = "LIST_PAGE",
    SINGLE_PAGE = "SINGLE_PAGE",
    UNKNOWN = "UNKNOWN",
}

export enum ContentFeature {
    LIST_PAGE_LOGIC = "LIST_PAGE_LOGIC",
    SINGLE_PAGE_MODAL = "SINGLE_PAGE_MODAL",
}

// Re-export common types from commons for convenience
export type { AnimeData, AnimeStatus } from "@/commons/models";
```

**Instructions for Agent**:

1. Create the `src/content/types/` directory
2. Create `ContentTypes.ts` with the above content
3. Add any other interfaces found in the current `index.ts` file

#### **Task 1.2: Extract CSS Styles**

**File**: `src/content/styles/buttons.css`

```css
/* Extract all button-related CSS from the current injectStyles() function */
.anime-list-controls {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 10;
}

/* Add all existing button styles here */
/* ... copy from current implementation ... */
```

**Files to Create**:

- `src/content/styles/buttons.css` - All button styles
- `src/content/styles/modal.css` - Modal-specific styles
- `src/content/styles/toast.css` - Toast notification styles
- `src/content/styles/animations.css` - Animation utilities

**Instructions for Agent**:

1. Create the `src/content/styles/` directory
2. Extract all CSS from the current `injectStyles()` function in `index.ts`
3. Split styles logically into the 4 CSS files above
4. Ensure no CSS is lost during extraction

### **Phase 2: Core System Extraction (Day 3-4)**

#### **Task 2.1: Extract Toast System**

**File**: `src/content/components/ui/ToastSystem.ts`

```typescript
import type { Toast } from "../../types/ContentTypes";

export class ToastSystem {
    private static instance: ToastSystem | null = null;
    private toastCounter = 0;
    private activeToasts = new Map<string, Toast>();

    private constructor() {}

    static getInstance(): ToastSystem {
        if (!ToastSystem.instance) {
            ToastSystem.instance = new ToastSystem();
        }
        return ToastSystem.instance;
    }

    showToast(message: string, type: "success" | "error" | "info"): void {
        // Move showToast implementation here
    }

    private removeToast(toastId: string): void {
        // Move removeToast implementation here
    }

    private repositionToasts(): void {
        // Move repositionToasts implementation here
    }
}

// Export singleton instance
export const toastSystem = ToastSystem.getInstance();
```

**Instructions for Agent**:

1. Create directory structure: `src/content/components/ui/`
2. Move the entire toast notification system from `index.ts` to this file
3. Convert to singleton pattern as shown above
4. Import the `Toast` type from `ContentTypes.ts`
5. Update all toast-related code to use the singleton instance

#### **Task 2.2: Extract Style Injection**

**File**: `src/content/components/ui/StyleInjector.ts`

```typescript
export class StyleInjector {
    private static injected = false;

    static injectStyles(): void {
        if (StyleInjector.injected) return;

        // Import all CSS files and inject them
        // This will be bundled inline by Vite
        import("../../styles/buttons.css");
        import("../../styles/modal.css");
        import("../../styles/toast.css");
        import("../../styles/animations.css");

        StyleInjector.injected = true;
    }
}
```

**Instructions for Agent**:

1. Create the `StyleInjector.ts` file as shown
2. Replace the current `injectStyles()` function calls with `StyleInjector.injectStyles()`
3. Ensure styles are only injected once

#### **Task 2.3: Extract Business Rules**

**File**: `src/content/services/BusinessRules.ts`

```typescript
import type { AnimeStatus } from "../types/ContentTypes";

export class BusinessRules {
    static canAddToPlan(status: AnimeStatus): boolean {
        return !status.isPlanned && !status.isTracked && !status.isHidden;
    }

    static canStartWatching(status: AnimeStatus): boolean {
        return !status.isTracked && !status.isHidden;
    }

    static canHide(status: AnimeStatus): boolean {
        return !status.isPlanned && !status.isTracked;
    }

    static canRemoveFromPlan(status: AnimeStatus): boolean {
        return status.isPlanned;
    }

    static canStopWatching(status: AnimeStatus): boolean {
        return status.isTracked;
    }

    static getBlockedActionMessage(action: string, status: AnimeStatus): string {
        // Add user-friendly error messages for blocked actions
        if (action === "hide" && status.isPlanned) {
            return "Cannot hide planned anime. Remove from plan first.";
        }
        if (action === "hide" && status.isTracked) {
            return "Cannot hide currently watching anime. Stop watching first.";
        }
        // Add more blocked action messages
        return "This action is not allowed for this anime.";
    }
}
```

**Instructions for Agent**:

1. Create directory: `src/content/services/`
2. Move all `canAddToPlan`, `canStartWatching`, etc. functions to this file
3. Add the `getBlockedActionMessage` method for better user feedback
4. Update all imports in other files

### **Phase 3: Component Extraction (Day 5-6)**

#### **Task 3.1: Extract Button Components**

**File**: `src/content/components/buttons/PlanButton.ts`

```typescript
import type { AnimeData } from "../../types/ContentTypes";
import { AnimeService } from "@/commons/services";
import { toastSystem } from "../ui/ToastSystem";
import { BusinessRules } from "../../services/BusinessRules";

export class PlanButton {
    static create(animeData: AnimeData): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = "anime-list-plan-btn";
        button.setAttribute("data-testid", "anime-plan-button");
        button.setAttribute("data-anime-id", animeData.animeId);
        button.setAttribute("title", `Add "${animeData.animeTitle}" to plan-to-watch list`);

        button.innerHTML = `
            <span class="button-icon">📝</span>
            <span class="button-text">Plan</span>
        `;

        button.addEventListener("click", async (e) => {
            await PlanButton.handleClick(e, animeData);
        });

        return button;
    }

    private static async handleClick(event: Event, animeData: AnimeData): Promise<void> {
        // Move handlePlanClick logic here
    }
}
```

**Similar Files to Create**:

- `src/content/components/buttons/HideButton.ts`
- `src/content/components/buttons/WatchingControls.ts`
- `src/content/components/buttons/InfoButton.ts`

**Instructions for Agent**:

1. Create directory: `src/content/components/buttons/`
2. Extract each button type into its own class
3. Move the corresponding `create*Button` and `handle*Click` functions
4. Maintain all existing functionality and event handlers
5. Update imports to use the new structure

#### **Task 3.2: Extract Modal System**

**File**: `src/content/components/ui/ModalManager.ts`

```typescript
import type { AnimeData, AnimeStatus } from "../../types/ContentTypes";

export class ModalManager {
    private static currentModal: HTMLElement | null = null;

    static showAnimeInfoModal(animeData: AnimeData, status: AnimeStatus): void {
        // Move showSinglePageModal implementation here
    }

    static closeModal(): void {
        // Move closeSinglePageModal implementation here
    }

    private static createModalActions(animeData: AnimeData, status: AnimeStatus): HTMLElement {
        // Move getSinglePageModalActions implementation here
    }
}
```

**Instructions for Agent**:

1. Move all modal-related functions from `index.ts` to this class
2. Update variable names to use class properties instead of globals
3. Maintain all existing modal functionality

### **Phase 4: Service Layer (Day 7-8)**

#### **Task 4.1: Extract Page Detection**

**File**: `src/content/services/PageDetector.ts`

```typescript
import { PageType, ContentFeature } from "../types/ContentTypes";

export class PageDetector {
    static detectPageType(): PageType {
        // Move isWatchPage logic and expand it
        if (window.location.href.includes("/watch/")) {
            return PageType.SINGLE_PAGE;
        }

        // Check for list page indicators
        const listIndicators = [".film_list-wrap", ".anime-list", ".list-container"];
        if (listIndicators.some((selector) => document.querySelector(selector))) {
            return PageType.LIST_PAGE;
        }

        return PageType.UNKNOWN;
    }

    static shouldRunFeature(feature: ContentFeature): boolean {
        const pageType = PageDetector.detectPageType();

        switch (feature) {
            case ContentFeature.LIST_PAGE_LOGIC:
                return pageType === PageType.LIST_PAGE;
            case ContentFeature.SINGLE_PAGE_MODAL:
                return pageType === PageType.SINGLE_PAGE;
            default:
                return false;
        }
    }

    static isWatchPage(): boolean {
        return PageDetector.detectPageType() === PageType.SINGLE_PAGE;
    }
}
```

**Instructions for Agent**:

1. Move and enhance the `isWatchPage()` function
2. Add comprehensive page type detection logic
3. Create feature flag system for conditional functionality

#### **Task 4.2: Extract Anime Data Extraction**

**File**: `src/content/services/AnimeExtractor.ts`

```typescript
import type { AnimeData } from "../types/ContentTypes";

export class AnimeExtractor {
    static extractFromListItem(element: Element): AnimeData | null {
        // Move extractAnimeData implementation here
    }

    static extractFromSinglePage(): AnimeData | null {
        // Move extractSinglePageAnimeData implementation here
    }

    private static cleanAnimeTitle(title: string): string {
        // Add title cleaning logic
        return title.trim().replace(/\s+/g, " ");
    }

    private static generateAnimeId(title: string, url?: string): string {
        // Add ID generation logic
        return title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    }
}
```

**Instructions for Agent**:

1. Move both anime data extraction functions
2. Add helper methods for title cleaning and ID generation
3. Maintain compatibility with existing DOM structures

### **Phase 5: Controller Architecture (Day 9-10)**

#### **Task 5.1: Create List Page Controller**

**File**: `src/content/controllers/ListPageController.ts`

```typescript
import { AnimeExtractor } from "../services/AnimeExtractor";
import { PlanButton } from "../components/buttons/PlanButton";
import { HideButton } from "../components/buttons/HideButton";
import { WatchingControls } from "../components/buttons/WatchingControls";

export class ListPageController {
    private static instance: ListPageController | null = null;

    static getInstance(): ListPageController {
        if (!ListPageController.instance) {
            ListPageController.instance = new ListPageController();
        }
        return ListPageController.instance;
    }

    async initialize(): Promise<void> {
        // Move initializeControls logic here
    }

    private async addControlsToItem(element: Element): Promise<void> {
        // Move addControlsToItem logic here
    }

    setupObserver(): void {
        // Move setupObserver logic here
    }
}
```

**Instructions for Agent**:

1. Move all list page related functionality from `index.ts`
2. Convert to singleton pattern for state management
3. Maintain all existing functionality and DOM manipulation

#### **Task 5.2: Create Single Page Controller**

**File**: `src/content/controllers/SinglePageController.ts`

```typescript
import { AnimeExtractor } from "../services/AnimeExtractor";
import { InfoButton } from "../components/buttons/InfoButton";
import { ModalManager } from "../components/ui/ModalManager";

export class SinglePageController {
    private static instance: SinglePageController | null = null;

    static getInstance(): SinglePageController {
        if (!SinglePageController.instance) {
            SinglePageController.instance = new SinglePageController();
        }
        return SinglePageController.instance;
    }

    initialize(): void {
        // Move initializeSinglePage logic here
    }

    private createInfoButton(animeData: AnimeData): void {
        // Move createSinglePageInfoButton logic here
    }
}
```

**Instructions for Agent**:

1. Move all single page modal functionality
2. Integrate with ModalManager for modal display
3. Maintain existing button positioning and styling

### **Phase 6: Main Entry Point Refactor (Day 11)**

#### **Task 6.1: Refactor Main Index**

**File**: `src/content/index.ts` (Reduced to ~100-150 lines)

```typescript
import { PageDetector } from "./services/PageDetector";
import { ListPageController } from "./controllers/ListPageController";
import { SinglePageController } from "./controllers/SinglePageController";
import { StyleInjector } from "./components/ui/StyleInjector";
import { ContentFeature } from "./types/ContentTypes";

/**
 * Content script for anime website integration
 * Orchestrates different page types and functionality
 */

console.log("AnimeList content script loaded");

/**
 * Main initialization function
 */
async function init(): Promise<void> {
    try {
        // Inject required styles
        StyleInjector.injectStyles();

        // Initialize based on page type
        if (PageDetector.shouldRunFeature(ContentFeature.LIST_PAGE_LOGIC)) {
            const listController = ListPageController.getInstance();
            await listController.initialize();
        }

        if (PageDetector.shouldRunFeature(ContentFeature.SINGLE_PAGE_MODAL)) {
            const singleController = SinglePageController.getInstance();
            singleController.initialize();
        }
    } catch (error) {
        console.error("Error initializing AnimeList content script:", error);
    }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

// Re-export functions that need to be accessible for testing
export * from "./services/BusinessRules";
export * from "./services/AnimeExtractor";
export * from "./components/ui/ToastSystem";

// Export for testing access
export { init };
```

**Instructions for Agent**:

1. Reduce `index.ts` to orchestration only
2. Remove all implementation details
3. Keep only initialization and page type routing
4. Maintain all exports needed for testing
5. Ensure error handling is preserved

## 🧪 **Testing Strategy**

### **Test File Structure**

```
test/content/
├── controllers/
│   ├── ListPageController.test.ts
│   └── SinglePageController.test.ts
├── components/
│   ├── buttons/
│   │   ├── PlanButton.test.ts
│   │   ├── HideButton.test.ts
│   │   └── WatchingControls.test.ts
│   └── ui/
│       ├── ToastSystem.test.ts
│       ├── ModalManager.test.ts
│       └── StyleInjector.test.ts
├── services/
│   ├── PageDetector.test.ts
│   ├── AnimeExtractor.test.ts
│   └── BusinessRules.test.ts
└── index.test.ts
```

### **Testing Requirements**

**For Each New Module**:

1. **Unit Tests**: Test all public methods in isolation
2. **Integration Tests**: Test interaction with DOM and AnimeService
3. **Mock Dependencies**: Use proper mocking for external dependencies
4. **Edge Cases**: Test error conditions and boundary cases
5. **Coverage**: Maintain 100% line coverage for each module

**Testing Instructions for Agent**:

1. Create test files for each new module as it's created
2. Move existing test cases from the current content script tests to appropriate new files
3. Add new test cases for any new functionality
4. Ensure all tests pass before considering a phase complete
5. Update test imports to match new module structure

## ⚠️ **Critical Requirements**

### **Must Preserve**

- ✅ All existing functionality (buttons, modals, toast notifications)
- ✅ All business rules and validation logic
- ✅ All CSS styling and animations
- ✅ All event handlers and DOM manipulation
- ✅ All integration with AnimeService
- ✅ All export functions used by tests

### **Build System Compatibility**

- ✅ IIFE bundling must continue to work
- ✅ All imports will be bundled inline (no runtime imports)
- ✅ CSS files will be bundled inline by Vite
- ✅ No changes needed to `vite.content.config.ts`
- ✅ Final bundle should be similar size or smaller

### **Code Quality Standards**

- ✅ TypeScript strict mode compliance
- ✅ ESLint and Prettier formatting
- ✅ Proper error handling and logging
- ✅ JSDoc comments for all public methods
- ✅ Consistent naming conventions

## 🚀 **Implementation Checklist**

### **Phase 1 - Foundation** ✅

- [ ] Create `src/content/types/ContentTypes.ts`
- [ ] Extract CSS to `src/content/styles/` folder (4 files)
- [ ] Test: Ensure styles still work correctly

### **Phase 2 - Core Systems** ✅

- [ ] Extract `ToastSystem.ts` with singleton pattern
- [ ] Extract `StyleInjector.ts` with CSS imports
- [ ] Extract `BusinessRules.ts` with validation logic
- [ ] Test: All core systems function independently

### **Phase 3 - Components** ✅

- [ ] Extract button components (4 files)
- [ ] Extract `ModalManager.ts`
- [ ] Test: All UI components work correctly

### **Phase 4 - Services** ✅

- [ ] Extract `PageDetector.ts`
- [ ] Extract `AnimeExtractor.ts`
- [ ] Extract `DOMObserver.ts`
- [ ] Test: All services integrate properly

### **Phase 5 - Controllers** ✅

- [ ] Create `ListPageController.ts`
- [ ] Create `SinglePageController.ts`
- [ ] Test: Both controllers manage their features correctly

### **Phase 6 - Main Refactor** ✅

- [ ] Refactor `index.ts` to orchestration only
- [ ] Update all test imports
- [ ] Run full test suite (must maintain 100% coverage)
- [ ] Build and test extension in Chrome

### **Final Validation** ✅

- [ ] All 39 existing content script tests pass
- [ ] Extension builds successfully with `npm run build:ext`
- [ ] Manual testing: All buttons and modals work in browser
- [ ] Bundle size is similar or improved
- [ ] No console errors in extension

## 🎯 **Success Criteria**

**Technical Success**:

- 📊 Modular architecture with ~15 focused files instead of 1 monolithic file
- 🧪 100% test coverage maintained across all modules
- ⚡ Build system continues to work without changes
- 🐛 Zero regressions in existing functionality

**Developer Experience Success**:

- 👩‍💻 Each file is 50-200 lines (manageable size)
- 🚀 IDE performance improved with smaller files
- 🔧 New features can be added in isolated modules
- 📝 Code is easier to understand and maintain

**Business Success**:

- ✨ All existing anime tracking features work exactly as before
- 🎨 UI/UX remains identical for users
- 🛡️ Chrome extension compatibility maintained
- 📦 Ready for future feature additions

---

This plan provides a systematic approach to refactoring the content script while preserving all functionality and maintaining the high-quality standards of your codebase.
