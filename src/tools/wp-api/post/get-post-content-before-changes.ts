import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {apiGetPost} from "tools/wp-api/get-post";

export const apiGetPostContentBeforeChanges = {
    name: "wp_api_get_post_content_before_changes",
    description: "Retrieve a single post, page, or custom post type CONTENT using REST API. Run it always before doing changes in content.",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            postType: {type: "string", description: "Post type (default: posts)"},
            postId: {type: "integer", description: "Post ID to retrieve"}, // New property to specify post ID
        },
        required: ["siteKey", "postType", "postId"]
    },

    async execute(args: { siteKey: string, postType: string, postId: number }, site: WordPressSite) {
        try {

            const {post} = await apiGetPost.execute(args, site)

            return {
                post,
                content: [{
                    type: "text",
                    text: `Post retrieved successfully.\n\nCurrent ${args.postType} #${args.postId} content is:\n\n${post.content.raw}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_get_post_content_before_changes failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_get_post_content_before_changes failed: Unknown error occurred');
        }
    }
};
