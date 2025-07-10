import HomeView from "@/options/views/HomeView.vue";
import { createMemoryHistory, createRouter } from "vue-router";

const router = createRouter({
    history: createMemoryHistory(),
    routes: [
        {
            path: "/",
            name: "home",
            component: HomeView,
        },
        {
            path: "/watch-lists",
            name: "watch-lists",
            component: () => import("@/options/views/AllWatchLists.vue"),
        },
    ],
});

export default router;
