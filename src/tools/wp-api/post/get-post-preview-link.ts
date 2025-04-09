import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {apiGetPost} from "tools/wp-api/get-post";

export const apiGetPostPreviewLink = {
    name: "wp_api_get_post_preview_link",
    description: "Retrieve a preview link for single post, page, or custom post type item using REST API. Especially for draft status.",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            postType: {type: "string", description: "Post type (default: posts)"},
            postId: {type: "integer", description: "Post ID to retrieve"},
        },
        required: ["siteKey", "postType", "postId"]
    },

    async execute(args: { siteKey: string, postType: string, postId: number }, site: WordPressSite) {
        try {

            const {post} = await apiGetPost.execute(args, site)

            const postPreviewUrl = `${post?.guid?.rendered}&preview=true`;

            return {
                post: post,
                previewLink: postPreviewUrl,
                content: [{
                    type: "text",
                    text: `Post preview link retrieved successfully. Remember it is only for logged in user with proper permissions.\nURL: ${postPreviewUrl}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_get_post_preview_link failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_get_post_preview_link failed: Unknown error occurred');
        }
    }
};
