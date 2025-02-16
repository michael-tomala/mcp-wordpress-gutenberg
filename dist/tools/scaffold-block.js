// src/tools/scaffold-block.ts
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from 'child_process';
import { buildBlockTool } from './build-block.js';
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
    execute: async (args) => {
        try {
            console.error(`Creating block: ${args.name} in ${args.directory}`);
            // Tworzenie bloku
            const command = `cd "${args.directory}" && npx @wordpress/create-block ${args.name}`;
            const scaffoldOutput = execSync(command, {
                stdio: ['pipe', 'pipe', 'pipe'],
                encoding: 'utf-8'
            });
            console.error('Block created, starting build...');
            // Automatyczne wywołanie build z przekazaniem site
            const buildResult = await buildBlockTool.execute({
                name: args.name,
                directory: args.directory,
                site: args.site
            });
            return {
                content: [{
                        type: "text",
                        text: `Block "${args.name}" created and built successfully\n\nScaffold output:\n${scaffoldOutput}\n\nBuild output:\n${buildResult.content[0].text}`
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
