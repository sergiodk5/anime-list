/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ENABLE_UNDO?: string;
}
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
