// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ErrorCode, McpError, ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs/promises';
import { validateToolArguments, validateAndGetSite } from './helpers.js';
import { scaffoldPluginTool } from './tools/scaffold-plugin.js';
import { scaffoldBlockTool } from './tools/scaffold-block.js';
const tools = [scaffoldPluginTool, scaffoldBlockTool];
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
        // Load configuration
        const config = await loadSiteConfig();
        // Initialize server
        const server = new Server({
            name: "wordpress-mcp",
            version: "1.0.0"
        }, {
            capabilities: { tools: {} }
        });
        // Register tool definitions
        server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }))
        }));
        // Handle tool calls
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: rawArgs } = request.params;
            validateToolArguments(rawArgs);
            const args = rawArgs;
            // Find and validate site
            const [siteKey, site] = await validateAndGetSite(config, args.site);
            // Find the requested tool
            const tool = tools.find(t => t.name === name);
            if (!tool) {
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
            // Execute the tool with validated arguments
            return await tool.execute({
                ...args,
                directory: args.directory || `${site.path}/wp-content/plugins`
            });
        });
        // Start server
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
