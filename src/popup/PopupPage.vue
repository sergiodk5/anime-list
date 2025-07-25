<template>
    <div
        data-testid="anime-popup"
        class="relative h-60 w-80 overflow-hidden bg-linear-to-br from-purple-600 via-purple-700 to-pink-600"
    >
        <!-- Animated background pattern -->
        <div
            data-testid="popup-background"
            class="absolute inset-0 opacity-20"
        >
            <div class="absolute top-4 left-4 h-2 w-2 animate-pulse rounded-full bg-white"></div>
            <div class="absolute top-8 right-6 h-1 w-1 animate-ping rounded-full bg-pink-300"></div>
            <div class="absolute bottom-8 left-8 h-1.5 w-1.5 animate-bounce rounded-full bg-purple-300"></div>
            <div class="absolute right-4 bottom-4 h-1 w-1 animate-pulse rounded-full bg-white delay-700"></div>
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
                    class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/20 backdrop-blur-xs"
                >
                    <img
                        src="/assets/images/darkness_32x32.png"
                        alt="Darkness from KonoSuba"
                        class="h-6 w-6 rounded-xs"
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
                class="mb-6 text-sm leading-relaxed text-white/90 drop-shadow-xs"
            >
                Manage your anime watch list and track your progress
            </p>

            <!-- CTA Button -->
            <button
                data-testid="options-button"
                class="group relative flex w-full transform items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/30 bg-white/15 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-xs transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/25 hover:shadow-lg hover:shadow-black/20 active:translate-y-0 active:duration-75"
                @click="openOptions"
            >
                <!-- Animated shine effect -->
                <div
                    data-testid="button-shine"
                    class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                ></div>

                <!-- Button content -->
                <span
                    data-testid="button-icon"
                    class="text-base drop-shadow-xs"
                    >⚙️</span
                >
                <span
                    data-testid="button-text"
                    class="font-semibold tracking-wide drop-shadow-xs"
                    >Open Dashboard</span
                >
            </button>

            <!-- Clear Hidden Button -->
            <button
                data-testid="clear-hidden-button"
                class="group relative mt-3 flex w-full transform items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white/90 backdrop-blur-xs transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 hover:text-white hover:shadow-lg hover:shadow-black/20 active:translate-y-0 active:duration-75 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-white/10"
                @click="clearAllHidden"
                :disabled="isClearing"
            >
                <!-- Animated shine effect -->
                <div
                    data-testid="clear-button-shine"
                    class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                ></div>

                <!-- Button content -->
                <span
                    data-testid="clear-button-icon"
                    class="text-base drop-shadow-xs"
                    >🗑️</span
                >
                <span
                    data-testid="clear-button-text"
                    class="font-medium tracking-wide drop-shadow-xs"
                    >{{ isClearing ? "Clearing..." : "Clear All Hidden" }}</span
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
import { AnimeService } from "@/commons/services/AnimeService";
import { ref } from "vue";

const animeService = new AnimeService();
const isClearing = ref(false);

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

const clearAllHidden = async () => {
    if (isClearing.value) return;

    try {
        isClearing.value = true;
        const result = await animeService.clearAllHidden();

        if (result.success) {
            // Show success feedback - could be a toast or console log for now
            console.log("✅", result.message);
        } else {
            console.error("❌ Failed to clear hidden anime:", result.message);
        }
    } catch (error) {
        console.error("❌ Error clearing hidden anime:", error);
    } finally {
        isClearing.value = false;
    }
};
</script>
