// src/tools/scaffold-block.ts
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from 'child_process';
import path from "path";
import fs from 'fs';
import { listPluginFiles } from "./list-plugin-files.js";
export const scaffoldBlockTool = {
    name: "wp_scaffold_block",
    description: "Creates and builds a new Gutenberg block using @wordpress/create-block",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: { type: "string", description: "Site key" },
            name: { type: "string", description: "Block name" }
        },
        required: ["name", "siteKey"]
    },
    execute: async (args, site) => {
        if (typeof args.name !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'Block name must be a string');
        }
        const blockDir = path.join(site.pluginsPath, args.name.toLowerCase().replace(/ /g, '-'));
        const pluginDir = site.pluginsPath;
        if (fs.existsSync(blockDir)) {
            throw new McpError(ErrorCode.InvalidRequest, `wp_scaffold_block failed: directory ${blockDir} already exists. Please change a block name or remove existing plugin!`);
        }
        try {
            execSync(`cd "${pluginDir}" && npx @wordpress/create-block ${args.name}`, {
                stdio: ['pipe', 'pipe', 'pipe'],
                encoding: 'utf-8'
            });
            // const buildResult = await buildBlockTool.execute({
            //     name: args.name,
            //     directory: blockDir,
            //     site
            // });
            const listedPluginFiles = await listPluginFiles.execute({
                pluginDirName: path.basename(blockDir)
            }, site);
            return {
                content: [{
                        type: "text",
                        text: `Block "${args.name}" created and built successfully.\n\n${listedPluginFiles.content[0].text}`
                    }]
            };
        }
        catch (error) {
            console.error('Block scaffolding error:', error);
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `Failed to create/build block: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'Unknown error occurred while creating/building block');
        }
    }
};
