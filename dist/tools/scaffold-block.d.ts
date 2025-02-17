import { WordPressSite } from "../types/wp-sites";
interface ScaffoldArgs {
    name: string;
    siteKey: string;
    variant: string;
    namespace: string;
}
export declare const scaffoldBlockTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            siteKey: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            variant: {
                type: string;
                description: string;
            };
            namespace: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute: (args: ScaffoldArgs, site: WordPressSite) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
export {};
