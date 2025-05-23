import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {apiGetRestBaseForPostType} from "./get-rest-base-for-post-types.js";

export const apiUpdatePostStatus = {
    name: "wp_api_update_post_status",
    description: "Update the status of an existing WordPress post, page, or custom post type item using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            postId: {type: "integer", description: "ID of the post to update"},
            postType: {type: "string", description: "Post type (default: posts)"},
            status: {type: "string", enum: ["publish", "draft"], description: "Status to set (publish or draft)"},
            publishDate: {
                type: "string",
                format: "date-time",
                description: "Optional scheduled publication date in ISO 8601 format"
            }
        },
        required: ["siteKey", "postId", "postType", "status"]
    },

    async execute(args: {
        siteKey: string,
        postId: number,
        postType: string,
        status: string,
        publishDate?: string
    }, site: WordPressSite) {
        try {
            const {restBase} = await apiGetRestBaseForPostType.execute(args, site)

            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/${restBase}/${args.postId}`;

            const bodyData: any = {status: args.status};
            if (args.status === "publish" && args.publishDate) {
                bodyData.date = args.publishDate;
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
                throw new Error(`Failed to update post status: ${errorData.message || response.statusText}.
Requested URL: ${url}`);
            }

            const data = await response.json();
            return {
                pluginData: data,
                content: [{
                    type: "text",
                    text: `Post status updated successfully.\nPost #ID: ${data.id}\nPost URL: ${data.link}\nPost status: ${data.status}\nPost type: ${data.type}\nPost title: ${data.title?.rendered}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_update_post_status failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_update_post_status failed: Unknown error occurred');
        }
    }
};
