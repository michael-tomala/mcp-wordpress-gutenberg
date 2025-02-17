export declare const scaffoldPluginTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            site: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            directory: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute: (args: {
        name: string;
        directory: string;
    }) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
