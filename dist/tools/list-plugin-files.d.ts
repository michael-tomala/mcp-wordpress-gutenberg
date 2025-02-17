import { WordPressSite } from "../types/wp-sites";
export declare const listPluginFiles: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            pluginDirName: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(args: {
        pluginDirName: string;
    }, site: WordPressSite): Promise<{
        content: {
            type: string;
            text: string;
            directories: string[];
        }[];
    } | {
        content: {
            type: string;
            text: string;
            files: any[];
        }[];
    }>;
};
