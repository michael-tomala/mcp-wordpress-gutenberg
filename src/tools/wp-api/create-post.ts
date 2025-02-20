import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {apiGetPostTypes} from "./get-post-types.js";
import {apiGetRestBaseForPostType} from "./get-rest-base-for-post-types.js";
import {apiGetTemplates} from "./get-templates.js";

export const apiCreatePost = {
    name: "wp_api_create_post",
    description: "Create a WordPress post, page or custom post type item using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            postType: {type: "string", description: "Post type (default: pages)"},
            title: {type: "string", description: "Post title"},
            content: {type: "string", description: "Post content"},
            parent: {type: "integer", description: "Post parent ID"},
            template: {type: "string", description: "Optional: Post template"},
        },
        required: ["postType", "siteKey", "title"]
    },

    async execute(args: {
        siteKey: string,
        postType: string,
        title: string,
        content: string,
        parent: Number,
        template?: string
    }, site: WordPressSite) {
        try {

            const {restBase} = await apiGetRestBaseForPostType.execute(args, site)


            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/${restBase}`

            const bodyData: any = {
                title: args.title,
                status: 'draft',
                content: args.content,
                parent: args.parent,
            }

            if (args.template) {
                const {templates, templatesList} = await apiGetTemplates.execute(args, site)
                if (!templates.find((template: any) => template.slug === args.template)) {
                    throw new Error(`Invalid template.\nUse one of the following:\n${templatesList.join('\n')}`);
                }
                bodyData.template = args.template
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

                if (errorData.message.includes('No route was found matching the URL and request method')) {
                    const postTypes = await apiGetPostTypes.execute({
                        siteKey: args.siteKey
                    }, site)

                    return {
                        isError: true,
                        content: [
                            {
                                type: "text",
                                text: `Probably ${args.postType} is invalid.\nUsed REST API URL: ${url}.\nPlease select a proper post type from a list: ${Object.keys(postTypes.postTypes).join(', ')}.`
                            }
                        ]
                    }
                }
                throw new Error(`Failed to create post: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }

            const data = await response.json();

            return {
                pluginData: data,
                content: [{
                    type: "text",
                    text: `Post created successfully.\n\nPost: ${JSON.stringify(data, null, 2)}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_create_post failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_create_post failed: Unknown error occurred');
        }
    }
};