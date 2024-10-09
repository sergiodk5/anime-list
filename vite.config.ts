import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), vueDevTools()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    build: {
        outDir: "dist",
        cssCodeSplit: false,
        emptyOutDir: false,
        minify: false,
        sourcemap: true,
        rollupOptions: {
            input: {
                popup: fileURLToPath(new URL("./src/popup/index.html", import.meta.url)),
                background: fileURLToPath(new URL("./src/background/index.ts", import.meta.url)),
                content: fileURLToPath(new URL("./src/content/index.ts", import.meta.url)),
                manifest: fileURLToPath(new URL("./manifest.ts", import.meta.url)),
            },
            output: {
                format: "module",
                entryFileNames: (chunk: any) => {
                    return `src/${chunk.name}/index.js`;
                },
            },
        },
    },
});
