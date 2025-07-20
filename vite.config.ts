import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vitejs.dev/config/
export default defineConfig(() => {
    return {
        plugins: [vue(), vueDevTools(), tailwindcss()],
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
                    options: fileURLToPath(new URL("./src/options/index.html", import.meta.url)),
                    background: fileURLToPath(new URL("./src/background/index.ts", import.meta.url)),
                    // content script will be built separately
                    manifest: fileURLToPath(new URL("./manifest.ts", import.meta.url)),
                },
                output: {
                    format: "es",
                    entryFileNames: (chunk) => {
                        return `src/${chunk.name}/index.js`;
                    },
                    chunkFileNames: "assets/[name]-[hash].js",
                    assetFileNames: "assets/[name]-[hash].[ext]",
                    // Force everything to be bundled with each entry point
                    manualChunks: () => undefined,
                },
                external: [], // Bundle everything inline
            },
        },
    };
});
