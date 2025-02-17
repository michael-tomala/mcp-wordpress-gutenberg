import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { apiGetRestBaseForPostType } from "./get-rest-base-for-post-types.js";
export const apiUpdatePostContent = {
    name: "wp_api_update_post_content",
    description: "Update the content of a WordPress post with post type using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: { type: "string", description: "Site key" },
            postId: { type: "number", description: "Post ID to update" },
            postType: { type: "string", description: "Type of the post (e.g., posts, pages)" },
            content: { type: "string", description: "Optional: New content for the post (only if content changed)" },
            readCurrentContent: {
                type: "boolean",
                description: "Determine, you need a current version of post content to update context or just update content."
            },
        },
        required: ["siteKey", "postId", "postType", "readCurrentContent"]
    },
    async execute(args, site) {
        try {
            if (args.readCurrentContent) {
                return {
                    isError: true,
                    content: [{
                            type: "text",
                            text: `Please generate a new post content from current version:\n\n${""}`
                        }]
                };
            }
            const { restBase } = await apiGetRestBaseForPostType.execute(args, site);
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/${restBase}/${args.postId}`;
            const bodyData = {
                content: args.content
            };
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to update post content: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }
            const updatedPost = await response.json();
            return {
                updatedPost,
                content: [{
                        type: "text",
                        text: `Post content updated successfully! Preview URL: ${updatedPost.link}.`
                    }]
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_update_post_content failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_update_post_content failed: Unknown error occurred');
        }
    }
};
