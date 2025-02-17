import { WordPressSite } from "types/wp-sites";
export declare const apiGetPlugins: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            siteKey: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
        additionalProperties: boolean;
    };
    execute(args: {
        siteKey: string;
        status?: string;
    }, site: WordPressSite): Promise<{
        plugins: any;
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
