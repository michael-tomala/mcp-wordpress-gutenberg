import { WordPressSite } from "types/wp-sites";
export declare const apiGetPost: {
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
            postId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(args: {
        siteKey: string;
        postType: string;
        postId: number;
    }, site: WordPressSite): Promise<{
        post: any;
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
