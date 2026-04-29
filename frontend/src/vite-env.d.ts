/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * The base URL for the API.
     * Expected format: 'http://localhost:4001'
     * This variable is required and must be defined in your environment.
     * No default is applied in this file; ensure it is set in your environment or .env file.
     */
    readonly VITE_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '@xyflow/react/dist/style.css';
