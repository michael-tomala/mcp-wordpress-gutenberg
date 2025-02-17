import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { apiGetPostTypes } from "./get-post-types.js";
export const apiGetRestBaseForPostType = {
    name: "wp_api_get_rest_base_for_post_type",
    description: "Get a WordPress REST API base for post type to use in REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: { type: "string", description: "Site key" },
            postType: { type: "string", description: "Post type (default: page)" },
        },
        required: ["siteKey", "postType"]
    },
    async execute(args, site) {
        try {
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/types/${args.postType}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                const { postTypesList } = await apiGetPostTypes.execute(args, site);
                throw new Error(`Failed to get post types: ${errorData.message || response.statusText}.\nRequested URL: ${url}. Please try again with one of the following post type:\n${postTypesList.join('\n')}`);
            }
            const data = await response.json();
            return {
                postType: data,
                restBase: data.rest_base,
                content: [{
                        type: "text",
                        text: `API REST base for post type: ${args.postType} is a: \n${data.rest_base}`
                    }]
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_get_rest_base_for_post_types failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_get_rest_base_for_post_types failed: Unknown error occurred');
        }
    }
};
