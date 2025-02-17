import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { apiGetRestBaseForPostType } from "./get-rest-base-for-post-types.js";
export const apiUpdatePost = {
    name: "wp_api_update_post",
    description: "Update the settings (i.e. template, title, excerpt) of a WordPress post with post type using REST API. THIS TOOL IS NOT DESIGNED TO UPDATE POST CONTENT.",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: { type: "string", description: "Site key" },
            postId: { type: "number", description: "Post ID to update" },
            postType: { type: "string", description: "Type of the post (e.g., posts, pages)" },
            template: { type: "string", description: "Optional: Post template" },
            title: { type: "string", description: "Optional: Post title" },
        },
        required: ["siteKey", "postId", "postType"]
    },
    async execute(args, site) {
        try {
            const { restBase } = await apiGetRestBaseForPostType.execute(args, site);
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/${restBase}/${args.postId}`;
            const bodyData = {};
            if (args.title) {
                bodyData.title = args.title;
            }
            if (args.template) {
                bodyData.template = args.template;
            }
            // @ts-ignore
            if (args.content) {
                throw new Error(`Failed. To update post content use special tool: wp_api_update_post_content`);
            }
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
                throw new Error(`Failed to update post: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }
            const updatedPost = await response.json();
            return {
                updatedPost,
                content: [{
                        type: "text",
                        text: `Post settings updated successfully! Preview URL: ${updatedPost.link}.`
                    }]
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_update_post failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_update_post failed: Unknown error occurred');
        }
    }
};
