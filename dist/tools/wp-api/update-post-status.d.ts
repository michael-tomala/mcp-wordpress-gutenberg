import { WordPressSite } from "types/wp-sites";
export declare const apiUpdatePostStatus: {
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
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            publishDate: {
                type: string;
                format: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(args: {
        siteKey: string;
        postId: number;
        postType: string;
        status: string;
        publishDate?: string;
    }, site: WordPressSite): Promise<{
        pluginData: any;
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
