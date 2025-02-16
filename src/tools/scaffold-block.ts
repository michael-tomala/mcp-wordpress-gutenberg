// src/tools/scaffold-block.ts
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from 'child_process';

export const scaffoldBlockTool = {
    name: "wp_scaffold_block",
    description: "Creates a new Gutenberg block using @wordpress/create-block",
    inputSchema: {
        type: "object",
        properties: {
            site: { type: "string", description: "Site alias from configuration" },
            name: { type: "string", description: "Block name" },
            directory: { type: "string", description: "Optional: Custom directory path" }
        },
        required: ["name"]
    },
    execute: async (args: { name: string; directory: string }) => {
        try {
            // Uproszczona komenda bez --no-interactive
            const command = `npx @wordpress/create-block ${args.name} --directory="${args.directory}"`;

            console.error(`Executing command: ${command}`);

            const output = execSync(command, {
                stdio: ['pipe', 'pipe', 'pipe'],
                encoding: 'utf-8'
            });

            return {
                content: [{
                    type: "text",
                    text: `Block "${args.name}" created successfully in ${args.directory}\n\nOutput:\n${output}`
                }]
            };
        } catch (error) {
            console.error('Block scaffolding error:', error);
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `Failed to create block: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'Unknown error occurred while creating block');
        }
    }
};