// src/tools/scaffold-block.ts
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from 'child_process';
import { buildBlockTool } from './build-block.js';
import {isGutenbergBlock} from "../helpers.js";

interface ScaffoldArgs {
    name: string;
    directory: string;
    site: {
        path: string;
    };
}

export const scaffoldBlockTool = {
    name: "wp_scaffold_block",
    description: "Creates and builds a new Gutenberg block using @wordpress/create-block",
    inputSchema: {
        type: "object",
        properties: {
            site: { type: "string", description: "Site alias from configuration" },
            name: { type: "string", description: "Block name" },
            directory: { type: "string", description: "Optional: Custom directory path" }
        },
        required: ["name"]
    },
    execute: async (args: ScaffoldArgs) => {

        const blockDir = args.directory + '/' + args.name.toLowerCase().replace(/ /g, '-')
        const pluginDir = args.directory

        if( !isGutenbergBlock(blockDir) ) {
            throw new Error(`wp_build_block failed: directory ${blockDir} already contain a Gutenberg block. Are you sure ${blockDir} is valid? Do you want to build block instead? Or remove old block and create a new one?`);
        }

        try {
            console.error(`Creating block: ${args.name} in ${pluginDir}`);

            // Tworzenie bloku
            const command = `cd "${pluginDir}" && npx @wordpress/create-block ${args.name}`;
            const scaffoldOutput = execSync(command, {
                stdio: ['pipe', 'pipe', 'pipe'],
                encoding: 'utf-8'
            });

            console.error('Block created, starting build...');

            // Automatyczne wywołanie build z przekazaniem site
            const buildResult = await buildBlockTool.execute({
                name: args.name,
                directory: blockDir,
                site: args.site
            });

            return {
                content: [{
                    type: "text",
                    text: `Block "${args.name}" created and built successfully\n\nScaffold output:\n${scaffoldOutput}\n\nBuild output:\n${buildResult.content[0].text}`
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