import { WordPressSite } from "../types/wp-sites";
export declare const listAvailablePluginsInSitePluginsPath: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {};
        required: never[];
    };
    execute(args: any, site: WordPressSite): Promise<{
        content: {
            type: string;
            text: string;
            directories: string[];
        }[];
    }>;
};
