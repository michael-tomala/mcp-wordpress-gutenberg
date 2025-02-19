import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";

export const apiGetPostTypes = {
    name: "wp_api_get_post_types",
    description: "Get a WordPress post types using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
        },
        required: ["siteKey"]
    },

    async execute(args: { siteKey: string }, site: WordPressSite) {
        try {
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/types`

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to get post types: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }

            const data = await response.json();

            const list = Object.values(data).map((postType: any, i: number) => {
                return (i + 1) + '. ' + postType.name + ' (slug: ' + postType.slug + ')';
            })

            return {
                postTypes: data,
                postTypesList: list,
                content: [{
                    type: "text",
                    text: `Available post types:\n${JSON.stringify(data)}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_get_post_types failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_get_post_types failed: Unknown error occurred');
        }
    }
};