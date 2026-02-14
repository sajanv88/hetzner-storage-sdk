import type {
    ObjectStorageConfig,
    ObjectStorageRegion,
    StorageBoxConfig,
    StorageBoxProtocol,
    StorageShareConfig,
} from '../types';

import { config } from 'dotenv';

config(); // Load environment variables from .env file

/**
 * Environment variable names for Storage Box configuration
 */
export const STORAGE_BOX_ENV = {
    USERNAME: 'HETZNER_STORAGE_BOX_USERNAME',
    PASSWORD: 'HETZNER_STORAGE_BOX_PASSWORD',
    PROTOCOL: 'HETZNER_STORAGE_BOX_PROTOCOL',
    STORAGE_BOX_ID: 'HETZNER_STORAGE_BOX_ID',
    ROBOT_USERNAME: 'HETZNER_ROBOT_USERNAME',
    ROBOT_PASSWORD: 'HETZNER_ROBOT_PASSWORD',
} as const;

/**
 * Environment variable names for Storage Share configuration
 */
export const STORAGE_SHARE_ENV = {
    USERNAME: 'HETZNER_STORAGE_SHARE_USERNAME',
    PASSWORD: 'HETZNER_STORAGE_SHARE_PASSWORD',
    INSTANCE: 'HETZNER_STORAGE_SHARE_INSTANCE',
} as const;

/**
 * Environment variable names for Object Storage configuration
 */
export const OBJECT_STORAGE_ENV = {
    ACCESS_KEY_ID: 'HETZNER_OBJECT_STORAGE_ACCESS_KEY_ID',
    SECRET_ACCESS_KEY: 'HETZNER_OBJECT_STORAGE_SECRET_ACCESS_KEY',
    REGION: 'HETZNER_OBJECT_STORAGE_REGION',
    BUCKET: 'HETZNER_OBJECT_STORAGE_BUCKET',
} as const;

/**
 * Load Storage Box configuration from environment variables
 */
export function loadStorageBoxEnv(): Partial<StorageBoxConfig> {
    const config: Partial<StorageBoxConfig> = {
        type: 'box',
    };

    if (process.env[STORAGE_BOX_ENV.USERNAME]) {
        config.username = process.env[STORAGE_BOX_ENV.USERNAME];
    }

    if (process.env[STORAGE_BOX_ENV.PASSWORD]) {
        config.password = process.env[STORAGE_BOX_ENV.PASSWORD];
    }

    if (process.env[STORAGE_BOX_ENV.PROTOCOL]) {
        config.protocol = process.env[STORAGE_BOX_ENV.PROTOCOL] as StorageBoxProtocol;
    }

    if (process.env[STORAGE_BOX_ENV.STORAGE_BOX_ID]) {
        config.storageBoxId = process.env[STORAGE_BOX_ENV.STORAGE_BOX_ID];
    }

    if (process.env[STORAGE_BOX_ENV.ROBOT_USERNAME]) {
        config.robotUsername = process.env[STORAGE_BOX_ENV.ROBOT_USERNAME];
    }

    if (process.env[STORAGE_BOX_ENV.ROBOT_PASSWORD]) {
        config.robotPassword = process.env[STORAGE_BOX_ENV.ROBOT_PASSWORD];
    }

    return config;
}

/**
 * Load Storage Share configuration from environment variables
 */
export function loadStorageShareEnv(): Partial<StorageShareConfig> {
    const config: Partial<StorageShareConfig> = {
        type: 'share',
    };

    if (process.env[STORAGE_SHARE_ENV.USERNAME]) {
        config.username = process.env[STORAGE_SHARE_ENV.USERNAME];
    }

    if (process.env[STORAGE_SHARE_ENV.PASSWORD]) {
        config.password = process.env[STORAGE_SHARE_ENV.PASSWORD];
    }

    if (process.env[STORAGE_SHARE_ENV.INSTANCE]) {
        config.instance = process.env[STORAGE_SHARE_ENV.INSTANCE];
    }

    return config;
}

/**
 * Load Object Storage configuration from environment variables
 */
export function loadObjectStorageEnv(): Partial<ObjectStorageConfig> {
    const config: Partial<ObjectStorageConfig> = {
        type: 'object',
    };

    if (process.env[OBJECT_STORAGE_ENV.ACCESS_KEY_ID]) {
        config.accessKeyId = process.env[OBJECT_STORAGE_ENV.ACCESS_KEY_ID];
    }

    if (process.env[OBJECT_STORAGE_ENV.SECRET_ACCESS_KEY]) {
        config.secretAccessKey = process.env[OBJECT_STORAGE_ENV.SECRET_ACCESS_KEY];
    }

    if (process.env[OBJECT_STORAGE_ENV.REGION]) {
        config.region = process.env[OBJECT_STORAGE_ENV.REGION] as ObjectStorageRegion;
    }

    if (process.env[OBJECT_STORAGE_ENV.BUCKET]) {
        config.bucket = process.env[OBJECT_STORAGE_ENV.BUCKET];
    }

    return config;
}

/**
 * Merge provided config with environment variables (provided config takes precedence)
 */
export function mergeWithEnv<
    T extends Partial<StorageBoxConfig | StorageShareConfig | ObjectStorageConfig>,
>(provided: T, envConfig: Partial<StorageBoxConfig | StorageShareConfig | ObjectStorageConfig>): T {
    return {
        ...envConfig,
        ...provided,
    } as T;
}
