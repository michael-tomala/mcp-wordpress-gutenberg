// src/tools/build-block.ts
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from 'child_process';
import { isGutenbergBlock } from "../helpers.js";
import path from "path";
export const buildBlock = {
    name: "wp_build_block",
    description: "Builds a Gutenberg block using npm run build",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: { type: "string", description: "Site key" },
            blockPluginDirname: {
                type: "string",
                description: "Block plugin directory name."
            }
        },
        required: ["blockPluginDirname", "siteKey"]
    },
    execute: async (args, site) => {
        const blockDir = path.join(site.pluginsPath, args.blockPluginDirname);
        if (!(await isGutenbergBlock(blockDir))) {
            throw new Error(`wp_build_block failed: directory ${blockDir} does not contain a Gutenberg block. Are you sure ${blockDir} is valid?`);
        }
        try {
            try {
                execSync('npm install --no-audit --no-fund --silent', {
                    cwd: blockDir,
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: '/bin/bash'
                });
            }
            catch (error) {
                throw new Error(`wp_build_block: npm install failed with error - ${error instanceof Error ? error.message : String(error)} in ${blockDir}`);
            }
            try {
                const buildOutput = execSync('npm run build', {
                    cwd: blockDir,
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: '/bin/bash',
                    encoding: 'utf-8'
                });
                const relevantOutput = buildOutput
                    .split('\n')
                    .filter(line => line.includes('webpack') ||
                    line.includes('compiled') ||
                    line.includes('error') ||
                    line.includes('warning'))
                    .join('\n');
                return {
                    content: [{
                            type: "text",
                            text: `✅ Block "${args.blockPluginDirname}" built successfully!\n\nBuild summary:\n${relevantOutput}`
                        }]
                };
            }
            catch (error) {
                const errorOutput = error instanceof Error ? error.message : String(error);
                const formattedError = errorOutput
                    .split('\n')
                    .filter(line => line.includes('error') ||
                    line.includes('failed') ||
                    line.includes('webpack'))
                    .join('\n');
                throw new Error(`wp_build_block failed:\n${formattedError}\n\nTry to fix a problem, but do not create a new structure on your own.`);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, error.message);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_build_block failed: Unknown error occurred');
        }
    }
};
