import "@/commons/assets/main.css";

import { createApp } from "vue";

import OptionsPage from "@/options/OptionsPage.vue";
import router from "@/options/router";
import { setupPinia } from "@/options/stores";
import Toast, { POSITION } from "vue-toastification";
import "vue-toastification/dist/index.css";
import type { PluginOptions } from "vue-toastification/dist/types/types";

const rootContainer = document.getElementById("myAnimeListOptions");
if (!rootContainer) {
    throw new Error("Root container not found");
}

const app = createApp(OptionsPage);

setupPinia(app);
app.use(router);

const toastOptions: PluginOptions = {
    position: POSITION.TOP_RIGHT,
    timeout: 4000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.4,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: "button",
    icon: true,
    rtl: false,
};

app.use(Toast, toastOptions);

app.mount(rootContainer);
