# AnimeList Chrome Extension

[![CI](https://github.com/sergiodk5/anime-list/actions/workflows/ci.yml/badge.svg)](https://github.com/sergiodk5/anime-list/actions/workflows/ci.yml)
[![Release](https://github.com/sergiodk5/anime-list/actions/workflows/release.yml/badge.svg)](https://github.com/sergiodk5/anime-list/actions/workflows/release.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/sergiodk5/anime-list)](https://github.com/sergiodk5/anime-list/releases)
[![GitHub issues](https://img.shields.io/github/issues/sergiodk5/anime-list)](https://github.com/sergiodk5/anime-list/issues)
[![GitHub license](https://img.shields.io/github/license/sergiodk5/anime-list)](https://github.com/sergiodk5/anime-list/blob/main/LICENSE)
[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

A modern browser extension to enhance your anime viewing experience with beautiful glass-morphism UI and comprehensive tracking features. Take control of your watch lists, track progress, and customize what you see.

## ✨ Core Features

### 🎯 Currently Implemented

#### **Content Script Integration**

- **Plan to Watch List**: Add anime to your personal "plan to watch" list directly from anime listing pages
- **Episode Progress Tracking**: Interactive episode tracker on watch pages with increment/decrement controls
- **Hide Anime System**: Hide anime you're not interested in with easy unhide functionality
- **Seamless Integration**: UI elements injected directly into anime websites for native feel
- **Smart State Management**: Automatic transition from "Plan to Watch" to "Currently Watching"

#### **Modern Dashboard (Options Page)**

- **🏠 Home Dashboard**: Beautiful anime-themed welcome page with statistics and quick actions
- **📺 Watch Lists Management**: Comprehensive view of all your anime lists (Currently Watching, Completed, Plan to Watch, On Hold, Dropped)
- **🎨 Glass-Morphism UI**: Modern design with Darkness (KonoSuba) branding and purple-pink gradients
- **📱 Responsive Design**: Mobile-first design that works across all screen sizes
- **🧭 Vue Router Navigation**: Single-page application with smooth transitions

#### **Extension Popup**

- **🎌 Anime-Themed Branding**: Consistent Darkness icon and anime aesthetic
- **⚙️ Quick Dashboard Access**: One-click navigation to full options page
- **🎨 Modern Design**: Glass-morphism effects with animated background elements

#### **Robust Storage System**

- **🏪 Local-First Storage**: All data stored securely in browser's local storage
- **📊 Comprehensive APIs**: Full CRUD operations for all anime tracking features
- **🔄 Real-Time Sync**: Automatic updates across extension components
- **📈 Statistics Tracking**: Recently watched, recently planned, and progress analytics

#### **Enterprise-Grade Testing**

- **🧪 100% Test Coverage**: Comprehensive unit tests for all components and utilities
- **🛡️ Type Safety**: Full TypeScript implementation with strict type checking
- **📝 Data-TestId System**: Robust testing infrastructure for UI components
- **⚡ Performance Testing**: Optimized for Chrome extension environment

### 🚀 Roadmap & Future Goals

#### **MyAnimeList Integration**

- **API Integration**: Connect with MyAnimeList for anime metadata and cover art
- **Auto-Sync**: Synchronize progress between extension and MAL account
- **Rich Anime Details**: Enhanced anime information with descriptions, ratings, and links

#### **Advanced Features**

- **🔍 Smart Search**: Global search across all your anime lists
- **📊 Advanced Analytics**: Detailed statistics and viewing patterns
- **🎯 Recommendations**: AI-powered anime suggestions based on your preferences
- **📤 Export/Import**: Data portability for backup and migration
- **🌙 Theme System**: Multiple UI themes beyond current anime aesthetic

#### **Enhanced UI/UX**

- **🖼️ Anime Cover Art**: Visual representation of anime in lists
- **📱 Mobile Optimization**: Enhanced mobile experience
- **♿ Accessibility**: Full WCAG compliance for screen readers
- **🎭 Animation System**: Enhanced micro-interactions and transitions

## 🛠️ Technology Stack

- **⚡ Framework**: Vue 3 with Composition API
- **🔧 Build Tool**: Vite with hot-reload development
- **📝 Language**: TypeScript with strict type checking
- **🎨 Styling**: Tailwind CSS with custom glass-morphism utilities
- **🧭 Routing**: Vue Router for SPA navigation
- **🏪 State**: Pinia for advanced state management
- **🔌 Browser API**: Chrome Extension APIs (Manifest V3)
- **🧪 Testing**: Vitest with V8 coverage and Vue Test Utils
- **🎭 E2E Testing**: Playwright for end-to-end scenarios
- **📏 Linting**: ESLint with Vue and TypeScript rules
- **💅 Formatting**: Prettier for consistent code style

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
│   └── utils/          # Storage utilities and business logic
└── assets/            # Styling and static assets
```

## 🚀 Development

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

# Run unit tests
npm run test:unit

# Run tests with coverage
npm run test:unit:coverage

# Run tests in watch mode (development)
npm run test:unit:watch

# Run end-to-end tests
npm run test:e2e

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

We maintain **100% test coverage** across all components:

```sh
# Run all tests
npm run test:unit

# Generate coverage report
npm run test:unit:coverage

# Open coverage report in browser
npm run test:unit:coverage:ui
```

### 📚 Documentation

Comprehensive guides are available in the `docs/` folder:

- **[Project Structure Guide](./docs/PROJECT_STRUCTURE.md)**: Architecture and folder organization
- **[UI Design Guide](./docs/UI_DESIGN_GUIDE.md)**: Design system and component patterns
- **[Options Guide](./docs/OPTIONS_GUIDE.md)**: Options page development
- **[Popup Guide](./docs/POPUP_GUIDE.md)**: Popup component development
- **[Testing Guide](./docs/TESTING_GUIDE.md)**: Testing strategies and best practices

## 🎨 Design System

Our extension features a consistent **anime-themed design** with:

- **🌈 Glass-morphism Effects**: Backdrop blur and translucent surfaces
- **🎌 Darkness Branding**: KonoSuba's Darkness character as our mascot
- **💜 Purple-Pink Gradients**: Anime-inspired color palette
- **✨ Micro-Animations**: Subtle hover effects and transitions
- **📱 Mobile-First**: Responsive design across all screen sizes

## 🏗️ Architecture

### Extension Components

- **🔧 Background Script**: Handles Chrome extension lifecycle and APIs
- **📄 Content Scripts**: Injected into anime websites for seamless integration
- **🎯 Popup**: Quick access interface when clicking the extension icon
- **📊 Options Page**: Full-featured dashboard with Vue Router navigation

### Data Flow

```
Content Script ↔ Chrome Storage ↔ Background Script
     ↕                ↕                   ↕
  Popup UI ←→ Commons Utils ←→ Options Dashboard
```

### Storage Architecture

- **📊 Episode Progress**: Track current episode and last watched date
- **📝 Plan to Watch**: Queue anime for future viewing
- **🙈 Hidden Anime**: Filter out unwanted content
- **📈 Statistics**: Usage analytics and viewing patterns

## 🤝 Contributing

1. **📖 Read the Documentation**: Start with our comprehensive guides in `docs/`
2. **🤖 Use GitHub Copilot**: Custom instructions in `.github/copilot-instructions.md` provide project context
3. **🧪 Write Tests**: Maintain 100% coverage for new features
4. **🎨 Follow Design Patterns**: Use established glass-morphism and anime theming
5. **📝 Update Documentation**: Keep guides current with code changes
6. **✅ Run All Checks**: Ensure tests, linting, and type checking pass

## 📄 License

This project is open-source and available under the MIT License.

---

_Built with ❤️ for the anime community! Featuring Darkness from KonoSuba._ ✨
