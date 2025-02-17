import { WordPressSite } from "../types/wp-sites";
export interface BuildBlockArgs {
    name: string;
    directory: string;
    site: WordPressSite;
}
export declare const buildBlockTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            site: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute: (args: BuildBlockArgs) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
