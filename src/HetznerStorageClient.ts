import { BaseStorageProvider } from './providers/BaseStorageProvider';
import { ObjectStorageProvider } from './providers/ObjectStorageProvider';
import { StorageBoxProvider } from './providers/StorageBoxProvider';
import { StorageShareProvider } from './providers/StorageShareProvider';
import type {
    ObjectStorageConfig,
    StorageBoxConfig,
    StorageConfig,
    StorageShareConfig,
} from './types';
import {
    loadObjectStorageEnv,
    loadStorageBoxEnv,
    loadStorageShareEnv,
    mergeWithEnv,
} from './utils/env-config';

/**
 * Factory class for creating Hetzner Storage clients
 *
 * This class implements the Factory pattern to instantiate the appropriate
 * storage provider based on the configuration.
 *
 * Configuration can be provided explicitly or loaded from environment variables.
 * Explicit configuration takes precedence over environment variables.
 *
 * Environment Variables:
 * - Storage Box:
 *   - HETZNER_STORAGE_BOX_USERNAME
 *   - HETZNER_STORAGE_BOX_PASSWORD
 *   - HETZNER_STORAGE_BOX_PROTOCOL (optional: webdav)
 *   - HETZNER_STORAGE_BOX_ID (optional)
 *   - HETZNER_ROBOT_USERNAME (optional)
 *   - HETZNER_ROBOT_PASSWORD (optional)
 *
 * - Storage Share:
 *   - HETZNER_STORAGE_SHARE_USERNAME
 *   - HETZNER_STORAGE_SHARE_PASSWORD
 *   - HETZNER_STORAGE_SHARE_INSTANCE
 *
 * - Object Storage:
 *   - HETZNER_OBJECT_STORAGE_ACCESS_KEY_ID
 *   - HETZNER_OBJECT_STORAGE_SECRET_ACCESS_KEY
 *   - HETZNER_OBJECT_STORAGE_REGION
 *   - HETZNER_OBJECT_STORAGE_BUCKET
 *
 * Usage:
 * ```typescript
 * // Using explicit configuration
 * const client = HetznerStorageClient.create({
 *   type: 'box',
 *   username: 'u123456',
 *   password: 'your-password',
 * });
 *
 * // Using environment variables (set env vars first)
 * const client = HetznerStorageClient.create({ type: 'box' });
 *
 * // Mixed: override specific values while loading others from env
 * const client = HetznerStorageClient.create({
 *   type: 'object',
 *   bucket: 'my-custom-bucket' // Other fields loaded from env
 * });
 * ```
 */
export class HetznerStorageClient {
    /**
     * Create a new storage client based on the provided configuration
     *
     * Configuration values can be provided explicitly or loaded from environment variables.
     * Explicitly provided values take precedence over environment variables.
     *
     * @param config - Storage configuration object (partial config allowed if env vars are set)
     * @returns An instance of the appropriate storage provider
     * @throws Error if the storage type is invalid or required configuration is missing
     */
    static create(
        config: Partial<StorageConfig> & { type: StorageConfig['type'] }
    ): BaseStorageProvider {
        if (!config.type) {
            throw new Error('Storage type is required in configuration');
        }

        switch (config.type) {
            case 'box': {
                const envConfig = loadStorageBoxEnv();
                const mergedConfig = mergeWithEnv(config, envConfig) as StorageBoxConfig;

                if (!mergedConfig.username || !mergedConfig.password) {
                    throw new Error(
                        'Username and password are required for Storage Box. Provide them in config or set HETZNER_STORAGE_BOX_USERNAME and HETZNER_STORAGE_BOX_PASSWORD environment variables.'
                    );
                }
                return new StorageBoxProvider(mergedConfig);
            }

            case 'share': {
                const envConfig = loadStorageShareEnv();
                const mergedConfig = mergeWithEnv(config, envConfig) as StorageShareConfig;

                if (!mergedConfig.username || !mergedConfig.password) {
                    throw new Error(
                        'Username and password are required for Storage Share. Provide them in config or set HETZNER_STORAGE_SHARE_USERNAME and HETZNER_STORAGE_SHARE_PASSWORD environment variables.'
                    );
                }
                if (!mergedConfig.instance) {
                    throw new Error(
                        'Instance is required for Storage Share. Provide it in config or set HETZNER_STORAGE_SHARE_INSTANCE environment variable.'
                    );
                }
                return new StorageShareProvider(mergedConfig);
            }

            case 'object': {
                const envConfig = loadObjectStorageEnv();
                const mergedConfig = mergeWithEnv(config, envConfig) as ObjectStorageConfig;

                if (!mergedConfig.accessKeyId || !mergedConfig.secretAccessKey) {
                    throw new Error(
                        'accessKeyId and secretAccessKey are required for Object Storage. Provide them in config or set HETZNER_OBJECT_STORAGE_ACCESS_KEY_ID and HETZNER_OBJECT_STORAGE_SECRET_ACCESS_KEY environment variables.'
                    );
                }
                if (!mergedConfig.region) {
                    throw new Error(
                        'Region is required for Object Storage. Provide it in config or set HETZNER_OBJECT_STORAGE_REGION environment variable.'
                    );
                }
                if (!mergedConfig.bucket) {
                    throw new Error(
                        'Bucket is required for Object Storage. Provide it in config or set HETZNER_OBJECT_STORAGE_BUCKET environment variable.'
                    );
                }
                return new ObjectStorageProvider(mergedConfig);
            }

            default:
                throw new Error(
                    `Invalid storage type: ${(config as any).type}. Must be 'box', 'share', or 'object'.`
                );
        }
    }

