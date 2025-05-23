// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs';
import { validateAndGetSite, validateSiteToolArguments, WPSitesConfig } from './helpers.js';
import { scaffoldBlockTool } from 'tools/scaffold-block.js';
import { listPluginFiles } from "tools/list-plugin-files.js";
import { listAvailablePluginsInSitePluginsPath } from "tools/list-available-plugins-in-site-plugins-path.js";
import { buildBlock } from "tools/build-block.js";
import { editBlockFile } from "tools/filesystem/edit-block-file.js";
import { apiActivatePlugin } from "tools/wp-api/activate-plugin.js";
import { apiCreatePost } from "tools/wp-api/create-post.js";
import { apiUpdatePostStatus } from "tools/wp-api/update-post-status.js";
import { apiGetPosts } from "tools/wp-api/get-posts.js";
import { apiGetPostTypes } from "tools/wp-api/get-post-types.js";
import { apiGetPlugins } from "tools/wp-api/get-plugins.js";
import { apiUpdatePost } from "tools/wp-api/update-post.js";
import { apiGetGutenbergBlocks } from "tools/wp-api/get-block-types.js";
import { apiGetTemplates } from "tools/wp-api/get-templates.js";
import { apiGetRestBaseForPostType } from "tools/wp-api/get-rest-base-for-post-types.js";
import { apiUpdatePostContent } from "tools/wp-api/update-post-content.js";
import { apiGetPost } from "tools/wp-api/get-post.js";
import { cliInstallAndActivatePlugin } from "tools/wp-cli/instal-and-activate-plugin";
import { editBlockJsonFile } from "tools/filesystem/edit-block-json-file";
import { WordPressSite } from "types/wp-sites";
import { apiDeactivatePlugin } from "tools/wp-api/deactivate-plugin";
import { apiDeletePost } from "tools/wp-api/delete-post";
import { apiGetSiteSettings } from "tools/wp-api/site-settings/get-site-settings";
import { apiUpdateStringSiteSetting } from "tools/wp-api/site-settings/update-string-site-setting";
import { apiGetPostPreviewLink } from "tools/wp-api/post/get-post-preview-link";
import { apiUpdateIntegerSiteSetting } from "tools/wp-api/site-settings/update-integer-site-setting";

const tools = [
    editBlockFile,
    scaffoldBlockTool,
    listPluginFiles,
    listAvailablePluginsInSitePluginsPath,
    buildBlock,
    editBlockJsonFile,

    apiActivatePlugin,
    apiDeactivatePlugin,
    apiCreatePost,
    apiDeletePost,
    apiUpdatePostStatus,
    apiGetPosts,
    apiGetPost,
    apiGetPostTypes,
    apiGetPlugins,
    apiUpdatePost,
    apiGetGutenbergBlocks,
    apiGetTemplates,
    apiGetRestBaseForPostType,
    apiUpdatePostContent,
    apiGetSiteSettings,
    apiUpdateStringSiteSetting,
    apiUpdateIntegerSiteSetting,
    apiGetPostPreviewLink,
    // apiGetPostContentBeforeChanges,

    cliInstallAndActivatePlugin,
];


async function loadSiteConfig(): Promise<WPSitesConfig> {
    const configPath = process.env.WP_SITES_PATH || "/Users/michael/Code/mcp-test-server/wp-sites.json";
    if (!configPath) {
        throw new Error("WP_SITES_PATH environment variable is required");
    }

    try {
        const configData = await fs.readFileSync(configPath, {encoding: 'utf8'});
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
            const {name, arguments: rawArgs} = request.params;

            validateSiteToolArguments(rawArgs);
            const {siteKey} = rawArgs;

            let site: WordPressSite;
            try {
                site = await validateAndGetSite(config, siteKey);
            } catch (error) {
                if (error instanceof Error) {
                    return {
                        isError: true,
                        content: [{
                            type: "text",
                            text: `❌ ${error.message}`
                        }]
                    };
                }
                throw error
            }

            const tool = tools.find(t => t.name === name);
            if (!tool) {
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }

            if (name.startsWith('wp_cli_')) {
                let cliWrapper = '{{cmd}}'
                if (site.cli === 'localwp') {
                    if (!site.localWpSshEntryFile || !fs.existsSync(site.localWpSshEntryFile)) {
                        return {
                            isError: true,
                            content: [{
                                type: "text",
                                text: `❌ Option: "localWpSshEntryFile" for site "${siteKey}" is not specified in wp-sites.json while option "cli" is "localwp"`
                            }]
                        };
                    }
                    cliWrapper = `echo $(SHELL= && source "${site.localWpSshEntryFile}" &>/dev/null && {{cmd}})`
                } else {
                    return {
                        isError: true,
                        content: [
                            {
                                type: "text",
                                text: `❌ Option: "cli" for site "${siteKey}" is not specified in wp-sites.json`
                            }
                        ]
                    };
                }

                // @ts-ignore
                return await tool.execute({
                    ...rawArgs,
                    siteKey
                }, site, cliWrapper);
            }

            // @ts-ignore
            return await tool.execute({
                ...rawArgs,
                siteKey
            }, site);
        });

        const transport = new StdioServerTransport();
        await server.connect(transport);

        // console.error(`WordPress MCP server started with ${Object.keys(config.sites).length} site(s) configured`);
    } catch (error) {
        console.error(`Server failed to start: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

main();