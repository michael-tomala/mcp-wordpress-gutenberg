import { WordPressSite } from "types/wp-sites";
export declare const apiGetGutenbergBlocks: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            siteKey: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(args: {
        siteKey: string;
    }, site: WordPressSite): Promise<{
        blocks: any;
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