    /**
     * Create a Storage Box client
     * Convenience method for creating a Storage Box provider
     *
     * Configuration values can be provided explicitly or loaded from environment variables.
     *
     * @param config - Storage Box configuration (optional if env vars are set)
     * @returns StorageBoxProvider instance
     */
    static createBoxClient(
        config: Partial<Omit<StorageBoxConfig, 'type'>> = {}
    ): StorageBoxProvider {
        const envConfig = loadStorageBoxEnv();
        const mergedConfig = mergeWithEnv(
            { ...config, type: 'box' as const },
            envConfig
        ) as StorageBoxConfig;

        if (!mergedConfig.username || !mergedConfig.password) {
            throw new Error(
                'Username and password are required for Storage Box. Provide them in config or set HETZNER_STORAGE_BOX_USERNAME and HETZNER_STORAGE_BOX_PASSWORD environment variables.'
            );
        }

        return new StorageBoxProvider(mergedConfig);
    }

    /**
     * Create a Storage Share client
     * Convenience method for creating a Storage Share provider
     *
     * Configuration values can be provided explicitly or loaded from environment variables.
     *
     * @param config - Storage Share configuration (optional if env vars are set)
     * @returns StorageShareProvider instance
     */
    static createShareClient(
        config: Partial<Omit<StorageShareConfig, 'type'>> = {}
    ): StorageShareProvider {
        const envConfig = loadStorageShareEnv();
        const mergedConfig = mergeWithEnv(
            { ...config, type: 'share' as const },
            envConfig
        ) as StorageShareConfig;

        if (!mergedConfig.username || !mergedConfig.password) {
            throw new Error(
                'Username and password are required for Storage Share. Provide them in config or set HETZNER_STORAGE_SHARE_USERNAME and HETZNER_STORAGE_SHARE_PASSWORD environment variables.'
            );
        }

        if (!mergedConfig.instance) {
            throw new Error(
                'Instance is required for Storage Share. Provide it in config or set HETZNER_STORAGE_SHARE_INSTANCE environment variable.'
            );
        }

        return new StorageShareProvider(mergedConfig);
    }

    /**
     * Create an Object Storage client
     * Convenience method for creating an Object Storage provider
     *
     * Configuration values can be provided explicitly or loaded from environment variables.
     *
     * @param config - Object Storage configuration (optional if env vars are set)
     * @returns ObjectStorageProvider instance
     */
    static createObjectClient(
        config: Partial<Omit<ObjectStorageConfig, 'type'>> = {}
    ): ObjectStorageProvider {
        const envConfig = loadObjectStorageEnv();
        const mergedConfig = mergeWithEnv(
            { ...config, type: 'object' as const },
            envConfig
        ) as ObjectStorageConfig;

        if (!mergedConfig.accessKeyId || !mergedConfig.secretAccessKey) {
            throw new Error(
                'accessKeyId and secretAccessKey are required for Object Storage. Provide them in config or set HETZNER_OBJECT_STORAGE_ACCESS_KEY_ID and HETZNER_OBJECT_STORAGE_SECRET_ACCESS_KEY environment variables.'
            );
        }

        if (!mergedConfig.region) {
            throw new Error(
                'Region is required for Object Storage. Provide it in config or set HETZNER_OBJECT_STORAGE_REGION environment variable.'
            );
        }

        if (!mergedConfig.bucket) {
            throw new Error(
                'Bucket is required for Object Storage. Provide it in config or set HETZNER_OBJECT_STORAGE_BUCKET environment variable.'
            );
        }

        return new ObjectStorageProvider(mergedConfig);
    }
}

/**
 * Re-export for convenience
 */
export { BaseStorageProvider, StorageBoxProvider, StorageShareProvider, ObjectStorageProvider };
export * from './types';
