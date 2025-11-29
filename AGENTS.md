# AnimeList

Chrome extension (Manifest V3) for tracking anime across multiple watch states (watching, plan-to-watch, hidden). Built with Vue 3, TypeScript, and Tailwind CSS v4 using clean architecture.

## Commands

```bash
npm run dev                    # Vite dev server with hot-reload
npm run build:ext              # Full extension build (load dist/ in chrome://extensions)
npm run test:unit              # Run Vitest tests
npm run test:unit:watch        # Watch mode for TDD
npm run test:unit:coverage     # Coverage report
npm run test:e2e               # Playwright E2E tests
npm run format && npm run lint && npm run test:unit  # Pre-commit (required)
```

## Architecture

```
Vue Components (options/, popup/, content/)
    ↓
Pinia Stores + Composables (options/stores/, options/composables/)
    ↓
AnimeService (commons/services/) ← AnimeStateValidator (state machine)
    ↓
Repositories (commons/repositories/) ← BaseRepository<T> pattern
    ↓
StorageAdapter (commons/adapters/) → chrome.storage.local
```

**Extension Contexts:**
- `src/background/` - Service worker (MV3)
- `src/content/` - Injected scripts (built separately as IIFE via `vite.content.config.ts`)
- `src/popup/` - Quick-access UI
- `src/options/` - Full dashboard

**State Management:**
- Stores use dual structure: `items[]` for iteration + `itemsMap{}` for O(1) lookups
- `storageSyncPlugin` - Cross-context sync via `chrome.storage.onChanged` + runtime messaging
- `undoPlugin` - Snapshot-based undo via `__snapshot()`/`__restore()` methods
- Key composables: `useOfflineQueue` (offline-first), `useSmartStats` (throttled stats), `useStorageCache` (instant load)

**State Transitions:** AnimeStateValidator enforces: clean → planned/watching/hidden with validation rules

## Code Style

- Vue 3 `<script setup>` only, strict TypeScript
- Double quotes, 4-space indent, trailing commas, semicolons, 120 char lines
- Types in `src/commons/models/index.ts` and `architecture.ts`
- Test IDs: `data-testid="component-element"` (kebab-case)
- Storage only through services/repositories, never direct `localStorage`

## Testing

- Chrome APIs mocked in `test/setup.ts` (storage, runtime, matchMedia)
- Coverage: 85% functions/lines/statements, 80% branches
- Mock pattern: `vi.mock()` before imports, `vi.clearAllMocks()` in beforeEach
- Stores: use `createPinia()`/`setActivePinia()` for isolation

## Commits

Conventional commits: `feat:`, `fix:`, `docs:`, `test:` (72 char max title)
