<template>
    <DashboardLayout>
        <template #content>
            <RouterView />
        </template>
    </DashboardLayout>
</template>

<script setup lang="ts">
import DashboardLayout from "@/options/layouts/DashboardLayout.vue";
</script>
