import "@/commons/assets/main.css";

import { createApp } from "vue";

import OptionsPage from "@/options/OptionsPage.vue";
import router from "@/options/router";
import { setupPinia } from "@/options/stores";
import Vue3Toastify, { type ToastContainerOptions } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

const rootContainer = document.getElementById("myAnimeListOptions");
if (!rootContainer) {
    throw new Error("Root container not found");
}

const app = createApp(OptionsPage);

setupPinia(app);
app.use(router);

const toastOptions: ToastContainerOptions = {
    position: "top-right",
    autoClose: 4000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    hideProgressBar: false,
    theme: "colored",
    rtl: false,
};

app.use(Vue3Toastify, toastOptions);

app.mount(rootContainer);
