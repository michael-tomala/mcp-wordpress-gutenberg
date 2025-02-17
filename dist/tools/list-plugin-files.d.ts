import { WordPressSite } from "../types/wp-sites";
export declare const listPluginFiles: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            siteKey: {
                type: string;
                description: string;
            };
            pluginDirName: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(args: {
        pluginDirName: string;
        siteKey: string;
    }, site: WordPressSite): Promise<{
        isError: boolean;
        directories: string[];
        content: {
            type: string;
            text: string;
        }[];
        files?: undefined;
    } | {
        files: any[];
        content: {
            type: string;
            text: string;
        }[];
        isError?: undefined;
        directories?: undefined;
    }>;
};
