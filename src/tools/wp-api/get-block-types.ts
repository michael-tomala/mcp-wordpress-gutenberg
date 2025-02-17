import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";

export const apiGetGutenbergBlocks = {
    name: "wp_api_get_gutenberg_blocks",
    description: "Get available Gutenberg blocks for the WordPress site",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"}
        },
        required: ["siteKey"]
    },

    async execute(args: { siteKey: string }, site: WordPressSite) {
        try {
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/block-types`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to get Gutenberg blocks: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }

            const blocks = await response.json();

            return {
                blocks: blocks,
                content: [{
                    type: "text",
                    text: `Available Gutenberg blocks:\n${JSON.stringify(blocks, null, 2)}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_get_gutenberg_blocks failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_get_gutenberg_blocks failed: Unknown error occurred');
        }
    }
};
