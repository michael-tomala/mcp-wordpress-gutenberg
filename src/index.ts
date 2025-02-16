// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ErrorCode, McpError, ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from 'child_process';
import fs from 'fs/promises';

// Definicje typów
interface WordPressSite {
    name: string;
    path: string;
    apiUrl: string;
    apiCredentials?: {
        username: string;
        password: string;
    };
}

interface WPSitesConfig {
    sites: {
        [key: string]: WordPressSite;
    };
}

interface ToolArguments {
    site: string;
    name: string;
    directory?: string;
    [key: string]: unknown;
}

// Funkcje pomocnicze
function validateToolArguments(args: unknown): asserts args is ToolArguments {
    if (!args || typeof args !== 'object') {
        throw new McpError(ErrorCode.InvalidParams, 'Arguments must be an object');
    }

    const typedArgs = args as Record<string, unknown>;

    if (typeof typedArgs.site !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, 'site must be a string');
    }

    if (typeof typedArgs.name !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, 'name must be a string');
    }

    if (typedArgs.directory !== undefined && typeof typedArgs.directory !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, 'directory must be a string or undefined');
    }
}

async function loadSiteConfig(): Promise<WPSitesConfig> {
    const configPath = process.env.WP_SITES_PATH;
    if (!configPath) {
        throw new Error("WP_SITES_PATH environment variable is required");
    }

    try {
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData) as WPSitesConfig;
        return config;
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
        // Ładowanie konfiguracji
        const config = await loadSiteConfig();

        // Inicjalizacja serwera
        const server = new Server({
            name: "wordpress-mcp",
            version: "1.0.0"
        }, {
            capabilities: { tools: {} }
        });

        // Definicje dostępnych narzędzi
        server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [{
                name: "wp_scaffold_plugin",
                description: "Creates a new WordPress plugin using @wordpress/create-plugin",
                inputSchema: {
                    type: "object",
                    properties: {
                        site: { type: "string", description: "Site alias from configuration" },
                        name: { type: "string", description: "Plugin name" },
                        directory: { type: "string", description: "Optional: Custom directory path" }
                    },
                    required: ["site", "name"]
                }
            }, {
                name: "wp_scaffold_block",
                description: "Creates a new Gutenberg block using @wordpress/create-block",
                inputSchema: {
                    type: "object",
                    properties: {
                        site: { type: "string", description: "Site alias from configuration" },
                        name: { type: "string", description: "Plugin name" },
                        directory: { type: "string", description: "Optional: Custom directory path" }
                    },
                    required: ["site", "name"]
                }
            }]
        }));

        // Obsługa wywołań narzędzi
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: rawArgs } = request.params;

            // Walidacja argumentów
            validateToolArguments(rawArgs);
            const args = rawArgs;

            const site = config.sites[args.site];
            if (!site) {
                throw new McpError(ErrorCode.InvalidParams, `Unknown site: ${args.site}`);
            }

            switch (name) {
                case "wp_scaffold_plugin": {
                    const targetDir = args.directory || `${site.path}/wp-content/plugins`;
                    try {
                        const command = `npx @wordpress/create-plugin ${args.name} --directory=${targetDir}`;
                        execSync(command, { stdio: 'inherit' });
                        return {
                            content: [{
                                type: "text",
                                text: `Plugin "${args.name}" created successfully in ${targetDir}`
                            }]
                        };
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        throw new McpError(ErrorCode.InternalError, `Failed to create plugin: ${errorMessage}`);
                    }
                }

                case "wp_scaffold_block": {
                    const targetDir = args.directory || `${site.path}/wp-content/plugins`;
                    try {
                        const command = `npx @wordpress/create-block ${args.name} --directory=${targetDir}`;
                        execSync(command, { stdio: 'inherit' });
                        return {
                            content: [{
                                type: "text",
                                text: `Block "${args.name}" created successfully in ${targetDir}`
                            }]
                        };
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        throw new McpError(ErrorCode.InternalError, `Failed to create block: ${errorMessage}`);
                    }
                }

                default:
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
        });

        // Uruchomienie serwera
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error(`WordPress MCP server started with ${Object.keys(config.sites).length} site(s) configured`);
    } catch (error) {
        console.error(`Server failed to start: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

main();