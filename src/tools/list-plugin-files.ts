// src/tools/edit-file.ts
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs';
import path from 'path';
import {WordPressSite} from "../types/wp-sites";
import {listAvailablePluginsInSitePluginsPath} from "./list-available-plugins-in-site-plugins-path.js";


const listFiles = (dir: any, fileList: any[] = []) => {
    if (path.basename(dir) === 'node_modules') {
        return fileList; // Pomijamy katalog node_modules
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            listFiles(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    }
    return fileList;
}


export const listPluginFiles = {
    name: "wp_list_plugin_files",
    description: "List a files for a specified plugin directory",
    inputSchema: {
        type: "object",
        properties: {
            pluginDirName: {type: "string", description: "Plugin directory name"}
        },
        required: ["pluginDirName"]
    },

    async execute(args: { pluginDirName: string }, site: WordPressSite) {

        if (args.pluginDirName === '.' || args.pluginDirName === '') {
            throw new McpError(ErrorCode.InvalidParams, 'pluginDirName cannot be "." or empty (self directory).');
        }

        const blockDir = path.join(site.pluginsPath, args.pluginDirName)

        if (!fs.existsSync(blockDir)) {
            const {content: [{directories}]} = await listAvailablePluginsInSitePluginsPath.execute({}, site)
            return {
                content: [{
                    type: "text",
                    text: `Directory ${blockDir} not exists. Please review a plugin directory. Available plugins in ${site.pluginsPath}:\n\n${directories.join('\n')}`,
                    directories
                }]
            };
        }

        try {

            const files = listFiles(blockDir)

            return {
                content: [{
                    type: "text",
                    text: `Files at ${blockDir}:\n\n` + files.join('\n'),
                    files
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, error.message);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_list_plugin_files: Unknown error occurred');
        }
    }
};