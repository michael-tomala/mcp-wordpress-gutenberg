import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { apiGetPostTypes } from "./get-post-types.js";
export const apiCreatePost = {
    name: "wp_api_create_post",
    description: "Create a WordPress post, page or custom post type item using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: { type: "string", description: "Site key" },
            postType: { type: "string", description: "Post type (default: pages)" },
            title: { type: "string", description: "Post title" },
            content: { type: "string", description: "Post content" },
            parent: { type: "integer", description: "Post parent ID" },
        },
        required: ["postType", "siteKey", "title"]
    },
    async execute(args, site) {
        try {
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/${args.postType}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: args.title,
                    status: 'draft',
                    content: args.content,
                    parent: args.parent
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.message.includes('No route was found matching the URL and request method')) {
                    const postTypes = await apiGetPostTypes.execute({
                        siteKey: args.siteKey
                    }, site);
                    return {
                        isError: true,
                        content: [
                            {
                                type: "text",
                                text: `It is probably invalid post type.\nUsed REST API URL: ${url}.\nPlease select a proper post type: ${JSON.stringify(postTypes.postTypes)}.`
                            }
                        ]
                    };
                }
                throw new Error(`Failed to create post: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }
            const data = await response.json();
            return {
                pluginData: data,
                content: [{
                        type: "text",
                        text: `Post created successfully.\n\nPost: ${JSON.stringify(data)}`
                    }]
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_create_post failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_create_post failed: Unknown error occurred');
        }
    }
};
