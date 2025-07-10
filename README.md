# Anime List Enhancer

An open-source browser extension to enhance your anime viewing experience on your favorite sites. Take control of your watch lists, track progress, and customize what you see.

## Core Features

### Currently Implemented

-   **Plan to Watch List**: Add anime to a personal "plan to watch" list directly from listing pages.
-   **Episode Progress Tracking**: For anime you're watching, a tracker UI appears on the watch page. You can easily increment or decrement your current episode.
-   **Seamless Integration**: UI elements are injected directly into the anime website for a native feel, supporting the site's dynamic navigation.
-   **Local-First Storage**: All your data is stored securely in your browser's local storage. No need to create an account on the website.

### Roadmap & Future Goals

-   **Central Dashboard**: A comprehensive dashboard to view and manage your "Planned", "Currently Watching", "Completed", and "Favorites" lists.
-   **Anime Detail Page**: A dedicated view for each anime with its description, and links to external sites like MyAnimeList, AniList, etc.
-   **Advanced Content Filtering**: Customize your browsing experience by hiding anime you've already watched or aren't interested in.
-   **Favorites List**: Keep a special list of your all-time favorite anime.
-   **And much more!**

## Technology Stack

-   **Framework**: Vue 3
-   **Build Tool**: Vite
-   **Language**: TypeScript
-   **Browser API**: Chrome Extension APIs (Manifest V3)
-   **Testing**: Vitest & Playwright
-   **Linting**: ESLint

## Project Setup

```sh
# Install dependencies
npm install
```

### Development

```sh
# Run the development server with hot-reload
npm run dev
```

> Load the `dist` folder as an unpacked extension in Chrome/Edge to test.

### Build for Production

```sh
# Type-check, compile, and minify for production
npm run build
```

### Testing

```sh
# Run Unit Tests
npm run test:unit

# Run End-to-End Tests
npm run test:e2e
```
