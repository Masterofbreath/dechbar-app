/**
 * Audio Cache - IndexedDB Storage for Audio Files
 * 
 * Manages caching of audio files (cues, bells, background tracks) in IndexedDB
 * for offline playback and performance.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Utils
 */

import type { CachedAudioFile } from '../types/audio';

const DB_NAME = 'dechbar-audio-cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio-files';

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };
  });
}

/**
 * Cache audio file
 */
export async function cacheAudioFile(url: string, blob: Blob, ttl?: number): Promise<void> {
  const db = await openDB();
  
  const cachedFile: CachedAudioFile = {
    url,
    blob,
    cachedAt: Date.now(),
    expiresAt: ttl ? Date.now() + ttl : null,
    size: blob.size,
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(cachedFile);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get cached audio file
 */
export async function getCachedAudioFile(url: string): Promise<CachedAudioFile | null> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cached = request.result as CachedAudioFile | undefined;
      
      if (!cached) {
        resolve(null);
        return;
      }
      
      // Check expiration
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        deleteCachedAudioFile(url); // Cleanup expired
        resolve(null);
        return;
      }
      
      resolve(cached);
    };
  });
}

/**
 * Delete cached audio file
 */
export async function deleteCachedAudioFile(url: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(url);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all cached files (for management UI)
 */
export async function getAllCachedFiles(): Promise<CachedAudioFile[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get total cache size
 */
export async function getCacheSize(): Promise<number> {
  const files = await getAllCachedFiles();
  return files.reduce((sum, file) => sum + file.size, 0);
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
