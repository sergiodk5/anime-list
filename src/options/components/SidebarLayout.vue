<template>
    <aside
        data-testid="sidebar"
        class="flex w-64 flex-col border-r border-white/20 bg-black/30 text-white backdrop-blur-xs"
    >
        <!-- Logo/Brand Section -->
        <div
            data-testid="sidebar-header"
            class="flex h-16 items-center justify-center border-b border-white/20 bg-black/40"
        >
            <div
                data-testid="sidebar-brand"
                class="flex items-center gap-3"
            >
                <div
                    data-testid="sidebar-icon"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/20 backdrop-blur-xs"
                >
                    <img
                        src="/assets/images/darkness_32x32.png"
                        alt="Darkness from KonoSuba"
                        class="h-6 w-6 rounded-xs"
                    />
                </div>
                <span
                    data-testid="sidebar-title"
                    class="text-lg font-bold tracking-tight text-white drop-shadow-md"
                >
                    AnimeList
                </span>
            </div>
        </div>

        <!-- Navigation -->
        <nav
            data-testid="sidebar-nav"
            class="flex-1 space-y-2 p-4"
            aria-labelledby="navigation"
        >
            <RouterLink
                data-testid="nav-home"
                to="/"
                class="group flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-white/90 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-black/20 active:scale-95"
                :class="{ 'border-white/30 bg-white/15 text-white shadow-md shadow-black/20': $route.path === '/' }"
            >
                <span
                    data-testid="home-icon"
                    class="text-lg drop-shadow-xs"
                    >🏠</span
                >
                <span class="drop-shadow-xs">Home</span>
            </RouterLink>

            <RouterLink
                data-testid="nav-watchlists"
                to="/watch-lists"
                class="group flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-white/90 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-black/20 active:scale-95"
                :class="{
                    'border-white/30 bg-white/15 text-white shadow-md shadow-black/20': $route.path === '/watch-lists',
                }"
            >
                <span
                    data-testid="watchlist-icon"
                    class="text-lg drop-shadow-xs"
                    >📺</span
                >
                <span class="drop-shadow-xs">Watch Lists</span>
            </RouterLink>

            <a
                data-testid="nav-favorites"
                href="/favorites"
                class="group flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-white/90 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-black/20 active:scale-95"
            >
                <span
                    data-testid="favorites-icon"
                    class="text-lg drop-shadow-xs"
                    >⭐</span
                >
                <span class="drop-shadow-xs">Favorites</span>
            </a>
        </nav>

        <!-- Footer -->
        <div
            data-testid="sidebar-footer"
            class="border-t border-white/20 p-4"
        >
            <a
                data-testid="reference-link"
                href="#"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors duration-200 hover:text-white/90"
            >
                <span class="text-base">🔗</span>
                <span class="drop-shadow-xs">Reference Link</span>
            </a>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const $route = useRoute();
</script>
