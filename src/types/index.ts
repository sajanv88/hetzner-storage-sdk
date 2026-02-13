/**
 * Storage provider types
 */
export type StorageProviderType = 'box' | 'share' | 'object';

/**
 * Protocol types for Storage Box
 */
export type StorageBoxProtocol = 'webdav';

/**
 * Base configuration for all storage providers
 */
export interface BaseStorageConfig {
  username: string;
  password: string;
}

/**
 * Configuration for Storage Box
 */
export interface StorageBoxConfig extends BaseStorageConfig {
  type: 'box';
  storageBoxId?: string; // Optional: for specific box operations
  protocol?: StorageBoxProtocol; // Default: 'webdav'
  robotUsername?: string; // Robot API credentials (if different from storage user)
  robotPassword?: string; // Robot API credentials
}

/**
 * Configuration for Storage Share (Nextcloud)
 */
export interface StorageShareConfig extends BaseStorageConfig {
  type: 'share';
  instance: string; // e.g., 'u123456' for u123456.your-storageshare.de
}

/**
 * Region options for Hetzner Object Storage
 */
export type ObjectStorageRegion = 'fsn1' | 'nbg1' | 'hel1';

/**
 * Configuration for Object Storage (S3-compatible)
 */
export interface ObjectStorageConfig {
  type: 'object';
  accessKeyId: string;
  secretAccessKey: string;
  region: ObjectStorageRegion;
  bucket: string;
}

/**
 * Bucket information
 */
export interface BucketInfo {
  name: string;
  creationDate?: Date;
}

/**
 * Options for generating presigned URLs
 */
export interface PresignedUrlOptions {
  expiresIn?: number;
  contentType?: string;
}

/**
 * Multipart upload information
 */
export interface MultipartUploadInfo {
  uploadId: string;
  key: string;
  bucket: string;
}

/**
 * Completed part information for multipart uploads
 */
export interface CompletedPart {
  partNumber: number;
  etag: string;
}

/**
 * Options for listing objects
 */
export interface ListObjectsOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
}

/**
 * Result of listing objects
 */
export interface ListObjectsResult {
  files: FileMetadata[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

/**
 * Union type for all storage configurations
 */
export type StorageConfig = StorageBoxConfig | StorageShareConfig | ObjectStorageConfig;

/**
 * File metadata returned by listing operations
 */
export interface FileMetadata {
  filename: string;
  path: string;
  size: number;
  lastModified: Date;
  type: 'file' | 'directory';
  etag?: string;
  mime?: string;
}

/**
 * Upload options
 */
export interface UploadOptions {
  overwrite?: boolean;
  contentType?: string;
}

/**
 * Download options
 */
export interface DownloadOptions {
  range?: {
    start: number;
    end: number;
  };
}

/**
 * Storage Box details from Robot API
 */
export interface StorageBoxDetails {
  id: number;
  name: string;
  product: string;
  cancelled: boolean;
  locked: boolean;
  location: string;
  linked_server?: number;
  paid_until: string;
  disk_quota: number;
  disk_usage: number;
  disk_usage_data: number;
  disk_usage_snapshots: number;
  webdav: boolean;
  samba: boolean;
  ssh: boolean;
  external_reachability: boolean;
  zfs: boolean;
  server?: string;
  host_system?: string;
}

/**
 * Storage Box list response
 */
export interface StorageBoxListResponse {
  storagebox: StorageBoxDetails[];
}

/**
 * Snapshot information
 */
export interface SnapshotInfo {
  name: string;
  created: string;
  comment?: string;
}

/**
 * Snapshot list response
 */
export interface SnapshotListResponse {
  snapshot: SnapshotInfo[];
}

/**
 * Service toggle options for Storage Box
 */
export interface StorageBoxServiceToggle {
  webdav?: boolean;
  samba?: boolean;
  ssh?: boolean;
  external_reachability?: boolean;
}

/**
 * OCS Share response (Nextcloud)
 */
export interface OCSShareResponse {
  ocs: {
    meta: {
      status: string;
      statuscode: number;
      message: string;
    };
    data: OCSShareData | OCSShareData[];
  };
}

/**
 * OCS Share data structure
 */
export interface OCSShareData {
  id: string;
  share_type: number;
  uid_owner: string;
  displayname_owner: string;
  permissions: number;
  can_edit: boolean;
  can_delete: boolean;
  stime: number;
  parent: string | null;
  expiration: string | null;
  token: string;
  uid_file_owner: string;
  note: string;
  label: string;
  displayname_file_owner: string;
  path: string;
  item_type: string;
  mimetype: string;
  storage_id: string;
  storage: number;
  item_source: number;
  file_source: number;
  file_parent: number;
  file_target: string;
  share_with?: string;
  share_with_displayname?: string;
  password?: string;
  send_password_by_talk?: boolean;
  url?: string;
  mail_send: number;
  hide_download: number;
}

/**
 * Options for creating a share
 */
export interface CreateShareOptions {
  path: string;
  shareType: 0 | 1 | 3; // 0: user, 1: group, 3: public link
  shareWith?: string; // Required for user/group shares
  permissions?: number; // 1: read, 2: update, 4: create, 8: delete, 16: share, 31: all
  password?: string;
  expireDate?: string; // YYYY-MM-DD
  note?: string;
  label?: string;
}

/**
 * Error response structure
 */
export interface StorageError extends Error {
  code?: string;
  statusCode?: number;
  response?: any;
}
