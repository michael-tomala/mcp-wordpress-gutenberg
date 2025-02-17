import { WordPressSite } from "types/wp-sites";
export declare const apiUpdatePostContent: {
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
            content: {
                type: string;
                description: string;
            };
            readCurrentContent: {
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
        content: string;
        readCurrentContent: boolean;
    }, site: WordPressSite): Promise<{
        isError: boolean;
        content: {
            type: string;
            text: string;
        }[];
        updatedPost?: undefined;
    } | {
        updatedPost: any;
        content: {
            type: string;
            text: string;
        }[];
        isError?: undefined;
    }>;
};
