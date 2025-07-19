[![CI](https://github.com/sergiodk5/anime-list/actions/workflows/ci.yml/badge.svg)](https://github.com/sergiodk5/anime-list/actions/workflows/ci.yml)
[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

# AnimeList Chrome Extension

A modern browser extension to enhance your anime viewing experience with beautiful glass-morphism UI and comprehensive tracking features. Take control of your watch lists, track progress, and customize what you see.

## 🚦 Current Status

**🟢 Production Ready:**

- ✅ Content script integration with Watch/Hide buttons on anime websites
- ✅ Chrome extension popup with dashboard navigation
- ✅ Clean service-repository architecture with 100% test coverage (370 tests)
- ✅ Beautiful glass-morphism UI design system
- ✅ Complete storage system with all CRUD operations

**🟡 UI Implementation:**

- ⚠️ Dashboard shows static placeholder data (needs backend integration)
- ⚠️ Vue router has basic navigation (2 routes implemented)
- ⚠️ Missing routes: `/favorites` and individual list detail pages

**🔴 Next Phase:**

- ❌ Frontend-backend integration (connect UI to storage utilities)
- ❌ Episode progress tracking interface
- ❌ Functional buttons (Add Anime, View Lists, etc.)
- ❌ Real-time data display instead of static numbers

## ✨ Core Features

### 🎯 Currently Implemented

#### **Content Script Integration** ✅

- **Plan to Watch List**: Add anime to your personal "plan to watch" list directly from anime listing pages
- **Hide Anime System**: Hide anime you're not interested in with easy unhide functionality
- **Seamless Integration**: UI elements injected directly into anime websites for native feel
- **Clear Hidden Button**: Reset all hidden anime with one click
- **Visual Feedback**: Success/error notifications with glass-morphism styling

#### **Modern Dashboard (Options Page)** ⚠️ _Static UI Only_

- **🏠 Home Dashboard**: Beautiful anime-themed welcome page with glass-morphism design
- **📺 Watch Lists Overview**: Static view of anime list categories (Currently Watching, Completed, Plan to Watch, On Hold, Dropped)
- **🎨 Glass-Morphism UI**: Modern design with anime-themed branding and purple-pink gradients
- **📱 Responsive Design**: Mobile-first design that works across all screen sizes
- **🧭 Vue Router Navigation**: Basic routing between Home and Watch Lists pages

#### **Extension Popup** ✅

- **🎌 Anime-Themed Branding**: Consistent anime icon and aesthetic
- **⚙️ Quick Dashboard Access**: One-click navigation to full options page
- **🎨 Modern Design**: Glass-morphism effects with animated background elements

#### **Unified Storage System** ✅

- **🏗️ Service Architecture**: Clean service-repository pattern for all anime operations
- **🏪 Local-First Storage**: All data stored securely in browser's local storage
- **📊 Comprehensive APIs**: Full CRUD operations via AnimeService
- **🔄 Storage Layers**: `AnimeService`, `Repositories`, `StorageAdapter`
- **📈 Data Models**: Complete TypeScript interfaces for all anime data structures

#### **Enterprise-Grade Testing** ✅

- **🧪 100% Test Coverage**: Comprehensive unit tests for all components and services (370 tests)
- **🛡️ Type Safety**: Full TypeScript implementation with strict type checking
- **📝 Data-TestId System**: Robust testing infrastructure for UI components
- **⚡ Performance Testing**: Optimized for Chrome extension environment

### 🔄 Architecture Overview

The extension has a **clean service architecture** where:

- **Content Script**: Uses `AnimeService` for all anime operations (Watch/Hide buttons)
- **Dashboard UI**: Ready for integration with the same `AnimeService` backend
- **Storage Layer**: Centralized through service-repository pattern with `StorageAdapter`
- **Testing**: Complete coverage ensuring reliability across all components

### 📋 Integration Status

#### **Current Integration Gaps**

The extension has excellent architecture with complete backend implementation, but needs frontend integration:

- **❌ Static Data**: Dashboard displays hardcoded numbers instead of using `AnimeService.getStatistics()`
- **❌ Missing Routes**: Links to `/favorites` and list detail pages don't exist
- **❌ Button Functionality**: "Add New Anime" and navigation buttons need connection to backend
- **❌ Episode Progress UI**: No interface for the fully-implemented episode tracking system

#### **Next Development Phase**

The extension is production-ready with a solid foundation:

- ✅ Clean service-repository architecture with 100% test coverage
- ✅ Working content script for anime websites
- ✅ Beautiful UI design system and components
- ✅ Proper Chrome extension architecture

**Immediate next steps:**

1. **Connect UI to Backend**: Replace static data with `AnimeService` calls
2. **Add Missing Routes**: Create favorites page and individual list detail pages
3. **Implement Button Functionality**: Connect all existing buttons to actual features
4. **Add Episode Progress UI**: Create interface for tracking episode progress

### 🚀 Roadmap & Future Goals

#### **Backend-Frontend Integration** (Next Phase)

- **Vue Composables**: Create reactive wrappers for `AnimeService`
- **Real-Time Data**: Replace static numbers with live data from storage
- **Interactive Features**: Add anime creation, editing, and management
- **Episode Progress UI**: Visual episode tracking interface

#### **MyAnimeList Integration** (Future)

- **API Integration**: Connect with MyAnimeList for anime metadata and cover art
- **Auto-Sync**: Synchronize progress between extension and MAL account
- **Rich Anime Details**: Enhanced anime information with descriptions, ratings, and links

#### **Advanced Features** (Long-term)

- **🔍 Smart Search**: Global search across all anime lists
- **📊 Advanced Analytics**: Detailed statistics and viewing patterns
- **🎯 Recommendations**: AI-powered anime suggestions based on preferences
- **📤 Export/Import**: Data portability for backup and migration
- **🌙 Theme System**: Multiple UI themes beyond current anime aesthetic
- **🖼️ Anime Cover Art**: Visual representation of anime in lists
- **📱 Mobile Optimization**: Enhanced mobile experience
- **♿ Accessibility**: Full WCAG compliance for screen readers

## 🛠️ Technology Stack

- **⚡ Framework**: Vue 3 with Composition API and `<script setup>` syntax
- **🔧 Build Tool**: Vite with hot-reload development
- **📝 Language**: TypeScript with strict type checking
- **🎨 Styling**: Tailwind CSS v4 with glass-morphism utilities
- **🧭 Routing**: Vue Router for SPA navigation (2 routes currently implemented)
- **🏪 State**: Chrome Storage API with service-repository architecture
- **🔌 Browser API**: Chrome Extension APIs (Manifest V3)
- **🧪 Testing**: Vitest with V8 coverage (370 tests, 100% coverage)
- **📏 Linting**: ESLint with Vue and TypeScript rules
- **💅 Formatting**: Prettier with Tailwind class sorting

## 📁 Project Structure

```
src/
├── background/          # Service worker for Chrome extension
├── content/            # Content scripts injected into anime websites
├── popup/              # Extension popup (click icon)
├── options/            # Full dashboard (options page)
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Page layout templates
│   ├── views/          # Page-level components
│   └── router/         # Vue Router configuration
├── commons/            # Shared utilities and models
│   ├── models/         # TypeScript interfaces and types
│   ├── services/       # Business logic services
│   ├── repositories/   # Data access layer
│   └── adapters/       # External API adapters
└── assets/            # Styling and static assets
```

## 🚀 Development

```sh
# Install dependencies
npm install
```

### 🔧 Development Commands

```sh
# Run development server with hot-reload
npm run dev

# Build extension for testing
npm run build:ext

# Run unit tests (370 tests)
npm run test:unit

# Run tests with coverage (100% coverage)
npm run test:unit:coverage

# Run tests in watch mode (development)
npm run test:unit:watch

# Type checking
npm run type-check

# Lint and fix code
npm run lint

# Format code
npm run format
```

### 🌐 Loading the Extension

1. Run `npm run build:ext` to build the extension
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dist` folder
5. The extension icon will appear in your browser toolbar

### 🧪 Testing

We maintain **100% test coverage** with **370 comprehensive tests**:

```sh
# Run all tests
npm run test:unit

# Generate coverage report
npm run test:unit:coverage

# Open coverage report in browser
npm run test:unit:coverage:ui
```

**Test Coverage Breakdown:**

- ✅ **Service Layer**: 100% coverage (AnimeService, repositories, adapters)
- ✅ **Content Script**: 100% coverage (content script integration)
- ✅ **Vue Components**: 100% coverage (popup and options components)
- ✅ **Edge Cases**: Complete error handling and boundary testing

### 📚 Documentation

Comprehensive guides are available in the `docs/` folder:

- **[Project Structure Guide](./docs/PROJECT_STRUCTURE.md)**: Architecture and folder organization
- **[AnimeService Guide](./docs/ANIMESERVICE_GUIDE.md)**: Service layer documentation and usage
- **[UI Design Guide](./docs/UI_DESIGN_GUIDE.md)**: Design system and component patterns
- **[Options Guide](./docs/OPTIONS_GUIDE.md)**: Options page development
- **[Popup Guide](./docs/POPUP_GUIDE.md)**: Popup component development
- **[Testing Guide](./docs/TESTING_GUIDE.md)**: Testing strategies and best practices

## 🎨 Design System

Our extension features a consistent **anime-themed design** with:

- **🌈 Glass-morphism Effects**: Backdrop blur and translucent surfaces
- **🎌 Anime Branding**: Japanese animation inspired visual identity
- **💜 Purple-Pink Gradients**: Anime-inspired color palette
- **✨ Micro-Animations**: Subtle hover effects and transitions
- **📱 Mobile-First**: Responsive design across all screen sizes

## 🏗️ Architecture

### Extension Components

- **🔧 Background Script**: Chrome extension lifecycle handler
- **📄 Content Scripts**: Injected Watch/Hide controls for anime websites
- **🎯 Popup**: Quick access interface with dashboard navigation
- **📊 Options Page**: Vue.js dashboard with glass-morphism design (static data)

### Data Flow

```
Content Script ↔ Chrome Storage ↔ Background Script
     ↕                ↕                   ↕
  Popup UI ←→ AnimeService ←→ Options Dashboard (static)
```

### Storage Architecture

- **📊 Episode Progress**: Complete backend API (not connected to UI)
- **📝 Plan to Watch**: Working content script integration
- **🙈 Hidden Anime**: Working content script integration
- **📈 Statistics**: Backend ready (UI shows placeholder data)

## 🤝 Contributing

1. **📖 Read the Documentation**: Start with our comprehensive guides in `docs/`
2. **🤖 Use GitHub Copilot**: Custom instructions in `.github/copilot-instructions.md` provide project context
3. **🧪 Write Tests**: Maintain 100% coverage for new features
4. **🎨 Follow Design Patterns**: Use established glass-morphism and anime theming
5. **📝 Update Documentation**: Keep guides current with code changes
6. **✅ Run All Checks**: Ensure tests, linting, and type checking pass

### 🎯 Priority Development Areas

**High Priority:**

- Connect dashboard UI to AnimeService backend
- Add missing route implementations
- Implement episode progress tracking interface

**Medium Priority:**

- Add anime management features (add/edit/delete)
- Implement search and filtering
- Add data export/import capabilities

## 📄 License

This project is open-source and available under the MIT License.

---

_Built with ❤️ for the anime community!_ ✨
