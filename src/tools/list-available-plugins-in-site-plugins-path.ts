// src/tools/edit-file.ts
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs';
import {WordPressSite} from "../types/wp-sites";


export const listAvailablePluginsInSitePluginsPath = {
    name: "wp_list_available_plugins_in_site_plugins_path",
    description: "List a plugins directories which is equivalent of listing available plugins for site",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"}
        },
        required: ["siteKey"]
    },

    async execute(args: { siteKey: string }, site: WordPressSite) {

        const pluginsPath = site.pluginsPath

        if (!fs.existsSync(pluginsPath)) {
            throw new Error(`wp_list_available_plugins_in_site_plugins_path failed: directory ${pluginsPath} not exists. Please review a plugin directory and site configuration.`);
        }

        try {
            const files = fs.readdirSync(pluginsPath, {withFileTypes: true});
            const directories = files
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            return {
                content: [{
                    type: "text",
                    text: `Available plugins directories in ${pluginsPath}:\n\n${directories.join('\n')}`,
                    directories
                }]
            };

        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, error.message);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_list_available_plugins_in_site_plugins_path: Unknown error occurred');
        }
    }
};