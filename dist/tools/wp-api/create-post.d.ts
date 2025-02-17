import { WordPressSite } from "types/wp-sites";
export declare const apiCreatePost: {
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
            title: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            parent: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(args: {
        siteKey: string;
        postType: string;
        title: string;
        content: string;
        parent: Number;
    }, site: WordPressSite): Promise<{
        isError: boolean;
        content: {
            type: string;
            text: string;
        }[];
        pluginData?: undefined;
    } | {
        pluginData: any;
        content: {
            type: string;
            text: string;
        }[];
        isError?: undefined;
    }>;
};
