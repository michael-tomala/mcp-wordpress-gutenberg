import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";

export const apiActivatePlugin = {
    name: "wp_api_activate_plugin",
    description: "Activates a WordPress plugin using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            pluginSlug: {type: "string", description: "Plugin slug to activate"}
        },
        required: ["pluginSlug", "siteKey"]
    },

    async execute(args: { siteKey: string; pluginSlug: string }, site: WordPressSite) {
        try {
            const pluginSlug = args.pluginSlug.replace('.php', '')
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/plugins/${pluginSlug}`

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'active'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to activate plugin: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }

            const data = await response.json();


            return {
                pluginData: data,
                content: [{
                    type: "text",
                    text: `Plugin ${args.pluginSlug} activated successfully.\n\nPlugin: ${data}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_activate_plugin failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_activate_plugin failed: Unknown error occurred');
        }
    }
};