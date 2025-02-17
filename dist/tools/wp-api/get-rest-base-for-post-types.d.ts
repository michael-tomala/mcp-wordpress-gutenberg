import { WordPressSite } from "types/wp-sites";
export declare const apiGetRestBaseForPostType: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            siteKey: {
                type: string;
                description: string;
            };
            postType: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(args: {
        siteKey: string;
        postType: string;
    }, site: WordPressSite): Promise<{
        postType: any;
        restBase: any;
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
