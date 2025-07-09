import { createMemoryHistory, createRouter } from "vue-router";
import HomeView from "@/views/HomeView.vue";

const router = createRouter({
    history: createMemoryHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "home",
            component: HomeView,
        },
        {
            path: "/list",
            name: "list",
            component: () => import("@/options/views/WatchList.vue"),
        },
        {
            path: "/list-item/:title/:url/:externalId?",
            name: "list-item",
            component: () => import("@/options/views/WatchItem.vue"),
            props: (route) => ({
                title: route.params.title as string,
                url: route.params.url as string,
                externalId: route.params.externalId ? Number(route.params.externalId) : undefined,
            }),
        },
        {
            path: "/watch-list",
            name: "watch-list",
            component: () => import("@/options/views/WatchLists.vue"),
        },
    ],
});

export default router;
