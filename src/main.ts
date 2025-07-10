import "@/commons/assets/main.css";

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "@/App.vue";

const rootContainer = document.getElementById("app");
if (!rootContainer) {
    throw new Error("Root container not found");
}

const app = createApp(App);

app.use(createPinia());

app.mount(rootContainer);
