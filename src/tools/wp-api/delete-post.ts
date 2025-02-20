import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {apiGetRestBaseForPostType} from "tools/wp-api/get-rest-base-for-post-types";

export const apiDeletePost = {
    name: "wp_api_delete_post",
    description: "Deletes a WordPress post, page, or any custom post type using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            postId: {type: "integer", description: "ID of the post to delete"},
            postType: {type: "string", description: "Type of the post (e.g., post, page, custom type)"},
            force: {type: "boolean", description: "Whether to force delete the post"}
        },
        required: ["siteKey", "postId", "postType"]
    },

    async execute(args: { siteKey: string; postId: number; postType: string; force?: boolean }, site: WordPressSite) {
        try {

            const {restBase} = await apiGetRestBaseForPostType.execute(args, site)

            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/${restBase}/${args.postId}?force=${args.force ?? false}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to delete post: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }

            const data = await response.json();

            return {
                postData: data,
                content: [{
                    type: "text",
                    text: `Post ${args.postId} (${args.postType}) deleted successfully.`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_delete_post failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_delete_post failed: Unknown error occurred');
        }
    }
};
