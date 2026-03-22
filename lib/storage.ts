/**
 * lib/storage.ts
 *
 * A typed, promise-based wrapper around AsyncStorage.
 * All values are JSON-serialised, so you can store objects, arrays, and
 * primitives without manual stringification.
 *
 * Usage:
 *   import { storage } from '@/lib/storage';
 *
 *   await storage.set('user:name', 'Alice');
 *   const name = await storage.get<string>('user:name'); // 'Alice'
 *   await storage.remove('user:name');
 *   await storage.clear(); // ⚠️ wipes ALL keys
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Key-prefixing convention ──────────────────────────────────────────────────
// Recommend namespacing your keys: 'user:', 'cache:', 'settings:', etc.
// This helps avoid collisions if you later add libraries that use AsyncStorage.

export const storage = {
  /**
   * Persist any serialisable value under `key`.
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[storage] Failed to set "${key}":`, error);
    }
  },

  /**
   * Retrieve a value by key, or `null` if it doesn't exist.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[storage] Failed to get "${key}":`, error);
      return null;
    }
  },

  /**
   * Retrieve a value, returning `defaultValue` when the key is absent.
   */
  async getOrDefault<T>(key: string, defaultValue: T): Promise<T> {
    const value = await storage.get<T>(key);
    return value ?? defaultValue;
  },

  /**
   * Remove a single key.
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`[storage] Failed to remove "${key}":`, error);
    }
  },

  /**
   * Remove multiple keys at once.
   */
  async removeMany(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.warn(`[storage] Failed to removeMany:`, error);
    }
  },

  /**
   * Check if a key exists.
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch {
      return false;
    }
  },

  /**
   * List all stored keys (useful for debugging).
   */
  async keys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch {
      return [];
    }
  },

  /**
   * ⚠️  Wipe the entire AsyncStorage. Use carefully.
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn('[storage] Failed to clear:', error);
    }
  },
};
