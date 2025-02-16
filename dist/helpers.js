// src/helpers.ts
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs/promises';
import path from 'path';
export function similarity(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    if (s1.includes(s2) || s2.includes(s1))
        return 0.8;
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0)
        return 1.0;
    const distance = longer.split('')
        .filter(char => !shorter.includes(char)).length;
    return (longerLength - distance) / longerLength;
}
export function findMatchingSites(config, searchTerm) {
    if (!searchTerm) {
        return Object.entries(config.sites)
            .map(([key, site]) => [key, site, 1]);
    }
    return Object.entries(config.sites)
        .map(([key, site]) => {
        const keyMatch = similarity(key, searchTerm);
        const nameMatch = similarity(site.name, searchTerm);
        const aliasMatches = (site.aliases || [])
            .map(alias => similarity(alias, searchTerm));
        const maxScore = Math.max(keyMatch, nameMatch, ...aliasMatches);
        return [key, site, maxScore];
    })
        .filter(([, , score]) => score > 0.3)
        .sort((a, b) => b[2] - a[2]);
}
export function formatSitesList(sites) {
    return sites
        .map(([key, site], index) => `${index + 1}. ${key} (${site.name})`)
        .join('\n');
}
export async function validateAndGetSite(config, siteArg) {
    const matches = findMatchingSites(config, siteArg);
    if (matches.length === 0) {
        const availableSites = formatSitesList(findMatchingSites(config));
        throw new McpError(ErrorCode.InvalidParams, `No matching sites found. Available sites:\n${availableSites}`);
    }
    if (matches.length === 1) {
        const [key, site] = matches[0];
        return [key, site];
    }
    const sitesList = formatSitesList(matches);
    throw new McpError(ErrorCode.InvalidParams, `Multiple matching sites found. Let user specify which one to use:\n${sitesList}`);
}
export function validateToolArguments(args) {
    if (!args || typeof args !== 'object') {
        throw new McpError(ErrorCode.InvalidParams, 'Arguments must be an object');
    }
    const typedArgs = args;
    if (typedArgs.site !== undefined && typeof typedArgs.site !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, 'site must be a string if provided');
    }
    if (typeof typedArgs.name !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, 'name must be a string');
    }
    if (typedArgs.directory !== undefined && typeof typedArgs.directory !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, 'directory must be a string or undefined');
    }
}
export async function isGutenbergBlock(directory) {
    try {
        // Sprawdź czy istnieje package.json
        const packageJsonPath = path.join(directory, 'package.json');
        const packageJsonExists = await fs.access(packageJsonPath)
            .then(() => true)
            .catch(() => false);
        if (!packageJsonExists)
            return false;
        // Sprawdź zawartość package.json
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        // Sprawdź charakterystyczne zależności dla bloków Gutenberga
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };
        return ('@wordpress/blocks' in dependencies ||
            '@wordpress/block-editor' in dependencies ||
            packageJson.blockEditor !== undefined);
    }
    catch {
        return false;
    }
}
export async function shouldRebuildBlock(directory) {
    return isGutenbergBlock(directory);
}
