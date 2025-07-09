<!-- src/views/Dashboard.vue -->
<template>
    <div class="flex h-screen bg-gray-100">
        <SidebarLayout />

        <!-- Main Content Area -->
        <div class="flex flex-1 flex-col">
            <HeaderLayout />

            <!-- Content Section -->
            <main class="flex-1 overflow-y-auto p-6">
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
