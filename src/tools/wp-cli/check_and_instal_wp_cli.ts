import {execSync} from "child_process";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import {WordPressSite} from "types/wp-sites";

export const checkAndInstallWPCLI = {
    name: "check_and_install_wp_cli",
    description: "Checks if WP-CLI is installed. If not, installs it locally.",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"}
        },
        required: []
    },

    async execute(args: any, site: WordPressSite) {
        try {
            // Sprawdzenie, czy PHP jest zainstalowane
            let isPhpInstalled;
            try {
                execSync("php -v", {stdio: "pipe"}); // Sprawdzenie wersji PHP
                isPhpInstalled = true;
            } catch (error) {
                isPhpInstalled = false;
            }

            if (!isPhpInstalled) {
                // Jeśli PHP nie jest zainstalowane, zwróć instrukcje
                return {
                    content: [{
                        type: "text",
                        text: "❌ PHP is not installed. Please install PHP manually before proceeding. \n\n" +
                            "You can install PHP by running the following commands:\n" +
                            "1. On macOS (using Homebrew): `brew install php`\n" +
                            "2. On Ubuntu/Debian: `sudo apt update && sudo apt install php`\n" +
                            "3. On Windows, download PHP from https://windows.php.net/download/."
                    }]
                };
            }

            // Sprawdzenie, czy WP-CLI jest zainstalowane
            let isInstalled;
            try {
                execSync("wp --info", {stdio: "pipe"}); // Jeśli WP-CLI jest zainstalowane, to nie rzuci wyjątkiem
                isInstalled = true;
            } catch (error) {
                isInstalled = false;
            }

            if (isInstalled) {
                return {
                    content: [{type: "text", text: "✅ WP-CLI is already installed."}]
                };
            }

            // Jeśli WP-CLI nie jest zainstalowane, pobierz i zainstaluj lokalnie
            const wpCliPath = path.resolve(site.path, "wp-cli.phar");

            // Pobierz WP-CLI i ustaw odpowiednie uprawnienia
            execSync(`
                curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar &&
                chmod +x wp-cli.phar
            `, {stdio: "inherit", cwd: site.path}); // stdio: "inherit" pozwala na wyświetlanie wyników w terminalu

            // Sprawdzenie, czy WP-CLI działa poprawnie
            let isNowInstalled;
            try {
                execSync(`php "${wpCliPath}" --info`, {stdio: "pipe"});
                isNowInstalled = true;
            } catch (error) {
                isNowInstalled = false;
            }

            if (!isNowInstalled) {
                throw new Error(`WP-CLI installation failed. CLI Path: ${wpCliPath}`);
            }

            return {
                content: [{type: "text", text: "✅ WP-CLI was successfully installed locally."}]
            };

        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `check_and_install_wp_cli failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'check_and_install_wp_cli failed: Unknown error occurred');
        }
    }
};
