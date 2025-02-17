export interface WordPressSite {
    name: string;
    path: string;
    pluginsPath: string;
    aliases?: string[];
    apiUrl: string;
    apiCredentials?: {
        username: string;
        password: string;
    };
}
export interface WPSitesConfig {
    sites: {
        [key: string]: WordPressSite;
    };
}
export interface ToolArguments {
    siteKey: string;
}
export declare function similarity(s1: string, s2: string): number;
export declare function findMatchingSites(config: WPSitesConfig, searchTerm?: string): Array<[string, WordPressSite, number]>;
export declare function formatSitesList(sites: Array<[string, WordPressSite, number]>): string;
export declare function validateAndGetSite(config: WPSitesConfig, siteArg?: string): Promise<WordPressSite>;
export declare function validateSiteToolArguments(args: unknown): asserts args is ToolArguments;
export declare function isGutenbergBlock(directory: string): Promise<boolean>;
export declare function shouldRebuildBlock(directory: string): Promise<boolean>;
