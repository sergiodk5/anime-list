/// <reference types="vite/client" />

declare global {
    interface ImportMetaEnv {
        readonly DEV: boolean;
        readonly PROD: boolean;
        readonly MODE: string;
        // Add more env variables as needed
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}
