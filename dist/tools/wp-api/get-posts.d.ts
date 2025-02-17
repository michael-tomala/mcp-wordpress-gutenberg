import { WordPressSite } from "types/wp-sites";
export declare const apiGetPosts: {
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
            perPage: {
                type: string;
                description: string;
            };
            page: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(args: {
        siteKey: string;
        postType: string;
        perPage?: number;
        page?: number;
    }, site: WordPressSite): Promise<{
        pluginData: any;
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
