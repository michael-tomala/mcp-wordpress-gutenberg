// src/tools/edit-file.ts
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from 'fs';
import path from 'path';
import { buildBlockTool } from './build-block.js';
import { shouldRebuildBlock } from '../helpers.js';
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
function hasCodePlaceholder(content) {
    return KEEP_CODE_PATTERNS.some(pattern => pattern.test(content));
}
async function mergeWithExistingCode(originalContent, newContent) {
    if (!hasCodePlaceholder(newContent)) {
        return newContent;
    }
    const originalLines = originalContent.split('\n');
    const newLines = newContent.split('\n');
    const result = [];
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
        }
        else {
            isKeepingOriginal = false;
        }
    }
    return result.join('\n');
}
export const editFileTool = {
    name: "wp_edit_file",
    description: "Edits a file in WordPress plugin/block with automatic rebuild detection",
    inputSchema: {
        type: "object",
        properties: {
            site: {
                type: "string",
                description: "Site alias from configuration"
            },
            filePath: {
                type: "string",
                description: "Path to the file relative to the WordPress installation"
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
        required: ["filePath", "operation"]
    },
    async execute(args) {
        try {
            const fullPath = path.join(args.site.path, args.filePath);
            console.error(`Editing file: ${fullPath}`);
            try {
                await fs.access(fullPath);
            }
            catch {
                throw new Error(`File not found: ${fullPath}`);
            }
            let originalContent;
            try {
                originalContent = await fs.readFile(fullPath, 'utf-8');
            }
            catch (error) {
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
                    newContent = originalContent.replace(new RegExp(args.searchValue, 'g'), args.replaceValue);
                    break;
                default:
                    throw new Error(`Unknown operation: ${args.operation}`);
            }
            await fs.writeFile(fullPath, newContent, 'utf-8');
            const blockDirectory = path.dirname(fullPath);
            const needsRebuild = await shouldRebuildBlock(blockDirectory);
            if (needsRebuild) {
                console.error(`File is part of a Gutenberg block, running build...`);
                try {
                    // Wyciągnij nazwę bloku z ścieżki
                    const pluginDirName = path.basename(blockDirectory);
                    const buildResult = await buildBlockTool.execute({
                        name: pluginDirName,
                        directory: path.dirname(blockDirectory),
                        site: args.site // Teraz interfejs to akceptuje
                    });
                    return {
                        content: [{
                                type: "text",
                                text: `File edited successfully.\n\nBuild output:\n${buildResult.content[0].text}`
                            }]
                    };
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown build error';
                    throw new Error(`File edited but build failed: ${errorMessage}`);
                }
            }
            return {
                content: [{
                        type: "text",
                        text: "File edited successfully."
                    }]
            };
        }
        catch (error) {
            console.error('File editing error:', error);
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InternalError, error.message);
            }
            throw new McpError(ErrorCode.InternalError, 'Unknown error occurred while editing file');
        }
    }
};
