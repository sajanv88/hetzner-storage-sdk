import { Readable } from 'stream';
import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ObjectStorageRegion,
  BucketInfo,
  FileMetadata,
  PresignedUrlOptions,
  MultipartUploadInfo,
  CompletedPart,
  ListObjectsOptions,
  ListObjectsResult,
  StorageError,
} from '../types';

/**
 * Client for interacting with Hetzner Object Storage (S3-compatible)
 */
export class S3ApiClient {
  private s3Client: S3Client;

  constructor(accessKeyId: string, secretAccessKey: string, region: ObjectStorageRegion) {
    this.s3Client = new S3Client({
      endpoint: `https://${region}.your-objectstorage.com`,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  private handleError(error: unknown): never {
    const storageError: StorageError = new Error(
      error instanceof Error ? error.message : String(error)
    );
    if (error && typeof error === 'object') {
      storageError.code = (error as any).Code || (error as any).name;
      storageError.statusCode = (error as any).$metadata?.httpStatusCode;
      storageError.response = (error as any).$metadata;
    }
    throw storageError;
  }

  // === Bucket Operations ===

  async listBuckets(): Promise<BucketInfo[]> {
    try {
      const response = await this.s3Client.send(new ListBucketsCommand({}));
      return (response.Buckets || []).map((bucket) => ({
        name: bucket.Name!,
        creationDate: bucket.CreationDate,
      }));
    } catch (error) {
      this.handleError(error);
    }
  }

  async createBucket(name: string): Promise<void> {
    try {
      await this.s3Client.send(new CreateBucketCommand({ Bucket: name }));
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteBucket(name: string): Promise<void> {
    try {
      await this.s3Client.send(new DeleteBucketCommand({ Bucket: name }));
    } catch (error) {
      this.handleError(error);
    }
  }

  async bucketExists(name: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: name }));
      return true;
    } catch (error) {
      if ((error as any).$metadata?.httpStatusCode === 404 || (error as any).name === 'NotFound') {
        return false;
      }
      this.handleError(error);
    }
  }

  // === Object Operations ===

  async listObjects(bucket: string, options?: ListObjectsOptions): Promise<ListObjectsResult> {
    try {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: options?.prefix,
          Delimiter: options?.delimiter,
          MaxKeys: options?.maxKeys,
          ContinuationToken: options?.continuationToken,
        })
      );

      const files: FileMetadata[] = [];

      // Add common prefixes as directories
      if (response.CommonPrefixes) {
        for (const prefix of response.CommonPrefixes) {
          if (prefix.Prefix) {
            const name = prefix.Prefix.replace(/\/$/, '').split('/').pop() || prefix.Prefix;
            files.push({
              filename: name,
              path: prefix.Prefix,
              size: 0,
              lastModified: new Date(),
              type: 'directory',
            });
          }
        }
      }

      // Add objects as files
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key) {
            const filename = obj.Key.split('/').pop() || obj.Key;
            // Skip directory markers
            if (obj.Key.endsWith('/') && obj.Size === 0) {
              files.push({
                filename: filename || obj.Key.replace(/\/$/, '').split('/').pop() || obj.Key,
                path: obj.Key,
                size: 0,
                lastModified: obj.LastModified || new Date(),
                type: 'directory',
              });
            } else {
              files.push({
                filename,
                path: obj.Key,
                size: obj.Size || 0,
                lastModified: obj.LastModified || new Date(),
                type: 'file',
                etag: obj.ETag?.replace(/"/g, ''),
              });
            }
          }
        }
      }

      return {
        files,
        isTruncated: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async putObject(bucket: string, key: string, body: Buffer | Readable, contentType?: string): Promise<void> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async getObject(bucket: string, key: string, range?: string): Promise<Readable> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          Range: range,
        })
      );
      return response.Body as Readable;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteObjects(bucket: string, keys: string[]): Promise<void> {
    try {
      // Process in batches of 1000 (S3 limit)
      for (let i = 0; i < keys.length; i += 1000) {
        const batch = keys.slice(i, i + 1000);
        await this.s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
              Quiet: true,
            },
          })
        );
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async headObject(bucket: string, key: string): Promise<FileMetadata> {
    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      const filename = key.split('/').pop() || key;
      const isDirectory = key.endsWith('/') && response.ContentLength === 0;

      return {
        filename,
        path: key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        type: isDirectory ? 'directory' : 'file',
        etag: response.ETag?.replace(/"/g, ''),
        mime: response.ContentType,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async copyObject(bucket: string, sourceKey: string, destKey: string, sourceBucket?: string): Promise<void> {
    try {
      const copySource = `${sourceBucket || bucket}/${sourceKey}`;
      await this.s3Client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: copySource,
          Key: destKey,
        })
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  // === Presigned URLs ===

  async getPresignedDownloadUrl(bucket: string, key: string, options?: PresignedUrlOptions): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, {
        expiresIn: options?.expiresIn || 3600,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPresignedUploadUrl(bucket: string, key: string, options?: PresignedUrlOptions): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: options?.contentType,
      });
      return await getSignedUrl(this.s3Client, command, {
        expiresIn: options?.expiresIn || 3600,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // === Multipart Uploads ===

  async createMultipartUpload(bucket: string, key: string, contentType?: string): Promise<MultipartUploadInfo> {
    try {
      const response = await this.s3Client.send(
        new CreateMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          ContentType: contentType,
        })
      );
      return {
        uploadId: response.UploadId!,
        key,
        bucket,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async uploadPart(
    bucket: string,
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer
  ): Promise<CompletedPart> {
    try {
      const response = await this.s3Client.send(
        new UploadPartCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: body,
        })
      );
      return {
        partNumber,
        etag: response.ETag!,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async completeMultipartUpload(
    bucket: string,
    key: string,
    uploadId: string,
    parts: CompletedPart[]
  ): Promise<void> {
    try {
      await this.s3Client.send(
        new CompleteMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts.map((part) => ({
              PartNumber: part.partNumber,
              ETag: part.etag,
            })),
          },
        })
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async abortMultipartUpload(bucket: string, key: string, uploadId: string): Promise<void> {
    try {
      await this.s3Client.send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
        })
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  // === Cleanup ===

  destroy(): void {
    this.s3Client.destroy();
  }
}
