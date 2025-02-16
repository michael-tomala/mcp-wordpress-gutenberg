// src/types/mcp.ts
export interface MCPServerConfig {
    name: string;
    version: string;
}

export interface MCPRequest {
    command: string;
    params: any;
}

export interface MCPResponse {
    success: boolean;
    data?: any;
    error?: string;
}

export interface MCPContext {
    execute(command: string, params: any): Promise<MCPResponse>;
}

export class MCPServer {
    private config: MCPServerConfig;
    private handlers: Map<string, (request: MCPRequest) => Promise<any>> = new Map();

    constructor(config: MCPServerConfig) {
        this.config = config;
    }

    handle(command: string, handler: (request: MCPRequest) => Promise<any>): void {
        this.handlers.set(command, handler);
    }

    async executeCommand(request: MCPRequest): Promise<MCPResponse> {
        const handler = this.handlers.get(request.command);
        if (!handler) {
            return {
                success: false,
                error: `Unknown command: ${request.command}`
            };
        }

        try {
            const result = await handler(request);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    start(): void {
        console.log(`Starting MCP Server ${this.config.name} v${this.config.version}`);
    }
}