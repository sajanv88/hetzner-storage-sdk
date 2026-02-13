import { createReadStream, createWriteStream } from 'fs';
import { Readable } from 'stream';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createClient, WebDAVClient, FileStat, AuthType } from 'webdav';
import SftpClient from 'ssh2-sftp-client';
import { BaseStorageProvider } from './BaseStorageProvider';
import { RobotApiClient } from '../utils/RobotApiClient';
import {
  StorageBoxConfig,
  FileMetadata,
  UploadOptions,
  DownloadOptions,
  StorageBoxDetails,
  SnapshotInfo,
  StorageBoxServiceToggle,
} from '../types';

const pipelineAsync = promisify(pipeline);

/**
 * Provider for Hetzner Storage Box
 * Supports both WebDAV and SFTP protocols for file operations
 * Uses Robot API for management operations
 */
export class StorageBoxProvider extends BaseStorageProvider {
  private _config: StorageBoxConfig;
  private webdavClient?: WebDAVClient;
  private sftpClient?: SftpClient;
  private robotClient?: RobotApiClient;
  private protocol: 'webdav';

  constructor(config: StorageBoxConfig) {
    super(config);
    this._config = config;
    this.protocol = config.protocol || 'webdav';

    // Initialize Robot API client if credentials are provided
    if (config.robotUsername && config.robotPassword) {
      this.robotClient = new RobotApiClient(
        config.robotUsername,
        config.robotPassword
      );
    }

    // Initialize the appropriate protocol client
    if (this.protocol === 'webdav') {
      this.initializeWebDAV();
    } else {
      throw new Error(`Unsupported protocol: ${this.protocol}`);
    }
  }

