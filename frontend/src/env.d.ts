/// <reference types="vite/client" />

declare namespace NodeJS {
    interface ProcessEnv {
        /** The base URL of the API (exposed by Vite) */
        VITE_BACKEND_URL?: string;
    }
}