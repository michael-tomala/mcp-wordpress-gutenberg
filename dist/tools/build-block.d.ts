import { WordPressSite } from "../types/wp-sites";
export interface BuildBlockArgs {
    blockPluginDirname: string;
    siteKey: string;
}
export declare const buildBlock: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            siteKey: {
                type: string;
                description: string;
            };
            blockPluginDirname: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute: (args: BuildBlockArgs, site: WordPressSite) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
