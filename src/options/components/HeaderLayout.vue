<template>
    <header
        data-testid="header"
        class="flex h-16 items-center justify-between border-b border-white/20 bg-black/30 px-6 backdrop-blur-xs"
    >
        <!-- Breadcrumbs -->
        <nav
            data-testid="breadcrumbs"
            aria-label="Breadcrumb"
            class="flex items-center space-x-3"
        >
            <template
                v-for="(crumb, index) in breadcrumbs"
                :key="crumb.path"
            >
                <RouterLink
                    :data-testid="`breadcrumb-${index}`"
                    :to="crumb.path"
                    class="rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white hover:shadow-xs hover:shadow-black/20"
                >
                    {{ crumb.name }}
                </RouterLink>
                <span
                    v-if="index < breadcrumbs.length - 1"
                    data-testid="breadcrumb-separator"
                    class="text-white/40"
                    >›</span
                >
            </template>
        </nav>

        <!-- User Menu -->
        <div
            data-testid="user-menu"
            class="flex items-center space-x-4"
        >
            <button
                data-testid="user-button"
                class="group flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-xs transition-all duration-200 hover:border-white/30 hover:bg-white/20 hover:text-white hover:shadow-md hover:shadow-black/20 active:scale-95"
            >
                <span
                    data-testid="user-avatar"
                    class="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-purple-400 to-pink-400 text-xs font-bold text-white shadow-xs"
                >
                    👤
                </span>
                <span
                    data-testid="user-label"
                    class="drop-shadow-xs"
                >
                    Account
                </span>
            </button>
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const formatBreadcrumbName = (name: string) => {
    if (!name) return "";
    return name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const breadcrumbs = computed(() => {
    const crumbs = route.matched
        .map((r) => ({
            name: formatBreadcrumbName(String(r.name)),
            path: r.path,
        }))
        .filter((r) => r.name);

    if (route.name !== "home") {
        return [{ name: "Home", path: "/" }, ...crumbs];
    }

    return crumbs;
});
</script>
