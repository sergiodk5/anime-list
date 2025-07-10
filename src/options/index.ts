import "@/commons/assets/main.css";

import { createPinia } from "pinia";
import { createApp } from "vue";

import OptionsPage from "@/options/OptionsPage.vue";
import router from "@/options/router";

const rootContainer = document.getElementById("myAnimeListOptions");
if (!rootContainer) {
    throw new Error("Root container not found");
}

const app = createApp(OptionsPage);

app.use(createPinia());
app.use(router);

app.mount(rootContainer);
