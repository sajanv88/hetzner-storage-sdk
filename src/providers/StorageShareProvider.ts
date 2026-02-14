import { createReadStream, createWriteStream } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { type FileStat, type WebDAVClient, createClient } from 'webdav';
import type {
    CreateShareOptions,
    DownloadOptions,
    FileMetadata,
    OCSShareData,
    StorageShareConfig,
    UploadOptions,
} from '../types';
import { OcsApiClient } from '../utils/OcsApiClient';
import { BaseStorageProvider } from './BaseStorageProvider';

const pipelineAsync = promisify(pipeline);

/**
 * Provider for Hetzner Storage Share (Nextcloud-based)
 * Uses WebDAV for file operations and OCS API for sharing
 */
export class StorageShareProvider extends BaseStorageProvider {
    private _config: StorageShareConfig;
    private webdavClient: WebDAVClient | null = null;
    private ocsClient: OcsApiClient;
    private baseUrl: string;

    constructor(config: StorageShareConfig) {
        super(config);
        this._config = config;
        this.baseUrl = `https://${this._config.instance}.your-storageshare.de`;

        // Initialize WebDAV client
        this.initializeWebDAV();

        // Initialize OCS API client
        this.ocsClient = new OcsApiClient(
            this._config.instance,
            this._config.username,
            this._config.password
        );
    }

