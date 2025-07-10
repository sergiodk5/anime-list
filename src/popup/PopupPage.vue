<template>
    <div
        data-testid="anime-popup"
        class="relative h-60 w-80 overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600"
    >
        <!-- Animated background pattern -->
        <div
            data-testid="popup-background"
            class="absolute inset-0 opacity-20"
        >
            <div class="absolute left-4 top-4 h-2 w-2 animate-pulse rounded-full bg-white"></div>
            <div class="absolute right-6 top-8 h-1 w-1 animate-ping rounded-full bg-pink-300"></div>
            <div class="absolute bottom-8 left-8 h-1.5 w-1.5 animate-bounce rounded-full bg-purple-300"></div>
            <div class="absolute bottom-4 right-4 h-1 w-1 animate-pulse rounded-full bg-white delay-700"></div>
        </div>

        <!-- Main content -->
        <div
            data-testid="popup-content"
            class="relative flex h-full flex-col justify-between p-6 text-white"
        >
            <!-- Header -->
            <div
                data-testid="popup-header"
                class="mb-2 flex items-center gap-3"
            >
                <div
                    data-testid="anime-icon"
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm"
                >
                    <img
                        src="/assets/images/darkness_32x32.png"
                        alt="Darkness from KonoSuba"
                        class="h-6 w-6 rounded"
                    />
                </div>
                <h1
                    data-testid="popup-title"
                    class="text-xl font-bold tracking-tight text-white drop-shadow-md"
                >
                    AnimeList
                </h1>
            </div>

            <!-- Description -->
            <p
                data-testid="popup-description"
                class="mb-6 text-sm leading-relaxed text-white/90 drop-shadow-sm"
            >
                Manage your anime watch list and track your progress
            </p>

            <!-- CTA Button -->
            <button
                data-testid="options-button"
                class="group relative flex w-full transform items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/30 bg-white/15 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/25 hover:shadow-lg hover:shadow-black/20 active:translate-y-0 active:duration-75"
                @click="openOptions"
            >
                <!-- Animated shine effect -->
                <div
                    data-testid="button-shine"
                    class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                ></div>

                <!-- Button content -->
                <span
                    data-testid="button-icon"
                    class="text-base drop-shadow-sm"
                    >⚙️</span
                >
                <span
                    data-testid="button-text"
                    class="font-semibold tracking-wide drop-shadow-sm"
                    >Open Dashboard</span
                >
            </button>

            <!-- Footer with animated dots -->
            <div
                data-testid="popup-footer"
                class="mt-4 flex justify-center"
            >
                <div
                    data-testid="decorative-dots"
                    class="flex gap-2"
                >
                    <span
                        data-testid="dot"
                        class="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40"
                    ></span>
                    <span
                        data-testid="dot"
                        class="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40 delay-300"
                    ></span>
                    <span
                        data-testid="dot"
                        class="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40 delay-700"
                    ></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const openOptions = () => {
    try {
        if (typeof chrome !== "undefined" && chrome?.runtime?.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            console.warn("Chrome extension API not available");
        }
    } catch (error) {
        console.error("Failed to open options page:", error);
    }
};
</script>

<style scoped>
/* Using Tailwind CSS classes - minimal custom styles needed */
</style>
