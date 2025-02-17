import { WordPressSite } from "types/wp-sites";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

export const apiGetPlugins = {
    name: "wp_api_get_plugins",
    description: "Get WordPress plugins (active, inactive, or all) using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: { type: "string", description: "Site key" },
            status: {
                type: "string",
                enum: ["active", "inactive", "all"],
                description: "Filter plugins by status. Default is 'active'."
            },
        },
        required: ["siteKey"],
        additionalProperties: false
    },

    async execute(args: { siteKey: string, status?: string }, site: WordPressSite) {
        try {
            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/plugins`;

            // Status wtyczek domyślnie to "active", chyba że użytkownik określi inaczej
            const filterStatus = args.status || "active";

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to get plugins: ${errorData.message || response.statusText}.\nRequested URL: ${url}`);
            }

            const data = await response.json();

            // Filtrujemy wtyczki zgodnie z wybranym statusem
            let filteredPlugins = data;
            if (filterStatus !== "all") {
                filteredPlugins = data.filter((plugin: { status: string }) => plugin.status === filterStatus);
            }

            return {
                plugins: filteredPlugins,
                content: [{
                    type: "text",
                    text: `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} plugins:\n${filteredPlugins.map((plugin: any) => plugin.name).join(', ')}`
                }]
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_get_plugins failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_get_plugins failed: Unknown error occurred');
        }
    }
};
