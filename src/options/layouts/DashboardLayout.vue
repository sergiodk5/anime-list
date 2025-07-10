<!-- src/views/Dashboard.vue -->
<template>
    <div
        data-testid="dashboard-layout"
        class="flex h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600"
    >
        <!-- Animated background pattern -->
        <div
            data-testid="dashboard-background"
            class="fixed inset-0 opacity-10"
        >
            <div class="absolute left-8 top-12 h-3 w-3 animate-pulse rounded-full bg-white"></div>
            <div class="absolute right-16 top-20 h-2 w-2 animate-ping rounded-full bg-pink-300"></div>
            <div class="absolute bottom-16 left-16 h-2.5 w-2.5 animate-bounce rounded-full bg-purple-300"></div>
            <div class="absolute bottom-8 right-8 h-2 w-2 animate-pulse rounded-full bg-white delay-700"></div>
            <div class="absolute left-1/3 top-1/4 h-1.5 w-1.5 animate-ping rounded-full bg-purple-200 delay-1000"></div>
            <div class="absolute bottom-1/3 right-1/4 h-1 w-1 animate-pulse rounded-full bg-pink-200 delay-500"></div>
        </div>

        <SidebarLayout />

        <!-- Main Content Area -->
        <div class="flex flex-1 flex-col">
            <HeaderLayout />

            <!-- Content Section -->
            <main
                data-testid="main-content"
                class="flex-1 overflow-y-auto p-6"
            >
                <!-- Slot named content -->
                <slot name="content"></slot>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import HeaderLayout from "@/options/components/HeaderLayout.vue";
import SidebarLayout from "@/options/components/SidebarLayout.vue";
</script>
