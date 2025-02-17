import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { apiGetRestBaseForPostType } from "./get-rest-base-for-post-types.js";
export const apiGetPost = {
    name: "wp_api_get_post",
    description: "Retrieve a single post, page, or custom post type item using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: { type: "string", description: "Site key" },
            postType: { type: "string", description: "Post type (default: posts)" },
            postId: { type: "integer", description: "Post ID to retrieve" }, // New property to specify post ID
        },
        required: ["siteKey", "postType", "postId"]
    },
    async execute(args, site) {
        try {
            const { restBase } = await apiGetRestBaseForPostType.execute(args, site);
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/${restBase}/${args.postId}`; // Modified URL to fetch single post by ID
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to retrieve post: ${errorData.message || response.statusText}. Requested URL: ${url}`);
            }
            const data = await response.json();
            return {
                post: data,
                content: [{
                        type: "text",
                        text: `Post retrieved successfully.\n\nPost: ${JSON.stringify(data)}`
                    }]
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_get_post failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_get_post failed: Unknown error occurred');
        }
    }
};
