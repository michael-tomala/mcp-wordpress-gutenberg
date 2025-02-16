import { execSync } from 'child_process';
import fetch from 'node-fetch';
export class WordPressContext {
    constructor(site) {
        this.site = site;
    }
    async execute(command, params) {
        try {
            switch (command) {
                case 'scaffold:plugin':
                    return {
                        success: true,
                        data: await this.scaffoldPlugin(params.name, params.directory)
                    };
                case 'scaffold:block':
                    return {
                        success: true,
                        data: await this.scaffoldBlock(params.name, params.directory)
                    };
                case 'post:create':
                    return {
                        success: true,
                        data: await this.createPost(params)
                    };
                case 'post:update':
                    return {
                        success: true,
                        data: await this.updatePost(params)
                    };
                default:
                    return {
                        success: false,
                        error: `Unknown command: ${command}`
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    // Zmieniono na public
    async scaffoldPlugin(name, directory) {
        const targetDir = directory || `${this.site.path}/wp-content/plugins`;
        const command = `npx @wordpress/create-plugin ${name} --directory=${targetDir}`;
        try {
            execSync(command, { stdio: 'inherit' });
            return { name, path: `${targetDir}/${name}` };
        }
        catch (error) {
            throw new Error(`Failed to scaffold plugin: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        }
    }
    // Zmieniono na public
    async scaffoldBlock(name, directory) {
        const targetDir = directory || `${this.site.path}/wp-content/plugins`;
        const command = `npx @wordpress/create-block ${name} --directory=${targetDir}`;
        try {
            execSync(command, { stdio: 'inherit' });
            return { name, path: `${targetDir}/${name}` };
        }
        catch (error) {
            throw new Error(`Failed to scaffold block: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        }
    }
    // Zmieniono na public
    async createPost(post) {
        const response = await fetch(`${this.site.apiUrl}/wp/v2/posts`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(post)
        });
        if (!response.ok) {
            throw new Error(`Failed to create post: ${response.statusText}`);
        }
        return await response.json();
    }
    // Zmieniono na public
    async updatePost(post) {
        const response = await fetch(`${this.site.apiUrl}/wp/v2/posts/${post.id}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(post)
        });
        if (!response.ok) {
            throw new Error(`Failed to update post: ${response.statusText}`);
        }
        return await response.json();
    }
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.site.apiCredentials) {
            const { username, password } = this.site.apiCredentials;
            const auth = Buffer.from(`${username}:${password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }
        return headers;
    }
}
