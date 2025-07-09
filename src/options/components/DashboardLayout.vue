<!-- src/views/Dashboard.vue -->
<template>
    <div class="flex h-screen bg-gray-100">
        <!-- Sidebar -->
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
                    to="/watch-list"
                    class="block rounded px-4 py-2 hover:bg-gray-700"
                >
                    Watch List
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

        <!-- Main Content Area -->
        <div class="flex flex-1 flex-col">
            <!-- Header -->
            <header class="flex h-16 items-center justify-between bg-white px-4 shadow">
                <!-- Breadcrumbs -->
                <nav
                    aria-label="Breadcrumb"
                    class="flex space-x-4"
                >
                    <RouterLink
                        to="/"
                        class="text-gray-600 hover:text-gray-800"
                    >
                        Home
                    </RouterLink>
                    <span class="text-gray-500">/</span>
                    <span class="text-gray-500">Watch List</span>
                </nav>
                <!-- User Menu -->
                <div class="flex items-center space-x-4">
                    <button class="text-gray-600 hover:text-gray-800">
                        <svg
                            class="h-6 w-6"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M12 12c2.67 0 8 1.34 8 4v2H4v-2c0-2.66 5.33-4 8-4zm0-2c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 4c-1.66 0-5.33.84-6 2h12c-.67-1.16-4.34-2-6-2z"
                            />
                        </svg>
                    </button>
                    <span class="text-gray-600">User Account</span>
                </div>
            </header>

            <!-- Content Section -->
            <main class="flex-1 overflow-y-auto p-6">
                <!-- Slot named content -->
                <slot name="content"></slot>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts"></script>