    /**
     * Initialize WebDAV client for Nextcloud
     */
    private initializeWebDAV(): void {
        const webdavUrl = `${this.baseUrl}/remote.php/dav/files/${this._config.username}/`;
        this.webdavClient = createClient(webdavUrl, {
            username: this._config.username,
            password: this._config.password,
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
    async listFiles(remotePath = '/'): Promise<FileMetadata[]> {
        if (!this.webdavClient) {
            throw new Error('WebDAV client not initialized');
        }
        const contents = await this.webdavClient.getDirectoryContents(remotePath);
        return (contents as FileStat[]).map((item) => this.convertWebDAVStat(item));
    }

    /**
     * Upload a file to the storage
     */
    async uploadFile(
        localPath: string | Buffer | Readable,
        remotePath: string,
        options?: UploadOptions
    ): Promise<void> {
        let content: Buffer | Readable;

        if (typeof localPath === 'string') {
            content = createReadStream(localPath);
        } else {
            content = localPath;
        }

        if (!this.webdavClient) {
            throw new Error('WebDAV client not initialized');
        }

        await this.webdavClient.putFileContents(remotePath, content, {
            overwrite: options?.overwrite ?? true,
            contentLength: content instanceof Buffer ? content.length : undefined,
            headers: options?.contentType ? { 'Content-Type': options.contentType } : undefined,
        });
    }

    /**
     * Download a file from the storage
     */
    async downloadFile(
        remotePath: string,
        localPath?: string,
        options?: DownloadOptions
    ): Promise<Buffer | undefined> {
        if (!this.webdavClient) {
            throw new Error('WebDAV client not initialized');
        }

        const content = await this.webdavClient.getFileContents(remotePath);
        if (localPath) {
            // Write to file
            const buffer = content instanceof Buffer ? content : Buffer.from(content as string);
            const writeStream = createWriteStream(localPath);
            await pipelineAsync(Readable.from(buffer), writeStream);
        } else {
            // Return buffer
            return content instanceof Buffer ? content : Buffer.from(content as string);
        }
    }

    /**
     * Delete a file or directory from the storage
     */
    async deleteFile(remotePath: string): Promise<void> {
        if (!this.webdavClient) {
            throw new Error('WebDAV client not initialized');
        }
        await this.webdavClient.deleteFile(remotePath);
    }

    /**
     * Create a directory
     */
    async createDirectory(remotePath: string): Promise<void> {
        if (!this.webdavClient) {
            throw new Error('WebDAV client not initialized');
        }
        await this.webdavClient.createDirectory(remotePath);
    }

    /**
     * Move or rename a file/directory
     */
    async moveFile(fromPath: string, toPath: string): Promise<void> {
        if (!this.webdavClient) {
            throw new Error('WebDAV client not initialized');
        }
        await this.webdavClient.moveFile(fromPath, toPath);
    }

    /**
     * Copy a file/directory
     */
    async copyFile(fromPath: string, toPath: string): Promise<void> {
        if (!this.webdavClient) {
            throw new Error('WebDAV client not initialized');
        }
        await this.webdavClient.copyFile(fromPath, toPath);
    }

    /**
     * Check if a file or directory exists
     */
    async exists(remotePath: string): Promise<boolean> {
        if (!this.webdavClient) {
            throw new Error('WebDAV client not initialized');
        }
        return await this.webdavClient.exists(remotePath);
    }

    /**
     * Get metadata for a specific file or directory
     */
    async getMetadata(remotePath: string): Promise<FileMetadata> {
        if (!this.webdavClient) {
            throw new Error('WebDAV client not initialized');
        }
        const stat = (await this.webdavClient.stat(remotePath)) as FileStat;
        return this.convertWebDAVStat(stat);
    }

    /**
     * Get the provider type
     */
    getProviderType(): 'share' {
        return 'share';
    }

    /**
     * Clean up resources and close connections
     */
    async disconnect(): Promise<void> {
        // WebDAV client doesn't need explicit cleanup
    }

    // === OCS API Share Management Methods ===

    /**
     * Create a public link share for a file or folder
     * @param path - Path to the file or folder
     * @param password - Optional password protection
     * @param expireDate - Optional expiration date (YYYY-MM-DD)
     * @param permissions - Optional permissions (default: 1 = read)
     */
    async createPublicShare(
        path: string,
        password?: string,
        expireDate?: string,
        permissions = 1
    ): Promise<OCSShareData> {
        return await this.ocsClient.createShare({
            path,
            shareType: 3, // Public link
            password,
            expireDate,
            permissions,
        });
    }

    /**
     * Create a user share
     * @param path - Path to the file or folder
     * @param shareWith - Username to share with
     * @param permissions - Permissions (default: 1 = read)
     */
    async createUserShare(path: string, shareWith: string, permissions = 1): Promise<OCSShareData> {
        return await this.ocsClient.createShare({
            path,
            shareType: 0, // User
            shareWith,
            permissions,
        });
    }

    /**
     * Create a group share
     * @param path - Path to the file or folder
     * @param shareWith - Group name to share with
     * @param permissions - Permissions (default: 1 = read)
     */
    async createGroupShare(
        path: string,
        shareWith: string,
        permissions = 1
    ): Promise<OCSShareData> {
        return await this.ocsClient.createShare({
            path,
            shareType: 1, // Group
            shareWith,
            permissions,
        });
    }

    /**
     * Create a share with full options
     */
    async createShare(options: CreateShareOptions): Promise<OCSShareData> {
        return await this.ocsClient.createShare(options);
    }

    /**
     * List all active shares
     */
    async listShares(): Promise<OCSShareData[]> {
        return await this.ocsClient.listShares();
    }

    /**
     * Get details of a specific share
     */
    async getShare(shareId: string): Promise<OCSShareData> {
        return await this.ocsClient.getShare(shareId);
    }

    /**
     * Update an existing share
     */
    async updateShare(
        shareId: string,
        options: Partial<CreateShareOptions>
    ): Promise<OCSShareData> {
        return await this.ocsClient.updateShare(shareId, options);
    }

    /**
     * Delete a share
     */
    async deleteShare(shareId: string): Promise<void> {
        return await this.ocsClient.deleteShare(shareId);
    }

    /**
     * Get all shares for a specific file or folder
     */
    async getSharesForPath(path: string): Promise<OCSShareData[]> {
        return await this.ocsClient.getSharesForPath(path);
    }
}
