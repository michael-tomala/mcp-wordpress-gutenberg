// src/tools/edit-file.ts
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {promises as fs} from 'fs';
import path from 'path';
import {isGutenbergBlock} from '../../helpers.js';
import {WordPressSite} from "../../types/wp-sites.js";
import {buildBlock} from "./../build-block.js";


interface EditFileArgs {
    filePath: string;
    content: string;
    blockPluginDirname: string;
    siteKey: string;
    areYouSure: boolean;
}

export const editBlockJsonFile = {
    name: "wp_edit_block_json_file",
    description: "Edits a file: block.json in WordPress Gutenberg Block Plugin with automatic rebuild detection and block.json file validation.",
    inputSchema: {
        type: "object",
        properties: {
            siteKey: {type: "string", description: "Site key"},
            blockPluginDirname: {
                type: "string",
                description: "Block plugin directory name."
            },
            filePath: {
                type: "string",
                description: "Path to the block.json file relative to the plugin root."
            },
            content: {
                type: "string",
                description: "New content for the block.json file"
            },
            areYouSure: {
                type: "boolean",
                description: "Are you sure about this changes from new content?"
            }
        },
        required: ["filePath", "blockPluginDirname", "siteKey", "content", "areYouSure"]
    },

    async execute(args: EditFileArgs, site: WordPressSite) {

        const blockDir = path.join(site.pluginsPath, args.blockPluginDirname)
        const fullPath = path.join(blockDir, args.filePath);

        if (!(await isGutenbergBlock(blockDir))) {
            throw new Error(`wp_edit_block_json_file failed: directory ${blockDir} does not contain a Gutenberg block. Are you sure ${blockDir} is valid?`);
        }

        if (!args.filePath.endsWith('block.json')) {
            throw new Error(`wp_edit_block_json_file failed: this tool can only edit block.json file. Are you sure ${fullPath} is valid for this action?`);
        }

        try {
            try {
                await fs.access(fullPath);
            } catch {
                // const availableFiles = await listPluginFiles.execute({
                //     ...args,
                //     pluginDirName: args.blockPluginDirname
                // }, site)

                // throw new Error(`File block.json not found: ${fullPath}. Available files within dir ${blockDir}:\n${availableFiles?.files?.join('\n')}`);
                throw new Error(`File block.json not found: ${fullPath}.`);
            }

            let originalContent: string;
            try {
                originalContent = await fs.readFile(fullPath, 'utf-8');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown read error';
                throw new Error(`Failed to read current block.json file: ${errorMessage}`);
            }

            try {
                let newContent = args.content;

                if (args.areYouSure) {
                    await fs.writeFile(fullPath, newContent, 'utf-8');
                } else {
                    return {
                        isError: true,
                        content: [{
                            type: "text",
                            text: `Are you sure to make changes to block.json file within ${fullPath}\nNew content:\n${JSON.stringify(newContent, null, 2)}`
                        }]
                    };
                }
            } catch (error) {
                throw new Error(`New content cannot be parsed: ${args.content}`);
            }

            try {
                const buildResult = await buildBlock.execute({
                    blockPluginDirname: args.blockPluginDirname,
                    siteKey: args.siteKey
                }, site);

                return {
                    content: [{
                        type: "text",
                        text: `block.json file: ${fullPath} edited successfully.\n\nBuild output:\n${buildResult.content[0].text}`
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown build error';
                throw new Error(`block.json file: ${fullPath} edited but build failed: ${errorMessage}. Please try build again on check error logs on your own.`);
            }

            return {
                content: [{
                    type: "text",
                    text: `block.json file: ${fullPath} edited successfully.`
                }]
            };

        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, error.message);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_edit_block_json_file: Unknown error occurred');
        }
    }
};