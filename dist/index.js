// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs/promises';
import { validateAndGetSite, validateSiteToolArguments } from './helpers.js';
import { scaffoldBlockTool } from './tools/scaffold-block.js';
import { listPluginFiles } from "./tools/list-plugin-files.js";
import { listAvailablePluginsInSitePluginsPath } from "./tools/list-available-plugins-in-site-plugins-path.js";
import { buildBlock } from "./tools/build-block.js";
import { editBlockFile } from "./tools/edit-block-file.js";
import { apiActivatePlugin } from "./tools/wp-api/activate-plugin.js";
import { apiCreatePost } from "./tools/wp-api/create-post.js";
import { apiUpdatePostStatus } from "./tools/wp-api/update-post-status.js";
import { apiGetPosts } from "./tools/wp-api/get-posts.js";
import { apiGetPostTypes } from "./tools/wp-api/get-post-types.js";
import { apiGetPlugins } from "./tools/wp-api/get-plugins.js";
const tools = [
    editBlockFile,
    scaffoldBlockTool,
    listPluginFiles,
    listAvailablePluginsInSitePluginsPath,
    buildBlock,
    apiActivatePlugin,
    apiCreatePost,
    apiUpdatePostStatus,
    apiGetPosts,
    apiGetPostTypes,
    apiGetPlugins
];
async function loadSiteConfig() {
    const configPath = process.env.WP_SITES_PATH;
    if (!configPath) {
        throw new Error("WP_SITES_PATH environment variable is required");
    }
    try {
        const configData = await fs.readFile(configPath, 'utf8');
        return JSON.parse(configData);
    }
    catch (error) {
        if (error instanceof Error) {
            if ('code' in error && error.code === 'ENOENT') {
                throw new Error(`Config file not found at: ${configPath}`);
            }
            throw new Error(`Failed to load config: ${error.message}`);
        }
        throw new Error('An unknown error occurred while loading config');
    }
}
async function main() {
    try {
        const config = await loadSiteConfig();
        const server = new Server({
            name: "wordpress-mcp",
            version: "1.0.0"
        }, {
            capabilities: { tools: {} }
        });
        server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }))
        }));
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: rawArgs } = request.params;
            validateSiteToolArguments(rawArgs);
            const { siteKey } = rawArgs;
            const site = await validateAndGetSite(config, siteKey);
            const tool = tools.find(t => t.name === name);
            if (!tool) {
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
            // @ts-ignore
            return await tool.execute({
                ...rawArgs,
                siteKey
            }, site);
        });
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error(`WordPress MCP server started with ${Object.keys(config.sites).length} site(s) configured`);
    }
    catch (error) {
        console.error(`Server failed to start: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
main();
