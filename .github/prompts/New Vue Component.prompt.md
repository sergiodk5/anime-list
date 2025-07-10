# New Vue Component

Your goal is to generate a new Vue component for the AnimeList Chrome Extension.

Ask for the component name, type (view/layout/component), and its primary purpose if not provided.

## Requirements for Vue components:

### Vue 3 Standards:

- Use Vue 3 Composition API with `<script setup>` syntax
- Use TypeScript with proper type annotations
- Import Vue utilities from `vue` (ref, computed, onMounted, etc.)

### File Structure:

- **Views**: Place in `src/options/views/` for page-level components
- **Layouts**: Place in `src/options/layouts/` for layout templates
- **Components**: Place in `src/options/components/` for reusable UI elements
- **Naming**: Use PascalCase (e.g., `HomeView.vue`, `SidebarLayout.vue`)

### Design System:

- Follow glass-morphism patterns from [docs/UI_DESIGN_GUIDE.md](../../docs/UI_DESIGN_GUIDE.md)
- Use purple-to-pink gradients: `bg-linear-to-br from-purple-600 via-purple-700 to-pink-600`
- Glass cards: `rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-xs`
- Hover states: `hover:border-white/30 hover:bg-white/15 hover:shadow-lg`
- Use Darkness (KonoSuba) branding consistently

### Testing Requirements:

- Add `data-testid` attributes to all interactive elements
- Use hierarchical naming: `data-testid="component-section-element"`
- Examples: `data-testid="home-stats-currently-watching"`, `data-testid="sidebar-nav-all-lists"`

### Storage Integration:

- Use utilities from `src/commons/utils/` for data operations
- Create reactive refs for storage data that auto-updates
- Follow patterns in existing components for state management

### Styling:

- Use Tailwind CSS v4 utilities (note: `rounded-xs` not `rounded-sm`)
- Mobile-first responsive design
- Smooth transitions: `transition-all duration-300`
- Consistent spacing with Tailwind scale

### TypeScript:

- Import interfaces from `src/commons/models/index.ts`
- Add proper type annotations for props, refs, and functions
- Use generic types for storage operations when appropriate
