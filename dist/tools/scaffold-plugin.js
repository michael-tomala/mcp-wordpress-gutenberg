// src/tools/scaffold-plugin.ts
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from 'child_process';
export const scaffoldPluginTool = {
    name: "wp_scaffold_plugin",
    description: "Creates a new WordPress plugin using wp-cli scaffold plugin",
    inputSchema: {
        type: "object",
        properties: {
            site: { type: "string", description: "Site alias from configuration" },
            name: { type: "string", description: "Plugin name" },
            directory: { type: "string", description: "Optional: Custom directory path" }
        },
        required: ["name"]
    },
    execute: async (args) => {
        try {
            const command = `wp scaffold plugin ${args.name} --dir=${args.directory}`;
            const output = execSync(command, {
                stdio: ['pipe', 'pipe', 'pipe'],
                encoding: 'utf-8'
            });
            return {
                content: [{
                        type: "text",
                        text: `Plugin "${args.name}" created successfully in ${args.directory}\n\nOutput:\n${output}`
                    }]
            };
        }
        catch (error) {
            console.error('Plugin scaffolding error:', error);
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `Failed to create plugin: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'Unknown error occurred while creating plugin');
        }
    }
};
