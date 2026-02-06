/**
 * Upload Service Types
 * 
 * Type definitions for Bunny.net CDN upload operations.
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Upload
 * @since 2.47.0
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface AudioMetadata {
  duration: number;
  sampleRate?: number;
  bitrate?: number;
  size?: number;
}

export interface UploadError extends Error {
  code?: string;
  statusCode?: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;
