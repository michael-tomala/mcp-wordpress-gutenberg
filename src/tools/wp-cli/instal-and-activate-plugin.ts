import {execSync} from "child_process";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {WordPressSite} from "types/wp-sites";

export const cliInstallAndActivatePlugin = {
    name: "wp_cli_install_and_activate_plugin",
    description: "Installs and activates a specified WordPress plugin via WP-CLI.",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            pluginSlug: {type: "string", description: "Plugin slug to install and activate."}
        },
        required: ["pluginSlug"]
    },

    async execute(args: { siteKey: string, pluginSlug: string }, site: WordPressSite, cliWrapper: string) {
        try {
            const pluginSlug = args.pluginSlug;

            const cmdInstallAndActivate = cliWrapper.replace('{{cmd}}', `wp plugin install ${pluginSlug} --activate`)
            const outputInstallAndActivate = execSync(cmdInstallAndActivate, {
                stdio: "pipe",
                cwd: site.path
            });

            return {
                content: [{
                    type: "text",
                    text: `✅ Plugin '${pluginSlug}' was already installed and has been activated. Output from WP-CLI:\n\n${outputInstallAndActivate}`
                }]
            };

        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_cli_install_and_activate_plugin failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_cli_install_and_activate_plugin failed: Unknown error occurred');
        }
    }
};
