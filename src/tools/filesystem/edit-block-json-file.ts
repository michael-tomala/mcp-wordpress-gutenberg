// src/tools/edit-file.ts
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {promises as fs} from 'fs';
import path from 'path';
import {isGutenbergBlock} from '../../helpers.js';
import {WordPressSite} from "../../types/wp-sites.js";
import {buildBlock} from "./../build-block.js";
import {listPluginFiles} from "tools/list-plugin-files";


interface EditFileArgs {
    filePath: string;
    content: object;
    blockPluginDirname: string;
    siteKey: string;
    didUserConfirmChanges: boolean;
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
                type: "object",
                description: "New content for the block.json file in JSON format"
            },
            didUserConfirmChanges: {
                type: "boolean",
                description: "Are you sure about this changes from new content?"
            }
        },
        required: ["filePath", "blockPluginDirname", "siteKey", "content", "didUserConfirmChanges"]
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
                const availableFiles = await listPluginFiles.execute({
                    ...args,
                    pluginDirName: args.blockPluginDirname
                }, site)

                throw new Error(`File block.json not found: ${fullPath}. Available files within dir ${blockDir}:\n${availableFiles?.files?.join('\n')}`);
            }

            let originalContent: string;
            try {
                originalContent = await fs.readFile(fullPath, 'utf-8');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown read error';
                throw new Error(`Failed to read current block.json file: ${errorMessage}`);
            }

            let warnings = [];
            try {
                let newContent: any = args.content;

                if (newContent.style !== 'file:./style-index.css') {
                    warnings.push('Property "style" in block.json is not default. Default value should be: "file:./style-index.css". If you have changed in intentionally it is ok.')
                }
                if (newContent.editorStyle !== "file:./index.css") {
                    warnings.push('Property "editorStyle" in block.json is not default. Default value should be: "file:./index.css". If you have changed in intentionally it is ok.')
                }
                if (newContent.render) {
                    warnings.push('Property "render" in block.json exists, so it is dynamic block. In this case there should not be save.js file for block, but render file is needed.')
                }

                if (args.didUserConfirmChanges) {
                    await fs.writeFile(fullPath, JSON.stringify(newContent), 'utf-8');
                } else {
                    return {
                        isError: true,
                        content: [{
                            type: "text",
                            text: `Are you sure to make changes to block.json file within ${fullPath}\nNew content:\n${JSON.stringify(newContent, null, 2)}.\n\nWarnings:\n${warnings.join('\n')}\n\nPlease ask user what he think! Let user confirm or not your changes.`
                        }]
                    };
                }
            } catch (error) {
                throw new Error(`New content cannot be parsed: ${args.content}`);
            }

            const buildResult = await buildBlock.execute({
                blockPluginDirname: args.blockPluginDirname,
                siteKey: args.siteKey
            }, site);

            return {
                content: [{
                    type: "text",
                    text: `block.json file: ${fullPath} edited successfully.\n\nBuild output:\n${buildResult.content[0].text}\n\nSome warnings about block.json file found:\n${warnings.join('\n')}`
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