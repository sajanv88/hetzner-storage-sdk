import { Readable } from 'stream';
import {
  FileMetadata,
  UploadOptions,
  DownloadOptions,
  StorageConfig,
} from '../types';

/**
 * Abstract base class for all storage providers
 * Defines the common interface that both Storage Box and Storage Share must implement
 */
export abstract class BaseStorageProvider {
  protected config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  /**
   * List files and directories at the specified path
   * @param remotePath - The remote path to list (default: '/')
   * @returns Array of file metadata
   */
  abstract listFiles(remotePath?: string): Promise<FileMetadata[]>;

  /**
   * Upload a file to the storage
   * @param localPath - Local file path or Buffer or Readable stream
   * @param remotePath - Remote destination path
   * @param options - Upload options
   */
  abstract uploadFile(
    localPath: string | Buffer | Readable,
    remotePath: string,
    options?: UploadOptions
  ): Promise<void>;

  /**
   * Download a file from the storage
   * @param remotePath - Remote file path
   * @param localPath - Local destination path (optional, returns Buffer if not provided)
   * @param options - Download options
   * @returns Buffer if localPath is not provided, void otherwise
   */
  abstract downloadFile(
    remotePath: string,
    localPath?: string,
    options?: DownloadOptions
  ): Promise<Buffer | void>;

  /**
   * Delete a file or directory from the storage
   * @param remotePath - Remote path to delete
   */
  abstract deleteFile(remotePath: string): Promise<void>;

  /**
   * Create a directory
   * @param remotePath - Remote directory path to create
   */
  abstract createDirectory(remotePath: string): Promise<void>;

  /**
   * Move or rename a file/directory
   * @param fromPath - Source path
   * @param toPath - Destination path
   */
  abstract moveFile(fromPath: string, toPath: string): Promise<void>;

  /**
   * Copy a file/directory
   * @param fromPath - Source path
   * @param toPath - Destination path
   */
  abstract copyFile(fromPath: string, toPath: string): Promise<void>;

  /**
   * Check if a file or directory exists
   * @param remotePath - Remote path to check
   * @returns true if exists, false otherwise
   */
  abstract exists(remotePath: string): Promise<boolean>;

  /**
   * Get metadata for a specific file or directory
   * @param remotePath - Remote path
   * @returns File metadata
   */
  abstract getMetadata(remotePath: string): Promise<FileMetadata>;

  /**
   * Get the provider type
   */
  abstract getProviderType(): 'box' | 'share' | 'object';

  /**
   * Clean up resources and close connections
   */
  abstract disconnect(): Promise<void>;
}
