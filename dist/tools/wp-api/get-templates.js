import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
export const apiGetTemplates = {
    name: "wp_api_get_templates",
    description: "Get available templates for a specific post type in WordPress",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: { type: "string", description: "Site key" },
            postType: { type: "string", description: "The post type to fetch templates for" },
        },
        required: ["siteKey", "postType"]
    },
    async execute(args, site) {
        try {
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/templates?post_type=${args.postType}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to get templates: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }
            const data = await response.json();
            const list = data.map((template, i) => {
                return (i + 1) + '. ' + template.title.raw + ' (slug: ' + template.slug + ')';
            });
            return {
                templates: data,
                templatesList: list,
                content: [{
                        type: "text",
                        text: `Available templates for post type "${args.postType}":\n\n${list.join('\n')}`
                    }]
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_get_templates failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_get_templates failed: Unknown error occurred');
        }
    }
};
