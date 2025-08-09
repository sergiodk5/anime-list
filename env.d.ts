/// <reference types="vite/client" />

// Temporary module declaration for vue-toastification types (library provides its own types, this suppresses TS error pre-install)
declare module "vue-toastification";

interface ImportMetaEnv {
    readonly VITE_ENABLE_UNDO?: string;
}
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
