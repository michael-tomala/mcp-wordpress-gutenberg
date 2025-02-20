import {WordPressSite} from "types/wp-sites";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";

// Lista dozwolonych kluczy ustawień zgodnie z dokumentacją WordPress REST API
const VALID_SETTING_KEYS = [
    "title", "description", "url", "email", "timezone", "date_format", "time_format",
    "language", "default_post_format", "show_on_front",
    "default_ping_status", "default_comment_status"
] as const;

type SettingKey = (typeof VALID_SETTING_KEYS)[number];

export const apiUpdateStringSiteSetting = {
    name: "wp_api_update_string_site_setting",
    description: "Updates a single WordPress site setting in string format using REST API",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            settingKey: {
                type: "string",
                enum: VALID_SETTING_KEYS, // Walidacja poprawnych kluczy
                description: "The key of the setting to update"
            },
            settingValue: {type: "string", description: "The new value for the setting"}
        },
        required: ["siteKey", "settingKey", "settingValue"]
    },

    async execute(args: { siteKey: string; settingKey: SettingKey; settingValue: any }, site: WordPressSite) {
        try {

            if (!VALID_SETTING_KEYS.includes(args.settingKey)) {
                throw new Error(`Invalid setting key: ${args.settingKey}. Allowed values: ${VALID_SETTING_KEYS.join(", ")}`);
            }

            const credentials = Buffer.from(`${site.apiCredentials?.username}:${site.apiCredentials?.password}`).toString('base64');
            const url = `${site.apiUrl}/wp/v2/settings`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({[args.settingKey]: args.settingValue})
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to update setting: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();

            return {
                settings: data,
                content: [{
                    type: "text",
                    text: `Site settings updated successfully.\n\nNew settings object: ${JSON.stringify(data, null, 2)}`
                }]
            };

        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, `wp_api_update_string_site_setting failed: ${error.message}`);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_api_update_string_site_setting failed: Unknown error occurred');
        }
    }
};
