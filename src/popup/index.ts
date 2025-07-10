import "@/commons/assets/main.css";

import { createApp } from "vue";

import PopupPage from "@/popup/PopupPage.vue";

const rootContainer = document.getElementById("myAnimeListPopup");
if (!rootContainer) {
    throw new Error("Root container not found");
}

const app = createApp(PopupPage);

app.mount(rootContainer);
