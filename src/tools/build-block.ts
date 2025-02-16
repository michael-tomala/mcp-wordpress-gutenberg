// src/tools/build-block.ts
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from 'child_process';
import path from 'path';

interface BuildBlockArgs {
    name: string;
    directory: string;
    site: {
        path: string;
    };
}

export const buildBlockTool = {
    name: "wp_build_block",
    description: "Builds a Gutenberg block using npm run build",
    inputSchema: {
        type: "object",
        properties: {
            site: {
                type: "string",
                description: "Site alias from configuration"
            },
            name: {
                type: "string",
                description: "Block name"
            },
            directory: {
                type: "string",
                description: "Block directory path"
            }
        },
        required: ["name", "directory"]
    },

    execute: async (args: BuildBlockArgs) => {
        try {
            const blockDir = args.directory;

            // Instalacja zależności - ukrywamy szczegółowe logi
            console.error(`Installing dependencies for ${args.name}...`);
            try {
                execSync('/usr/local/bin/npm install --no-audit --no-fund --silent', {
                    cwd: blockDir,
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: '/bin/bash'
                });
            } catch (error) {
                throw new Error(`npm install failed: ${error instanceof Error ? error.message : String(error)}`);
            }

            // Build - przechwytujemy output
            console.error(`Building ${args.name}...`);
            try {
                const buildOutput = execSync('/usr/local/bin/npm run build', {
                    cwd: blockDir,
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: '/bin/bash',
                    encoding: 'utf-8'
                });

                // Filtrujemy i formatujemy output builda
                const relevantOutput = buildOutput
                    .split('\n')
                    .filter(line =>
                        line.includes('webpack') ||
                        line.includes('compiled') ||
                        line.includes('error') ||
                        line.includes('warning')
                    )
                    .join('\n');

                return {
                    content: [{
                        type: "text",
                        text: `✅ Block "${args.name}" built successfully!\n\nBuild summary:\n${relevantOutput}`
                    }]
                };
            } catch (error) {
                const errorOutput = error instanceof Error ? error.message : String(error);
                const formattedError = errorOutput
                    .split('\n')
                    .filter(line =>
                        line.includes('error') ||
                        line.includes('failed') ||
                        line.includes('webpack')
                    )
                    .join('\n');

                throw new Error(`Build failed:\n${formattedError}`);
            }
        } catch (error) {
            console.error('Build error:', error);
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, error.message);
            }
            throw new McpError(ErrorCode.InternalError, 'Unknown error occurred during build');
        }
    }
};