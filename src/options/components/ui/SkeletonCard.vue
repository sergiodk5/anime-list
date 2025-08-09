<template>
    <div
        data-testid="skeleton-card"
        class="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xs"
    >
        <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-xl bg-white/15" />
            <div class="flex-1 space-y-3">
                <div class="h-4 w-1/2 rounded bg-white/15" />
                <div class="h-6 w-1/3 rounded bg-white/20" />
            </div>
        </div>
    </div>
</template>
<script setup lang="ts"></script>
