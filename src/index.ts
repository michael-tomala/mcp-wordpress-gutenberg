// src/index.ts
import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs/promises';
import {validateAndGetSite, validateToolArguments, WPSitesConfig} from './helpers.js';
import {scaffoldPluginTool} from './tools/scaffold-plugin.js';
import {scaffoldBlockTool} from './tools/scaffold-block.js';
import {BuildBlockArgs, buildBlockTool} from './tools/build-block.js';
import {editFileTool} from "./tools/edit-file.js";

const tools = [
    scaffoldPluginTool,
    scaffoldBlockTool,
    buildBlockTool,
    editFileTool
];

async function loadSiteConfig(): Promise<WPSitesConfig> {
    const configPath = process.env.WP_SITES_PATH;
    if (!configPath) {
        throw new Error("WP_SITES_PATH environment variable is required");
    }

    try {
        const configData = await fs.readFile(configPath, 'utf8');
        return JSON.parse(configData) as WPSitesConfig;
    } catch (error) {
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
            capabilities: {tools: {}}
        });

        server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }))
        }));

        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const {name, arguments: rawArgs} = request.params;

            validateToolArguments(rawArgs);
            const args = rawArgs;

            const [siteKey, site] = await validateAndGetSite(config, args.site);

            const tool = tools.find(t => t.name === name);
            if (!tool) {
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }

            if (tool.name === "wp_build_block") {
                return await buildBlockTool.execute({
                    ...args,
                    site,
                    directory: args.directory || `${site.path}/wp-content/plugins`
                } as BuildBlockArgs);
            }

            // @ts-ignore
            return await tool.execute({
                ...args,
                site,
                directory: args.directory || `${site.path}/wp-content/plugins`
            });
        });

        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error(`WordPress MCP server started with ${Object.keys(config.sites).length} site(s) configured`);
    } catch (error) {
        console.error(`Server failed to start: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

main();