/**
 * Upload Service - Bunny.net CDN Integration
 * 
 * Handles file uploads to Bunny.net CDN and metadata extraction.
 * 
 * Features:
 * - Upload audio files (MP3, M4A, WAV)
 * - Upload images (JPG, PNG, WebP)
 * - Auto-detect storage path based on duration
 * - Progress tracking
 * - Metadata extraction from files and URLs
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Upload
 * @since 2.47.0
 */

import type { AudioMetadata, UploadProgressCallback } from './types';

const BUNNY_CONFIG = {
  storageZone: import.meta.env.VITE_BUNNY_STORAGE_ZONE || 'dechbar-audio',
  hostname: import.meta.env.VITE_BUNNY_HOSTNAME || 'storage.bunnycdn.com',
  accessKey: import.meta.env.VITE_BUNNY_ACCESS_KEY || '',
  cdnUrl: import.meta.env.VITE_BUNNY_CDN_URL || 'https://dechbar-cdn.b-cdn.net',
};

/**
 * Generate unique filename with UUID
 */
function generateFilename(originalName: string): string {
  const extension = originalName.split('.').pop() || 'mp3';
  const uuid = crypto.randomUUID();
  return `${uuid}.${extension}`;
}

/**
 * Get file extension from filename
 */
function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Validate file type
 */
function validateFileType(file: File, allowedTypes: string[]): boolean {
  const extension = getExtension(file.name);
  return allowedTypes.includes(extension);
}

/**
 * Upload Service API
 */
export const uploadService = {
  /**
   * Upload audio file to Bunny.net CDN
   * Auto-detects storage path based on duration (> 1h → breathwork, else → tracks)
   * 
   * @param file - Audio file (MP3, M4A, WAV)
   * @param duration - Audio duration in seconds
   * @param onProgress - Progress callback (0-100)
   * @returns Promise<string> - CDN URL
   */
  async uploadAudio(
    file: File,
    duration: number,
    onProgress?: UploadProgressCallback
  ): Promise<string> {
    // Validate file type
    const allowedTypes = ['mp3', 'm4a', 'wav', 'aac'];
    if (!validateFileType(file, allowedTypes)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Auto-detect storage path based on duration
    const path = duration > 3600 ? 'audio/breathwork' : 'audio/tracks';
    const filename = generateFilename(file.name);
    const storagePath = `${path}/${filename}`;
    const uploadUrl = `https://${BUNNY_CONFIG.hostname}/${BUNNY_CONFIG.storageZone}/${storagePath}`;

    try {
      // Upload using XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percent: Math.round((e.loaded / e.total) * 100),
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('AccessKey', BUNNY_CONFIG.accessKey);
        xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');
        xhr.send(file);
      });

      // Return CDN URL
      return `${BUNNY_CONFIG.cdnUrl}/${storagePath}`;
    } catch (error) {
      console.error('Audio upload error:', error);
      throw error;
    }
  },

  /**
   * Upload image file to Bunny.net CDN
   * 
   * @param file - Image file (JPG, PNG, WebP)
   * @param type - Image type ('cover' for track covers, 'album' for album covers)
   * @returns Promise<string> - CDN URL
   */
  async uploadImage(
    file: File,
    type: 'cover' | 'album' = 'cover'
  ): Promise<string> {
    // Validate file type
    const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
    if (!validateFileType(file, allowedTypes)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Determine storage path
    const path = type === 'album' ? 'images/albums' : 'images/covers';
    const filename = generateFilename(file.name);
    const storagePath = `${path}/${filename}`;
    const uploadUrl = `https://${BUNNY_CONFIG.hostname}/${BUNNY_CONFIG.storageZone}/${storagePath}`;

    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_CONFIG.accessKey,
          'Content-Type': file.type || 'image/jpeg',
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      // Return CDN URL
      return `${BUNNY_CONFIG.cdnUrl}/${storagePath}`;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  },

  /**
   * Delete file from Bunny.net CDN
   * 
   * @param url - Full CDN URL (e.g., https://dechbar-cdn.b-cdn.net/audio/tracks/uuid.mp3)
   * @returns Promise<void>
   */
  async deleteFile(url: string): Promise<void> {
    try {
      // Extract path from CDN URL
      const cdnUrlPrefix = BUNNY_CONFIG.cdnUrl;
      if (!url.startsWith(cdnUrlPrefix)) {
        throw new Error('Invalid CDN URL');
      }

      const path = url.replace(cdnUrlPrefix + '/', '');
      const deleteUrl = `https://${BUNNY_CONFIG.hostname}/${BUNNY_CONFIG.storageZone}/${path}`;

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': BUNNY_CONFIG.accessKey,
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('File delete error:', error);
      throw error;
    }
  },

  /**
   * Extract audio metadata from File object (client-side)
   * 
   * @param file - Audio file
   * @returns Promise<AudioMetadata>
   */
  async extractMetadataFromFile(file: File): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          duration: Math.floor(audio.duration),
          size: file.size,
        });
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load audio metadata'));
      });

      audio.src = objectUrl;
    });
  },

  /**
   * Extract audio metadata from URL (fetch remote file)
   * 
   * @param url - Audio URL
   * @returns Promise<AudioMetadata>
   */
  async extractMetadataFromUrl(url: string): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.addEventListener('loadedmetadata', () => {
        resolve({
          duration: Math.floor(audio.duration),
        });
      });

      audio.addEventListener('error', () => {
        reject(new Error('Failed to load audio from URL'));
      });

      // Set CORS mode
      audio.crossOrigin = 'anonymous';
      audio.src = url;
    });
  },

  /**
   * Extract audio metadata (auto-detect File or URL)
   * 
   * @param source - File object or URL string
   * @returns Promise<AudioMetadata>
   */
  async extractAudioMetadata(source: File | string): Promise<AudioMetadata> {
    if (source instanceof File) {
      return this.extractMetadataFromFile(source);
    } else {
      return this.extractMetadataFromUrl(source);
    }
  },
};
