<template>
    <button
        v-if="canUndo"
        data-testid="undo-button"
        class="group flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-xs transition-all duration-200 hover:border-white/30 hover:bg-white/20 hover:text-white hover:shadow-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        :title="tooltip"
        @click="handleUndo"
    >
        <span
            class="flex h-5 w-5 items-center justify-center rounded-md bg-linear-to-br from-purple-500/70 to-pink-500/70 text-[11px] text-white shadow-xs transition-colors group-hover:from-purple-400 group-hover:to-pink-400"
            data-testid="undo-icon"
        >
            ↩
        </span>
        <span
            class="hidden drop-shadow-xs sm:inline"
            data-testid="undo-label"
            >Undo</span
        >
        <span
            v-if="stackLength > 1"
            data-testid="undo-count"
            class="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white/80"
            >{{ stackLength }}</span
        >
    </button>
</template>

<script setup lang="ts">
import { undoLast, useUndoStack } from "@/options/commons/undoManager";
import { computed } from "vue";

const { canUndo, entries } = useUndoStack();

const stackLength = computed(() => entries.value.length);
const tooltip = computed(() => (stackLength.value > 0 ? `Undo last action (${stackLength.value})` : "Undo"));

function handleUndo() {
    undoLast();
}
</script>

<style scoped></style>
