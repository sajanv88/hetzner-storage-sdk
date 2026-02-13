import { createReadStream, createWriteStream } from 'fs';
import { Readable } from 'stream';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { BaseStorageProvider } from './BaseStorageProvider';
import { S3ApiClient } from '../utils/S3ApiClient';
import {
  ObjectStorageConfig,
  FileMetadata,
  UploadOptions,
  DownloadOptions,
  BucketInfo,
  PresignedUrlOptions,
  MultipartUploadInfo,
  CompletedPart,
  ListObjectsOptions,
  ListObjectsResult,
} from '../types';

const pipelineAsync = promisify(pipeline);

/**
 * Provider for Hetzner Object Storage (S3-compatible)
 * Uses AWS SDK S3 client for all operations
 */
export class ObjectStorageProvider extends BaseStorageProvider {
  private _config: ObjectStorageConfig;
  private s3Client: S3ApiClient;
  private defaultBucket: string;
  private initPromise: Promise<void>;

  constructor(config: ObjectStorageConfig) {
    super(config);
    this._config = config;
    this.defaultBucket = config.bucket;
    this.s3Client = new S3ApiClient(
      config.accessKeyId,
      config.secretAccessKey,
      config.region
    );

    // Initialize bucket - create if it doesn't exist
    this.initPromise = this.ensureBucketExists();
  }

  /**
   * Ensure the default bucket exists, creating it if necessary
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.s3Client.bucketExists(this.defaultBucket);
      if (!exists) {
        await this.s3Client.createBucket(this.defaultBucket);
      }
    } catch (error) {
      // If bucket creation fails, we'll let subsequent operations fail with meaningful errors
      console.warn(`Failed to ensure bucket ${this.defaultBucket} exists:`, error);
    }
  }

  /**
   * Wait for initialization to complete
   */
  private async ensureInitialized(): Promise<void> {
    await this.initPromise;
  }

  /**
   * Normalize a remote path to an S3 key by stripping leading slashes
   */
  private normalizeKey(remotePath: string): string {
    return remotePath.replace(/^\/+/, '');
  }

  /**
   * List files and directories at the specified path
   */
  async listFiles(remotePath: string = '/'): Promise<FileMetadata[]> {
    await this.ensureInitialized();

    let prefix = this.normalizeKey(remotePath);
    if (prefix && !prefix.endsWith('/')) {
      prefix += '/';
    }

    const result = await this.s3Client.listObjects(this.defaultBucket, {
      prefix: prefix || undefined,
      delimiter: '/',
    });

    return result.files;
  }

  /**
   * Upload a file to the storage
   */
  async uploadFile(
    localPath: string | Buffer | Readable,
    remotePath: string,
    options?: UploadOptions
  ): Promise<void> {
    await this.ensureInitialized();

    const key = this.normalizeKey(remotePath);

    let body: Buffer | Readable;
    if (typeof localPath === 'string') {
      body = createReadStream(localPath);
    } else {
      body = localPath;
    }

    await this.s3Client.putObject(
      this.defaultBucket,
      key,
      body,
      options?.contentType
    );
  }

  /**
   * Download a file from the storage
   */
  async downloadFile(
    remotePath: string,
    localPath?: string,
    options?: DownloadOptions
  ): Promise<Buffer | void> {
    await this.ensureInitialized();

    const key = this.normalizeKey(remotePath);

    let range: string | undefined;
    if (options?.range) {
      range = `bytes=${options.range.start}-${options.range.end}`;
    }

    const stream = await this.s3Client.getObject(this.defaultBucket, key, range);

    if (localPath) {
      const writeStream = createWriteStream(localPath);
      await pipelineAsync(stream, writeStream);
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      return Buffer.concat(chunks);
    }
  }

  /**
   * Delete a file or directory from the storage
   */
  async deleteFile(remotePath: string): Promise<void> {
    await this.ensureInitialized();

    const key = this.normalizeKey(remotePath);

    // Check if this is a directory (prefix with children)
    const result = await this.s3Client.listObjects(this.defaultBucket, {
      prefix: key.endsWith('/') ? key : key + '/',
      maxKeys: 1,
    });

    if (result.files.length > 0) {
      // It's a directory prefix — delete all objects under it
      let continuationToken: string | undefined;
      const allKeys: string[] = [];

      do {
        const batch = await this.s3Client.listObjects(this.defaultBucket, {
          prefix: key.endsWith('/') ? key : key + '/',
          continuationToken,
        });
        allKeys.push(...batch.files.map((f) => f.path));
        continuationToken = batch.nextContinuationToken;
      } while (continuationToken);

      if (allKeys.length > 0) {
        await this.s3Client.deleteObjects(this.defaultBucket, allKeys);
      }
    } else {
      // It's a single object
      await this.s3Client.deleteObject(this.defaultBucket, key);
    }
  }

