// src/tools/edit-file.ts
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import {promises as fs} from 'fs';
import path from 'path';
import {isGutenbergBlock} from '../../helpers.js';
import {WordPressSite} from "../../types/wp-sites.js";
import {buildBlock} from "./../build-block.js";

// Definicje typów dla operacji edycji plików
interface FileOperation {
    type: 'write' | 'append' | 'modify' | 'smart_modify';
    content?: string;
    searchValue?: string;
    replaceValue?: string;
}

interface EditFileArgs {
    filePath: string;
    operation: FileOperation['type'];
    content?: string;
    searchValue?: string;
    replaceValue?: string;
    directory: string;
    blockPluginDirname: string;
    siteKey: string;
}

// Wzorce komentarzy wskazujące na zachowanie istniejącego kodu
const KEEP_CODE_PATTERNS = [
    /\/\/ *(?:rest of|remaining|other) code (?:remains |stays )?(?:the )?same/i,
    /\/\/ *\.\.\./,
    /\/\* *\.\.\.? *\*\//,
    /\{?\s*\.\.\.\s*\}?/,
    /\/\/ *no changes/i,
    /\/\/ *unchanged/i
];

// Funkcje pomocnicze
function hasCodePlaceholder(content: string): boolean {
    return KEEP_CODE_PATTERNS.some(pattern => pattern.test(content));
}

async function mergeWithExistingCode(originalContent: string, newContent: string): Promise<string> {
    if (!hasCodePlaceholder(newContent)) {
        return newContent;
    }

    const originalLines = originalContent.split('\n');
    const newLines = newContent.split('\n');
    const result: string[] = [];
    let isKeepingOriginal = false;

    for (let i = 0; i < newLines.length; i++) {
        const currentLine = newLines[i];

        if (hasCodePlaceholder(currentLine)) {
            if (i > 0 && i < newLines.length - 1) {
                const previousLine = newLines[i - 1];
                const nextLine = newLines[i + 1];

                const startIndex = originalLines.findIndex(line => line.includes(previousLine));
                const endIndex = originalLines.findIndex((line, idx) => idx > startIndex && line.includes(nextLine));

                if (startIndex !== -1 && endIndex !== -1) {
                    result.push(...originalLines.slice(startIndex + 1, endIndex));
                    continue;
                }
            }
            isKeepingOriginal = true;
            continue;
        }

        if (!isKeepingOriginal) {
            result.push(currentLine);
        } else {
            isKeepingOriginal = false;
        }
    }

    return result.join('\n');
}

export const editBlockFile = {
    name: "wp_edit_block_file",
    description: "Edits a common file in WordPress Gutenberg Block Plugin with automatic rebuild detection",
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
                description: "Path to the file relative to the plugin root."
            },
            content: {
                type: "string",
                description: "New content for the file"
            },
            operation: {
                type: "string",
                enum: ["write", "append", "modify", "smart_modify"],
                description: "Operation to perform on the file"
            },
            searchValue: {
                type: "string",
                description: "Text to search for when using modify operation"
            },
            replaceValue: {
                type: "string",
                description: "Text to replace with when using modify operation"
            }
        },
        required: ["filePath", "operation", "blockPluginDirname", "siteKey"]
    },

    async execute(args: EditFileArgs, site: WordPressSite) {

        const blockDir = path.join(site.pluginsPath, args.blockPluginDirname)
        const fullPath = path.join(blockDir, args.filePath);

        if (!(await isGutenbergBlock(blockDir))) {
            throw new Error(`wp_edit_block_file failed: directory ${blockDir} does not contain a Gutenberg block. Are you sure ${blockDir} is valid?`);
        }
        if (args.filePath.endsWith('block.json')) {
            throw new Error(`This tool cannot edit block.json file. Please use another tool: wp_edit_block_json_file instead and try again.`);
        }
        if (args.filePath.includes('/build/')) {
            throw new Error(`Files within "build" directory shouldn't be edited directly.`);
        }

        try {
            try {
                await fs.access(fullPath);
            } catch {
                throw new Error(`File not found: ${fullPath}`);
            }

            let originalContent: string;
            try {
                originalContent = await fs.readFile(fullPath, 'utf-8');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown read error';
                throw new Error(`Failed to read file: ${errorMessage}`);
            }

            let newContent = originalContent;

            switch (args.operation) {
                case 'smart_modify':
                    if (!args.content) {
                        throw new Error('Content is required for smart_modify operation');
                    }
                    newContent = await mergeWithExistingCode(originalContent, args.content);
                    break;

                case 'write':
                    if (!args.content) {
                        throw new Error('Content is required for write operation');
                    }
                    newContent = args.content;
                    break;

                case 'append':
                    if (!args.content) {
                        throw new Error('Content is required for append operation');
                    }
                    newContent = originalContent + '\n' + args.content;
                    break;

                case 'modify':
                    if (!args.searchValue || !args.replaceValue) {
                        throw new Error('searchValue and replaceValue are required for modify operation');
                    }
                    newContent = originalContent.replace(
                        new RegExp(args.searchValue, 'g'),
                        args.replaceValue
                    );
                    break;

                default:
                    throw new Error(`Unknown operation: ${args.operation}`);
            }

            await fs.writeFile(fullPath, newContent, 'utf-8');

            try {
                const buildResult = await buildBlock.execute({
                    blockPluginDirname: args.blockPluginDirname,
                    siteKey: args.siteKey
                }, site);

                return {
                    content: [{
                        type: "text",
                        text: `Block file: ${fullPath} edited successfully.\n\nBuild output:\n${buildResult.content[0].text}`
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown build error';
                throw new Error(`Block file: ${fullPath} edited but build failed: ${errorMessage}. Please try build again on check error logs on your own.`);
            }

            return {
                content: [{
                    type: "text",
                    text: `Block file: ${fullPath} edited successfully.`
                }]
            };

        } catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, error.message);
            }
            throw new McpError(ErrorCode.InternalError, 'wp_edit_block_file: Unknown error occurred');
        }
    }
};