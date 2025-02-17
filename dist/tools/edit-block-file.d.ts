import { WordPressSite } from "../types/wp-sites.js";
interface FileOperation {
    type: 'write' | 'append' | 'modify' | 'smart_modify';
    content?: string;
    searchValue?: string;
    replaceValue?: string;
}
interface EditFileArgs {
    filePath: string;
    operation: FileOperation['type'];
    content?: string;
    searchValue?: string;
    replaceValue?: string;
    directory: string;
    blockPluginDirname: string;
    siteKey: string;
}
export declare const editBlockFile: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            siteKey: {
                type: string;
                description: string;
            };
            blockPluginDirname: {
                type: string;
                description: string;
            };
            filePath: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            operation: {
                type: string;
                enum: string[];
                description: string;
            };
            searchValue: {
                type: string;
                description: string;
            };
            replaceValue: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(args: EditFileArgs, site: WordPressSite): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
export {};
