<template>
    <aside class="flex w-64 flex-col bg-gray-800 text-white">
        <div class="flex h-16 items-center justify-center bg-gray-900 text-xl font-bold">
            <span>Anime Watcher</span>
        </div>
        <nav
            class="flex-1 space-y-2 p-4"
            aria-labelledby="breadcrumbs"
        >
            <RouterLink
                to="/"
                class="block rounded px-4 py-2 hover:bg-gray-700"
            >
                Home
            </RouterLink>
            <RouterLink
                to="/watch-lists"
                class="block rounded px-4 py-2 hover:bg-gray-700"
            >
                Watch Lists
            </RouterLink>
            <a
                href="/favorites"
                class="block rounded px-4 py-2 hover:bg-gray-700"
            >
                Favorites
            </a>
        </nav>
        <div class="border-t border-gray-700 p-4">
            <a
                href="#"
                class="block px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
                Reference Link
            </a>
        </div>
    </aside>
</template>

<script setup lang="ts"></script>