  /**
   * Initialize WebDAV client
   */
  private initializeWebDAV(): void {
    const baseUrl = `https://${this._config.username}.your-storagebox.de`;

    // Manually encode credentials for Basic auth to handle special characters
    const credentials = Buffer.from(
      `${this._config.username}:${this._config.password}`
    ).toString('base64');

    this.webdavClient = createClient(baseUrl, {
      authType: AuthType.None,
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
  }



  /**
   * Convert WebDAV FileStat to FileMetadata
   */
  private convertWebDAVStat(stat: FileStat): FileMetadata {
    return {
      filename: stat.basename,
      path: stat.filename,
      size: stat.size,
      lastModified: new Date(stat.lastmod),
      type: stat.type === 'directory' ? 'directory' : 'file',
      etag: stat.etag || undefined,
      mime: stat.mime,
    };
  }

  /**
   * List files and directories at the specified path
   */
  async listFiles(remotePath: string = '/'): Promise<FileMetadata[]> {
    if (this.protocol === 'webdav') {
      if (!this.webdavClient) {
        throw new Error('WebDAV client not initialized');
      }

      const contents = await this.webdavClient.getDirectoryContents(remotePath);
      return (contents as FileStat[]).map((item) =>
        this.convertWebDAVStat(item)
      );
    } else {
      throw new Error(`Unsupported protocol: ${this.protocol}`);
    }
  }

  /**
   * Upload a file to the storage
   */
  async uploadFile(
    localPath: string | Buffer | Readable,
    remotePath: string,
    options?: UploadOptions
  ): Promise<void> {
    if (this.protocol === 'webdav') {
      if (!this.webdavClient) {
        throw new Error('WebDAV client not initialized');
      }

      let content: Buffer | Readable;

      if (typeof localPath === 'string') {
        content = createReadStream(localPath);
      } else {
        content = localPath;
      }

      await this.webdavClient.putFileContents(remotePath, content, {
        overwrite: options?.overwrite ?? true,
        contentLength: content instanceof Buffer ? content.length : undefined,
        headers: options?.contentType
          ? { 'Content-Type': options.contentType }
          : undefined,
      });
    } else {

      throw new Error(`Unsupported protocol: ${this.protocol}`);
    }
  }

  /**
   * Download a file from the storage
   */
  async downloadFile(
    remotePath: string,
    localPath?: string,
    options?: DownloadOptions
  ): Promise<Buffer | void> {
    if (this.protocol === 'webdav') {
      if (!this.webdavClient) {
        throw new Error('WebDAV client not initialized');
      }

      const content = await this.webdavClient.getFileContents(remotePath);

      if (localPath) {
        // Write to file
        const buffer =
          content instanceof Buffer ? content : Buffer.from(content as string);
        const writeStream = createWriteStream(localPath);
        await pipelineAsync(Readable.from(buffer), writeStream);
      } else {
        // Return buffer
        return content instanceof Buffer
          ? content
          : Buffer.from(content as string);
      }
    } else {
      throw new Error(`Unsupported protocol: ${this.protocol}`);
    }
  }

  /**
   * Delete a file or directory from the storage
   */
  async deleteFile(remotePath: string): Promise<void> {
    if (this.protocol === 'webdav') {
      if (!this.webdavClient) {
        throw new Error('WebDAV client not initialized');
      }
      await this.webdavClient.deleteFile(remotePath);
    } else {
      throw new Error(`Unsupported protocol: ${this.protocol}`);
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(remotePath: string): Promise<void> {
    if (this.protocol === 'webdav') {
      if (!this.webdavClient) {
        throw new Error('WebDAV client not initialized');
      }
      await this.webdavClient.createDirectory(remotePath);
    } else {
      throw new Error(`Unsupported protocol: ${this.protocol}`);
    }
  }

  /**
   * Move or rename a file/directory
   */
  async moveFile(fromPath: string, toPath: string): Promise<void> {
    if (this.protocol === 'webdav') {
      if (!this.webdavClient) {
        throw new Error('WebDAV client not initialized');
      }
      await this.webdavClient.moveFile(fromPath, toPath);
    } else {
      throw new Error(`Unsupported protocol: ${this.protocol}`);
    }
  }

  /**
   * Copy a file/directory
   */
  async copyFile(fromPath: string, toPath: string): Promise<void> {
    if (this.protocol === 'webdav') {
      if (!this.webdavClient) {
        throw new Error('WebDAV client not initialized');
      }
      await this.webdavClient.copyFile(fromPath, toPath);
    } else {
      throw new Error(`Unsupported protocol: ${this.protocol}`);
    }
  }

  /**
   * Check if a file or directory exists
   */
  async exists(remotePath: string): Promise<boolean> {
    if (this.protocol === 'webdav') {
      if (!this.webdavClient) {
        throw new Error('WebDAV client not initialized');
      }
      return await this.webdavClient.exists(remotePath);
    } else {
      throw new Error(`Unsupported protocol: ${this.protocol}`);
    }
  }

  /**
   * Get metadata for a specific file or directory
   */
  async getMetadata(remotePath: string): Promise<FileMetadata> {
    if (this.protocol === 'webdav') {
      if (!this.webdavClient) {
        throw new Error('WebDAV client not initialized');
      }
      const stat = (await this.webdavClient.stat(remotePath)) as FileStat;
      return this.convertWebDAVStat(stat);
    } else {
      throw new Error(`Unsupported protocol: ${this.protocol}`);
    }
  }

  /**
   * Get the provider type
   */
  getProviderType(): 'box' {
    return 'box';
  }

  /**
   * Clean up resources and close connections
   */
  async disconnect(): Promise<void> {
    if (this.sftpClient) {
      await this.sftpClient.end();
    }
  }

  // === Robot API Management Methods ===

  /**
   * Get list of all storage boxes (requires Robot API credentials)
   */
  async listStorageBoxes(): Promise<StorageBoxDetails[]> {
    if (!this.robotClient) {
      throw new Error(
        'Robot API credentials not provided. Set robotUsername and robotPassword in config.'
      );
    }
    return await this.robotClient.listStorageBoxes();
  }

  /**
   * Get details for the configured storage box (requires Robot API credentials and storageBoxId)
   */
  async getStorageBoxDetails(): Promise<StorageBoxDetails> {
    if (!this.robotClient) {
      throw new Error(
        'Robot API credentials not provided. Set robotUsername and robotPassword in config.'
      );
    }
    if (!this._config.storageBoxId) {
      throw new Error('storageBoxId not provided in config');
    }
    return await this.robotClient.getStorageBox(this._config.storageBoxId);
  }

  /**
   * Toggle services (SSH, Samba, WebDAV) on the storage box
   */
  async toggleServices(
    services: StorageBoxServiceToggle
  ): Promise<StorageBoxDetails> {
    if (!this.robotClient) {
      throw new Error(
        'Robot API credentials not provided. Set robotUsername and robotPassword in config.'
      );
    }
    if (!this._config.storageBoxId) {
      throw new Error('storageBoxId not provided in config');
    }
    return await this.robotClient.toggleServices(
      this._config.storageBoxId,
      services
    );
  }

  /**
   * Create a filesystem snapshot
   */
  async createSnapshot(comment?: string): Promise<SnapshotInfo> {
    if (!this.robotClient) {
      throw new Error(
        'Robot API credentials not provided. Set robotUsername and robotPassword in config.'
      );
    }
    if (!this._config.storageBoxId) {
      throw new Error('storageBoxId not provided in config');
    }
    return await this.robotClient.createSnapshot(
      this._config.storageBoxId,
      comment
    );
  }

  /**
   * List all snapshots
   */
  async listSnapshots(): Promise<SnapshotInfo[]> {
    if (!this.robotClient) {
      throw new Error(
        'Robot API credentials not provided. Set robotUsername and robotPassword in config.'
      );
    }
    if (!this._config.storageBoxId) {
      throw new Error('storageBoxId not provided in config');
    }
    return await this.robotClient.listSnapshots(this._config.storageBoxId);
  }

  /**
   * Delete a snapshot
   */
  async deleteSnapshot(snapshotName: string): Promise<void> {
    if (!this.robotClient) {
      throw new Error(
        'Robot API credentials not provided. Set robotUsername and robotPassword in config.'
      );
    }
    if (!this._config.storageBoxId) {
      throw new Error('storageBoxId not provided in config');
    }
    return await this.robotClient.deleteSnapshot(
      this._config.storageBoxId,
      snapshotName
    );
  }

  /**
   * Revert to a specific snapshot
   */
  async revertToSnapshot(snapshotName: string): Promise<void> {
    if (!this.robotClient) {
      throw new Error(
        'Robot API credentials not provided. Set robotUsername and robotPassword in config.'
      );
    }
    if (!this._config.storageBoxId) {
      throw new Error('storageBoxId not provided in config');
    }
    return await this.robotClient.revertToSnapshot(
      this._config.storageBoxId,
      snapshotName
    );
  }
}
