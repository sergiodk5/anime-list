<template>
    <div
        v-if="visible"
        class="relative"
    >
        <button
            data-testid="offline-queue-badge"
            :title="tooltip"
            class="group flex items-center gap-2 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur-xs transition-all duration-200 hover:border-white/40 focus:outline-none"
            :class="badgeClasses"
            @click="togglePanel"
        >
            <span
                class="inline-flex h-2.5 w-2.5 rounded-full"
                :class="dotClasses"
            ></span>
            <span>{{ label }}</span>
            <span
                v-if="queuedCount > 0"
                data-testid="offline-queue-count"
                class="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold"
                >{{ queuedCount }}</span
            >
        </button>
        <div
            v-if="panelOpen"
            data-testid="offline-queue-panel"
            class="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-white/15 bg-black/70 p-4 text-white shadow-lg backdrop-blur-md"
        >
            <div class="mb-2 flex items-center justify-between">
                <h3 class="text-sm font-semibold">Offline Queue</h3>
                <button
                    data-testid="offline-queue-close"
                    class="text-white/60 transition-colors hover:text-white"
                    @click="panelOpen = false"
                >
                    ✕
                </button>
            </div>
            <p
                v-if="queuedCount === 0"
                class="text-xs text-white/50"
            >
                No pending actions.
            </p>
            <ul
                v-else
                class="max-h-40 space-y-2 overflow-auto pr-1 text-xs"
            >
                <li
                    v-for="a in previewActions"
                    :key="a.id"
                    class="rounded-lg bg-white/5 px-2 py-1.5"
                >
                    <div class="flex justify-between">
                        <span class="truncate">{{ a.description || a.type }}</span>
                        <span class="text-white/40">x{{ a.retries }}</span>
                    </div>
                    <div class="mt-0.5 text-[10px] text-white/35">{{ timeAgo(a.createdAt) }}</div>
                </li>
            </ul>
            <div
                v-if="queuedCount > previewActions.length"
                class="mt-2 text-[10px] text-white/40"
            >
                + {{ queuedCount - previewActions.length }} more
            </div>
            <div class="mt-3 flex gap-2">
                <button
                    data-testid="offline-queue-retry"
                    class="flex-1 rounded-lg bg-linear-to-r from-purple-500/70 to-pink-500/70 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:from-purple-500 hover:to-pink-500"
                    @click="processNow"
                    :disabled="processing"
                >
                    {{ processing ? "Processing…" : "Process Now" }}
                </button>
                <button
                    data-testid="offline-queue-dismiss"
                    class="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-white/40 hover:text-white"
                    @click="panelOpen = false"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getOfflineQueue } from "@/options/composables";
import { useNetwork } from "@vueuse/core";
import { computed, ref, watch } from "vue";
import { useToast } from "vue-toastification";

const queue = getOfflineQueue();
const { isOnline } = useNetwork();
const toast = useToast();

const panelOpen = ref(false);
const lastProcessedSnapshot = ref({ processed: 0, dropped: 0 });

const queuedCount = computed(() => queue.size.value);
const visible = computed(() => !isOnline.value || queuedCount.value > 0);
const processing = computed(() => queue.isProcessing.value);

const previewActions = computed(() => queue.queue.value.slice(0, 5));

const label = computed(() => {
    if (!isOnline.value) return "Offline";
    if (queuedCount.value > 0) return "Queued";
    return "Online";
});

const badgeClasses = computed(() => {
    if (!isOnline.value) return "bg-red-500/20 text-red-100 border-red-500/30";
    if (queuedCount.value > 0) return "bg-amber-500/20 text-amber-100 border-amber-500/30";
    return "bg-emerald-500/20 text-emerald-100 border-emerald-500/30";
});

const dotClasses = computed(() => {
    if (!isOnline.value) return "bg-red-400 shadow-red-500/40";
    if (queuedCount.value > 0) return "bg-amber-400 shadow-amber-500/40";
    return "bg-emerald-400 shadow-emerald-500/40";
});

const tooltip = computed(() => {
    if (!isOnline.value) return `${queuedCount.value} action(s) queued while offline`;
    if (queuedCount.value > 0) return `${queuedCount.value} pending action(s)`;
    return "All actions synced";
});

function timeAgo(ts: number) {
    const diff = Date.now() - ts;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    return `${hr}h ago`;
}

function togglePanel() {
    panelOpen.value = !panelOpen.value;
}

async function processNow() {
    if (!isOnline.value) return;
    lastProcessedSnapshot.value = { processed: queue.processedCount.value, dropped: queue.droppedCount.value };
    // Always attempt process even if currently not showing any tasks (idempotent in composable)
    await queue.processQueue();
}

// Watch for transition from processing to idle to show flush toast
watch(
    () => queue.isProcessing.value,
    (cur, prev) => {
        if (prev && !cur) {
            const processedDelta = queue.processedCount.value - lastProcessedSnapshot.value.processed;
            const droppedDelta = queue.droppedCount.value - lastProcessedSnapshot.value.dropped;
            if (processedDelta > 0 || droppedDelta > 0) {
                if (droppedDelta === 0) {
                    toast.success(`Synced ${processedDelta} offline action${processedDelta === 1 ? "" : "s"}`);
                } else {
                    toast.error(
                        `Processed ${processedDelta}, dropped ${droppedDelta} action${droppedDelta === 1 ? "" : "s"}`,
                    );
                }
            }
        }
    },
);
</script>
