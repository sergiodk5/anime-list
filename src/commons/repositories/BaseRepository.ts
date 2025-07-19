import { StorageAdapter } from "@/commons/adapters/StorageAdapter";

/**
 * Abstract base repository providing common CRUD operations
 * All specific repositories should extend this class
 */
export abstract class BaseRepository<T> {
    constructor(protected storageKey: string) {}

    /**
     * Create a new item
     */
    abstract create(data: T): Promise<void>;

    /**
     * Find an item by ID
     */
    abstract findById(id: string): Promise<T | null>;

    /**
     * Find all items
     */
    abstract findAll(): Promise<T[]>;

    /**
     * Update an existing item
     */
    abstract update(id: string, data: Partial<T>): Promise<void>;

    /**
     * Delete an item by ID
     */
    abstract delete(id: string): Promise<void>;

    /**
     * Check if an item exists
     */
    abstract exists(id: string): Promise<boolean>;

    /**
     * Clear all items
     */
    abstract clear(): Promise<void>;

    /**
     * Get count of items
     */
    abstract count(): Promise<number>;

    // Protected helper methods for common storage operations

    /**
     * Get all data as a record from storage
     */
    protected async getAllAsRecord(): Promise<Record<string, T>> {
        const data = await StorageAdapter.get<Record<string, T>>(this.storageKey);
        return data || {};
    }

    /**
     * Set all data as a record to storage
     */
    protected async setAllAsRecord(data: Record<string, T>): Promise<void> {
        await StorageAdapter.set(this.storageKey, data);
    }

    /**
     * Get all data as an array from storage
     */
    protected async getAllAsArray(): Promise<T[]> {
        const data = await StorageAdapter.get<T[]>(this.storageKey);
        return data || [];
    }

    /**
     * Set all data as an array to storage
     */
    protected async setAllAsArray(data: T[]): Promise<void> {
        await StorageAdapter.set(this.storageKey, data);
    }

    /**
     * Clear storage for this repository
     */
    protected async clearStorage(): Promise<void> {
        await StorageAdapter.remove(this.storageKey);
    }
}
