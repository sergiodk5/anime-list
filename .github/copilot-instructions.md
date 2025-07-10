# AnimeList Chrome Extension - GitHub Copilot Instructions

## Project Overview

This is a modern Chrome extension for anime tracking with Vue 3, TypeScript, and Tailwind CSS v4. We use glass-morphism UI design with Darkness (KonoSuba) anime branding and purple-pink gradients.

## Architecture & Framework Conventions

We use Vue 3 with Composition API and `<script setup>` syntax for all components. Always prefer Composition API over Options API when creating or modifying Vue components.

We use TypeScript with strict type checking enabled. All new code should include proper type annotations and interfaces defined in `src/commons/models/index.ts`.

We use Tailwind CSS v4 with the `@tailwindcss/vite` plugin. Note that we use the newer rounded utilities (`rounded-xs` instead of `rounded-sm`). All styling should follow our glass-morphism design patterns documented in `docs/UI_DESIGN_GUIDE.md`.

## File Structure & Organization

Follow Chrome extension architecture with these specific folders:

- `src/background/` - Service worker/background scripts
- `src/content/` - Content scripts injected into web pages
- `src/popup/` - Extension popup UI
- `src/options/` - Full dashboard/options page
- `src/commons/` - Shared utilities, models, and storage functions

For Vue components in the options page, use the layout system:

- `src/options/layouts/` - Page layout templates
- `src/options/components/` - Reusable UI components
- `src/options/views/` - Page-level route components

## Naming Conventions

Use PascalCase for Vue component files (e.g., `HomeView.vue`, `SidebarLayout.vue`). Use camelCase for utility files and functions (e.g., `episodeProgressUtil.ts`, `getAnimeProgress()`).

For data-testid attributes, use kebab-case with descriptive hierarchical naming (e.g., `data-testid="home-stats-currently-watching"`, `data-testid="sidebar-nav-all-lists"`).

## Storage & State Management

We use Chrome extension local storage through utility functions in `src/commons/utils/`. All storage operations should go through these utilities (e.g., `EpisodeProgressUtil`, `PlanToWatchUtil`, `HiddenAnimeUtil`).

When creating reactive data that updates with storage changes, create Vue composables that wrap the storage utilities and provide reactive refs.

## Testing Requirements

Maintain 100% test coverage for all utility functions. Use Vitest with `@vitest/coverage-v8` for unit testing.

Always add `data-testid` attributes to interactive UI elements and important content areas for robust testing. Follow the established pattern: `data-testid="component-section-element"`.

Mock Chrome APIs using the patterns established in `test/setup.ts`. All storage operations should be thoroughly tested with proper mock cleanup.

## UI Design Standards

Follow the anime-themed glass-morphism design documented in `docs/UI_DESIGN_GUIDE.md`. Use the established color palette: purple-to-pink gradients with white/transparent overlays.

All interactive elements should have hover states with smooth transitions. Use the Darkness (KonoSuba) icon consistently for branding.

Ensure responsive design with mobile-first approach. All new UI should work across different screen sizes.

## Code Style & Formatting

We use ESLint and Prettier for consistent code quality and formatting.

### ESLint Configuration

- Vue 3 essential rules with TypeScript support
- Extends: `plugin:vue/vue3-essential`, `eslint:recommended`, `@vue/eslint-config-typescript`
- Playwright rules for e2e test files
- Always run `npm run lint` before committing

### Prettier Formatting Rules

- **Print Width**: 120 characters maximum
- **Indentation**: 4 spaces for most files, 2 spaces for YAML
- **Quotes**: Double quotes for strings (`"hello"` not `'hello'`)
- **Semicolons**: Always use semicolons
- **Trailing Commas**: Always add trailing commas
- **Vue Attributes**: Single attribute per line for readability
- **Tailwind Plugin**: Automatic class sorting with `prettier-plugin-tailwindcss`

### Code Style Guidelines

- Use double quotes for all strings in JavaScript/TypeScript
- Use 4-space indentation (tabs converted to spaces)
- Keep lines under 120 characters
- Add trailing commas in objects, arrays, and function parameters
- Use semicolons at the end of statements
- Format Vue template attributes with one per line for better readability

### Development Workflow

Use `npm run dev` for development with hot-reload. Run `npm run test:unit:coverage` to verify test coverage before committing changes.

Use `npm run build:ext` to create the final Chrome extension package. Always run this and test the built extension before releases.

Always run `npm run lint` and `npm run format` before committing. Code must pass all ESLint rules and be properly formatted with Prettier.

### CI/CD Pipeline

We use GitHub Actions for continuous integration and deployment:

- **CI Workflow**: Runs tests, linting, formatting checks, type checking, and builds on every push/PR
- **Release Workflow**: Creates tagged releases with packaged Chrome extension
- Use `npm run lint:check` and `npm run format:check` for CI (non-modifying versions)
- All checks must pass before code can be merged

## Chrome Extension Specifics

We use Manifest V3 with service workers. All background scripts should be placed in `src/background/` and use modern Chrome extension APIs.

Content scripts in `src/content/` should inject UI elements that match the native website styling while maintaining our brand consistency.

Storage operations should always use `chrome.storage.local` through our utility wrapper functions, never direct browser localStorage.
