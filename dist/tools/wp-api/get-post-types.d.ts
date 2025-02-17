import { WordPressSite } from "types/wp-sites";
export declare const apiGetPostTypes: {
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
        postTypes: any;
        postTypesList: string[];
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
