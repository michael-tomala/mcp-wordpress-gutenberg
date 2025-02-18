import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {apiGetPlugins} from "tools/wp-api/get-plugins";

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

            const allPlugins = await apiGetPlugins.execute({...args, status: 'all'}, site)
            if (!allPlugins.plugins.find((p: any) => p.plugin === pluginSlug)) {
                return {
                    isError: true,
                    content: [{
                        type: "text",
                        text: `Plugin ${args.pluginSlug} is invalid. Available plugins:\n\n${allPlugins.pluginsList.join('\n')}. Please try again with correct plugin slug.`
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