// src/tools/scaffold-block.ts
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {execSync} from 'child_process';
import path from "path";
import fs from 'fs';
import {WordPressSite} from "../types/wp-sites";
import {listPluginFiles} from "./list-plugin-files.js";
import {buildBlock} from "./build-block.js";

interface ScaffoldArgs {
    name: string;
    siteKey: string;
    variant: string;
    namespace: string;
}

export const scaffoldBlockTool = {
    name: "wp_scaffold_block",
    description: "Creates and builds a new Gutenberg block using @wordpress/create-block",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            name: {type: "string", description: "Block name"},
            variant: {type: "string", description: "Gutenberg block template variant (static or dynamic)"},
            namespace: {type: "string", description: "Gutenberg block namespace"}
        },
        required: ["name", "siteKey", "variant", "namespace"]
    },
    execute: async (args: ScaffoldArgs, site: WordPressSite) => {

        if (typeof args.name !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'Block name must be a string');
        }

        const blockDirname = args.name.toLowerCase().replace(/ /g, '-')
        const namespace = args.namespace.toLowerCase().replace(/ /g, '-')
        const blockDir = path.join(site.pluginsPath, blockDirname)
        const pluginDir = site.pluginsPath

        if (fs.existsSync(blockDir)) {
            throw new McpError(ErrorCode.InvalidRequest, `wp_scaffold_block failed: directory ${blockDir} already exists. Please change a block name or remove existing plugin!`);
        }

        try {

            const variant = args.variant === 'dynamic' ? 'dynamic' : 'static'
            const createBlockCommand = `npx @wordpress/create-block ${args.name} --variant ${variant} --namespace ${namespace}`

            execSync(createBlockCommand, {
                stdio: ['pipe', 'pipe', 'pipe'],
                encoding: 'utf-8',
                cwd: pluginDir
            });

            const buildResult = await buildBlock.execute({
                blockPluginDirname: blockDirname,
                siteKey: args.siteKey
            }, site);

            const listedPluginFiles = await listPluginFiles.execute({
                pluginDirName: path.basename(blockDir),
                siteKey: args.siteKey
            }, site);

            if (listedPluginFiles.isError || !listedPluginFiles?.files) {
                throw new McpError(ErrorCode.InternalError, `wp_scaffold_block failed: directory ${path.basename(blockDir)} is unreachable or files not created.`);
            }

            return {
                content: [{
                    type: "text",
                    text: `Block "${args.name}" created and built successfully.\n\nCreated files: ${listedPluginFiles?.files?.join('\n')}.\n\nDo you want to do any changes in this block or activate WordPress plugin and create a test page in WordPress with this block embedded?`
                }]
            };
        } catch (error) {
            console.error('Block scaffolding error:', error);
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `Failed to create/build block: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'Unknown error occurred while creating/building block');
        }
    }
};