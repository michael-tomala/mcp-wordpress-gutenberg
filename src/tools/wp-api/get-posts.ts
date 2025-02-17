import { WordPressSite } from "types/wp-sites";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

export const apiGetPosts = {
    name: "wp_api_get_posts",
    description: "Retrieve a list of posts, pages, or custom post type items using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: { type: "string", description: "Site key" },
            postType: { type: "string", description: "Post type (default: posts)" },
            perPage: { type: "integer", description: "Number of posts to retrieve (default: 10)" },
            page: { type: "integer", description: "Page number for pagination (default: 1)" }
        },
        required: ["siteKey", "postType"]
    },

    async execute(args: { siteKey: string, postType: string, perPage?: number, page?: number }, site: WordPressSite) {
        try {
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/${args.postType}?per_page=${args.perPage || 10}&page=${args.page || 1}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to retrieve posts: ${errorData.message || response.statusText}.
Requested URL: ${url}`);
            }

            const data = await response.json();
            return {
                pluginData: data,
                content: [{
                    type: "text",
                    text: `Posts retrieved successfully.\n\nPosts: ${JSON.stringify(data)}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_get_posts failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_get_posts failed: Unknown error occurred');
        }
    }
};
