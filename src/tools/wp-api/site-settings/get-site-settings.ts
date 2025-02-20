import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";

export const apiGetSiteSettings = {
    name: "wp_api_get_site_settings",
    description: "Retrieves all WordPress site settings using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
        },
        required: ["siteKey"]
    },
    async execute(args: any, site: WordPressSite) {
        try {
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/settings`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to retrieve site settings: ${errorData.message || response.statusText}`);
            }

            const settings = await response.json();
            return {
                settings,
                content: [{
                    type: "text",
                    text: `Site settings retrieved successfully.\n\nSettings: ${JSON.stringify(settings, null, 2)}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_get_site_settings failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_get_site_settings failed: Unknown error occurred');
        }
    }
};
