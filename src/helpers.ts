// src/helpers.ts
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs/promises';
import path from 'path';

export interface WordPressSite {
    name: string;
    path: string;
    pluginsPath: string;
    aliases?: string[];
    apiUrl: string;
    apiCredentials?: {
        username: string;
        password: string;
    };
}

export interface WPSitesConfig {
    sites: {
        [key: string]: WordPressSite;
    };
}

export interface ToolArguments {
    siteKey: string;
}

export function similarity(s1: string, s2: string): number {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;

    const distance = longer.split('')
        .filter(char => !shorter.includes(char)).length;
    return (longerLength - distance) / longerLength;
}

export function findMatchingSites(config: WPSitesConfig, searchTerm?: string): Array<[string, WordPressSite, number]> {
    if (!searchTerm) {
        return Object.entries(config.sites)
            .map(([key, site]) => [key, site, 1] as [string, WordPressSite, number]);
    }

    return Object.entries(config.sites)
        .map(([key, site]) => {
            const keyMatch = similarity(key, searchTerm);
            const nameMatch = similarity(site.name, searchTerm);
            const aliasMatches = (site.aliases || [])
                .map(alias => similarity(alias, searchTerm));

            const maxScore = Math.max(keyMatch, nameMatch, ...aliasMatches);
            return [key, site, maxScore] as [string, WordPressSite, number];
        })
        .filter(([, , score]) => score > 0.3)
        .sort((a, b) => b[2] - a[2]);
}

export function formatSitesList(sites: Array<[string, WordPressSite, number]>): string {
    return sites
        .map(([key, site], index) =>
            `${index + 1}. ${key} (${site.name})`)
        .join('\n');
}

export async function validateAndGetSite(config: WPSitesConfig, siteArg?: string): Promise<WordPressSite> {
    const matches = findMatchingSites(config, siteArg);

    if (matches.length === 0) {
        const availableSites = formatSitesList(findMatchingSites(config));
        throw new McpError(
            ErrorCode.InvalidParams,
            `No matching sites found. Available sites:\n${availableSites}`
        );
    }

    if (matches.length === 1) {
        const [key, site] = matches[0];
        return site;
    }

    const sitesList = formatSitesList(matches);
    throw new McpError(
        ErrorCode.InvalidParams,
        `Multiple matching sites found. Let user specify which one to use:\n${sitesList}`
    );
}

export function validateSiteToolArguments(args: unknown): asserts args is ToolArguments {
    if (!args || typeof args !== 'object') {
        throw new McpError(ErrorCode.InvalidParams, 'Arguments must be an object');
    }

    const typedArgs = args as Record<string, unknown>;

    if (typedArgs.siteKey !== undefined && typeof typedArgs.siteKey !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, 'siteKey must be a string if provided');
    }
}


export async function isGutenbergBlock(directory: string): Promise<boolean> {
    try {
        // Sprawdź czy istnieje package.json
        const packageJsonPath = path.join(directory, 'package.json');
        const packageJsonExists = await fs.access(packageJsonPath)
            .then(() => true)
            .catch(() => false);

        if (!packageJsonExists) return false;

        // Sprawdź zawartość package.json
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

        // Sprawdź charakterystyczne zależności dla bloków Gutenberga
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };

        return (
            '@wordpress/blocks' in dependencies ||
            '@wordpress/block-editor' in dependencies ||
            packageJson.blockEditor !== undefined
        );
    } catch {
        return false;
    }
}

export async function shouldRebuildBlock(directory: string): Promise<boolean> {
    return isGutenbergBlock(directory);
}