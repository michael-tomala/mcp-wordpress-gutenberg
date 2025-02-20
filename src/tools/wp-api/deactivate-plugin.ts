import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {apiGetPlugins} from "tools/wp-api/get-plugins";

export const apiDeactivatePlugin = {
    name: "wp_api_deactivate_plugin",
    description: "Deactivates a WordPress plugin using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            pluginSlug: {type: "string", description: "Plugin slug to deactivate"}
        },
        required: ["pluginSlug", "siteKey"]
    },

    async execute(args: { siteKey: string; pluginSlug: string }, site: WordPressSite) {
        try {
            const pluginSlug = args.pluginSlug.replace('.php', '')

            const allPlugins = await apiGetPlugins.execute({...args, status: 'active'}, site)
            if (!allPlugins.plugins.find((p: any) => p.plugin === pluginSlug)) {
                return {
                    isError: true,
                    content: [{
                        type: "text",
                        text: `Plugin ${args.pluginSlug} is not active or invalid. Active plugins:\n${allPlugins.pluginsList.join('\n')}. Please try again with a correct plugin slug.`
                    }]
                };
            }

            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/plugins/${pluginSlug}`

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'inactive'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to deactivate plugin: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }

            const data = await response.json();

            return {
                pluginData: data,
                content: [{
                    type: "text",
                    text: `Plugin ${args.pluginSlug} deactivated successfully.\n\nPlugin: ${data}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_deactivate_plugin failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_deactivate_plugin failed: Unknown error occurred');
        }
    }
};
