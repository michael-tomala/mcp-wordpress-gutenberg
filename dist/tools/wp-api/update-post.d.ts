import { WordPressSite } from "types/wp-sites";
export declare const apiUpdatePost: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            siteKey: {
                type: string;
                description: string;
            };
            postId: {
                type: string;
                description: string;
            };
            postType: {
                type: string;
                description: string;
            };
            template: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            excerpt: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(args: {
        siteKey: string;
        postId: number;
        postType: string;
        title?: string;
        template?: string;
        excerpt?: string;
    }, site: WordPressSite): Promise<{
        updatedPost: any;
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
