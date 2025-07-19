/**
 * Storage adapter for Chrome Extension storage
 * Provides a clean interface to chrome.storage.local operations
 */
export class StorageAdapter {
    /**
     * Get data from storage by key
     */
    static async get<T>(key: string): Promise<T | null> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(key, (result) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve((result[key] as T) || null);
            });
        });
    }

    /**
     * Set data in storage by key
     */
    static async set(key: string, value: any): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [key]: value }, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }

    /**
     * Remove data from storage by key
     */
    static async remove(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove(key, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }

    /**
     * Clear all storage data
     */
    static async clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.clear(() => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }

    /**
     * Get multiple keys at once
     */
    static async getMultiple(keys: string[]): Promise<Record<string, any>> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve(result);
            });
        });
    }

    /**
     * Set multiple key-value pairs at once
     */
    static async setMultiple(items: Record<string, any>): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(items, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }

    /**
     * Remove multiple keys at once
     */
    static async removeMultiple(keys: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove(keys, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }
}
