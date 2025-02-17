export interface WordPressSite {
    name: string;
    path: string;
    pluginsPath: string;
    apiUrl: string;
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
