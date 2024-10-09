import "@/assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "@/App.vue";
import router from "@/router";

const rootContainer = document.getElementById("myAnimeListPopup");
if (!rootContainer) {
    throw new Error("Root container not found");
}

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount(rootContainer);
