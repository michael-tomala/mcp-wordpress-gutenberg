// src/types/wp-sites.ts
export interface WordPressSite {
    cli?: string;
    localWpSshEntryFile?: string;
    name: string;
    path: string;           // Ścieżka do instalacji WordPress
    pluginsPath: string;           // Ścieżka do instalacji WordPress
    apiUrl: string;         // URL do WP REST API
    apiCredentials?: {
        username: string;
        password: string;
    };
    database?: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
    };
}

export interface WPSitesConfig {
    sites: Record<string, WordPressSite>;
}