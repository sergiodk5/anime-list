<template>
    <header class="flex h-16 items-center justify-between bg-white px-4 shadow">
        <!-- Breadcrumbs -->
        <nav
            aria-label="Breadcrumb"
            class="flex space-x-4"
        >
            <template
                v-for="(crumb, index) in breadcrumbs"
                :key="crumb.path"
            >
                <RouterLink
                    :to="crumb.path"
                    class="text-gray-600 hover:text-gray-800"
                >
                    {{ crumb.name }}
                </RouterLink>
                <span
                    v-if="index < breadcrumbs.length - 1"
                    class="text-gray-500"
                    >/</span
                >
            </template>
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