  /**
   * Create a directory (S3 directory marker)
   */
  async createDirectory(remotePath: string): Promise<void> {
    await this.ensureInitialized();

    let key = this.normalizeKey(remotePath);
    if (!key.endsWith('/')) {
      key += '/';
    }
    await this.s3Client.putObject(this.defaultBucket, key, Buffer.alloc(0));
  }

  /**
   * Move or rename a file (copy + delete, since S3 has no native move)
   */
  async moveFile(fromPath: string, toPath: string): Promise<void> {
    await this.ensureInitialized();

    const sourceKey = this.normalizeKey(fromPath);
    const destKey = this.normalizeKey(toPath);
    await this.s3Client.copyObject(this.defaultBucket, sourceKey, destKey);
    await this.s3Client.deleteObject(this.defaultBucket, sourceKey);
  }

  /**
   * Copy a file
   */
  async copyFile(fromPath: string, toPath: string): Promise<void> {
    await this.ensureInitialized();

    const sourceKey = this.normalizeKey(fromPath);
    const destKey = this.normalizeKey(toPath);
    await this.s3Client.copyObject(this.defaultBucket, sourceKey, destKey);
  }

  /**
   * Check if a file or directory exists
   */
  async exists(remotePath: string): Promise<boolean> {
    await this.ensureInitialized();

    const key = this.normalizeKey(remotePath);

    // Check for exact object
    try {
      await this.s3Client.headObject(this.defaultBucket, key);
      return true;
    } catch {
      // Not found as an object, check as a prefix
    }

    // Check as a directory prefix
    const prefixKey = key.endsWith('/') ? key : key + '/';
    const result = await this.s3Client.listObjects(this.defaultBucket, {
      prefix: prefixKey,
      maxKeys: 1,
    });

    return result.files.length > 0;
  }

  /**
   * Get metadata for a specific file or directory
   */
  async getMetadata(remotePath: string): Promise<FileMetadata> {
    await this.ensureInitialized();

    const key = this.normalizeKey(remotePath);
    return await this.s3Client.headObject(this.defaultBucket, key);
  }

  /**
   * Get the provider type
   */
  getProviderType(): 'object' {
    return 'object';
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    this.s3Client.destroy();
  }

  // === Bucket Management ===

  /**
   * List all buckets
   */
  async listBuckets(): Promise<BucketInfo[]> {
    return await this.s3Client.listBuckets();
  }

  /**
   * Create a new bucket
   */
  async createBucket(name: string): Promise<void> {
    return await this.s3Client.createBucket(name);
  }

  /**
   * Delete a bucket
   */
  async deleteBucket(name: string): Promise<void> {
    return await this.s3Client.deleteBucket(name);
  }

  /**
   * Check if a bucket exists
   */
  async bucketExists(name: string): Promise<boolean> {
    return await this.s3Client.bucketExists(name);
  }

  // === Presigned URLs ===

  /**
   * Generate a presigned download URL
   */
  async getPresignedDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    await this.ensureInitialized();

    return await this.s3Client.getPresignedDownloadUrl(
      this.defaultBucket,
      this.normalizeKey(key),
      options
    );
  }

  /**
   * Generate a presigned upload URL
   */
  async getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    await this.ensureInitialized();

    return await this.s3Client.getPresignedUploadUrl(
      this.defaultBucket,
      this.normalizeKey(key),
      options
    );
  }

  // === Multipart Uploads ===

  /**
   * Initiate a multipart upload
   */
  async createMultipartUpload(key: string, contentType?: string): Promise<MultipartUploadInfo> {
    await this.ensureInitialized();

    return await this.s3Client.createMultipartUpload(
      this.defaultBucket,
      this.normalizeKey(key),
      contentType
    );
  }

  /**
   * Upload a part of a multipart upload
   */
  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer
  ): Promise<CompletedPart> {
    await this.ensureInitialized();

    return await this.s3Client.uploadPart(
      this.defaultBucket,
      this.normalizeKey(key),
      uploadId,
      partNumber,
      body
    );
  }

  /**
   * Complete a multipart upload
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: CompletedPart[]
  ): Promise<void> {
    await this.ensureInitialized();

    return await this.s3Client.completeMultipartUpload(
      this.defaultBucket,
      this.normalizeKey(key),
      uploadId,
      parts
    );
  }

  /**
   * Abort a multipart upload
   */
  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await this.ensureInitialized();

    return await this.s3Client.abortMultipartUpload(
      this.defaultBucket,
      this.normalizeKey(key),
      uploadId
    );
  }

  // === Advanced Listing ===

  /**
   * List objects with pagination support
   */
  async listObjectsPaginated(options?: ListObjectsOptions): Promise<ListObjectsResult> {
    await this.ensureInitialized();

    return await this.s3Client.listObjects(this.defaultBucket, options);
  }
}
