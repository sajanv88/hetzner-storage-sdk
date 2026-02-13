/**
 * Hetzner Storage SDK
 *
 * A TypeScript SDK for interacting with Hetzner Storage Box, Storage Share, and Object Storage
 *
 * @packageDocumentation
 */

export { HetznerStorageClient } from './HetznerStorageClient';
export { BaseStorageProvider } from './providers/BaseStorageProvider';
export { StorageBoxProvider } from './providers/StorageBoxProvider';
export { StorageShareProvider } from './providers/StorageShareProvider';
export { ObjectStorageProvider } from './providers/ObjectStorageProvider';

// Export all types
export * from './types';

// Export utility clients for advanced usage
export { RobotApiClient } from './utils/RobotApiClient';
export { OcsApiClient } from './utils/OcsApiClient';
export { S3ApiClient } from './utils/S3ApiClient';

// Export environment configuration utilities
export {
  STORAGE_BOX_ENV,
  STORAGE_SHARE_ENV,
  OBJECT_STORAGE_ENV,
  loadStorageBoxEnv,
  loadStorageShareEnv,
  loadObjectStorageEnv,
} from './utils/env-config';

/**
 * Default export is the HetznerStorageClient factory
 */
export { HetznerStorageClient as default } from './HetznerStorageClient';
