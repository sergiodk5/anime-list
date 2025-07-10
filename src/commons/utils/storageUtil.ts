/**
 * Generic storage utility for Chrome extension storage
 * Provides CRUD operations for any storage key
 */
export class StorageUtil {
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
}

/**
 * Generic CRUD operations for record-based storage
 * Where data is stored as Record<string, T>
 */
export class RecordStorageUtil {
    /**
     * Get all records from storage
     */
    static async getAll<T>(key: string): Promise<Record<string, T>> {
        const data = await StorageUtil.get<Record<string, T>>(key);
        return data || {};
    }

    /**
     * Get a single record by ID
     */
    static async getById<T>(key: string, id: string): Promise<T | null> {
        const records = await this.getAll<T>(key);
        return records[id] || null;
    }

    /**
     * Save/update a record
     */
    static async save<T>(key: string, id: string, record: T): Promise<void> {
        const records = await this.getAll<T>(key);
        records[id] = record;
        await StorageUtil.set(key, records);
    }

    /**
     * Delete a record by ID
     */
    static async delete(key: string, id: string): Promise<void> {
        const records = await this.getAll(key);
        delete records[id];
        await StorageUtil.set(key, records);
    }

    /**
     * Check if a record exists
     */
    static async exists(key: string, id: string): Promise<boolean> {
        const record = await this.getById(key, id);
        return record !== null;
    }

    /**
     * Get all records as an array of values
     */
    static async getAllAsArray<T>(key: string): Promise<T[]> {
        const records = await this.getAll<T>(key);
        return Object.values(records);
    }

    /**
     * Clear all records for a key
     */
    static async clear(key: string): Promise<void> {
        await StorageUtil.set(key, {});
    }
}

/**
 * Generic CRUD operations for array-based storage
 * Where data is stored as T[]
 */
export class ArrayStorageUtil {
    /**
     * Get all items from storage
     */
    static async getAll<T>(key: string): Promise<T[]> {
        const data = await StorageUtil.get<T[]>(key);
        return data || [];
    }

    /**
     * Add an item to the array
     */
    static async add<T>(key: string, item: T): Promise<void> {
        const items = await this.getAll<T>(key);
        const newItems = [...items, item];
        await StorageUtil.set(key, newItems);
    }

    /**
     * Remove an item from the array
     */
    static async remove<T>(key: string, predicate: (item: T) => boolean): Promise<void> {
        const items = await this.getAll<T>(key);
        const filteredItems = items.filter((item) => !predicate(item));
        await StorageUtil.set(key, filteredItems);
    }

    /**
     * Update an item in the array
     */
    static async update<T>(key: string, predicate: (item: T) => boolean, updater: (item: T) => T): Promise<void> {
        const items = await this.getAll<T>(key);
        const updatedItems = items.map((item) => (predicate(item) ? updater(item) : item));
        await StorageUtil.set(key, updatedItems);
    }

    /**
     * Find an item in the array
     */
    static async find<T>(key: string, predicate: (item: T) => boolean): Promise<T | undefined> {
        const items = await this.getAll<T>(key);
        return items.find(predicate);
    }

    /**
     * Check if an item exists in the array
     */
    static async exists<T>(key: string, predicate: (item: T) => boolean): Promise<boolean> {
        const item = await this.find<T>(key, predicate);
        return item !== undefined;
    }

    /**
     * Clear all items
     */
    static async clear(key: string): Promise<void> {
        await StorageUtil.set(key, []);
    }
}
