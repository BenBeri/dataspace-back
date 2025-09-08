import {Injectable} from '@nestjs/common';

@Injectable()
export class RepositoryKeyHelper {
    /**
     * Transforms a repository name into a valid key format
     * - Converts to lowercase
     * - Replaces spaces and special characters with dashes
     * - Removes consecutive dashes
     * - Trims dashes from start and end
     * - Ensures max length of 32 characters
     */
    static generateKeyFromName(name: string): string {
        if (!name || typeof name !== 'string') {
            throw new Error('Name must be a non-empty string');
        }

        let key = name
            .toLowerCase() // Convert to lowercase
            .trim() // Remove leading/trailing spaces
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with dashes
            .replace(/-+/g, '-') // Replace consecutive dashes with single dash
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes

        // Ensure minimum length
        if (key.length === 0) {
            throw new Error('Generated key cannot be empty after transformation');
        }

        // Truncate if too long, but avoid ending with a dash
        if (key.length > 32) {
            key = key.substring(0, 32);
            // Remove trailing dash if present after truncation
            key = key.replace(/-+$/, '');
        }

        return key;
    }

    /**
     * Validates if a key is in correct format
     */
    static isValidKey(key: string): boolean {
        if (!key || typeof key !== 'string') {
            return false;
        }

        // Check length
        if (key.length === 0 || key.length > 32) {
            return false;
        }

        // Check format (only lowercase letters, numbers, and dashes)
        const keyRegex = /^[a-z0-9-]+$/;
        if (!keyRegex.test(key)) {
            return false;
        }

        // Should not start or end with dashes
        if (key.startsWith('-') || key.endsWith('-')) {
            return false;
        }

        // Should not have consecutive dashes
        if (key.includes('--')) {
            return false;
        }

        return true;
    }
}
