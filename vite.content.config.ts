import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

// Separate Vite config for content script to avoid ES module imports
export default defineConfig({
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
        lib: {
            entry: fileURLToPath(new URL("./src/content/index.ts", import.meta.url)),
            formats: ["iife"],
            name: "AnimeListContent",
            fileName: () => "src/content/index.js",
        },
        rollupOptions: {
            external: [], // Bundle everything
            output: {
                extend: true,
                globals: {},
            },
        },
    },
});
