import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ObjectStorageConfig, StorageBoxConfig, StorageShareConfig } from '../types';
import {
    OBJECT_STORAGE_ENV,
    STORAGE_BOX_ENV,
    STORAGE_SHARE_ENV,
    loadObjectStorageEnv,
    loadStorageBoxEnv,
    loadStorageShareEnv,
    mergeWithEnv,
} from './env-config';

describe('env-config', () => {
    beforeEach(() => {
        // Clear all environment variables before each test
        delete process.env[STORAGE_BOX_ENV.USERNAME];
        delete process.env[STORAGE_BOX_ENV.PASSWORD];
        delete process.env[STORAGE_BOX_ENV.PROTOCOL];
        delete process.env[STORAGE_BOX_ENV.STORAGE_BOX_ID];
        delete process.env[STORAGE_BOX_ENV.ROBOT_USERNAME];
        delete process.env[STORAGE_BOX_ENV.ROBOT_PASSWORD];
        delete process.env[STORAGE_SHARE_ENV.USERNAME];
        delete process.env[STORAGE_SHARE_ENV.PASSWORD];
        delete process.env[STORAGE_SHARE_ENV.INSTANCE];
        delete process.env[OBJECT_STORAGE_ENV.ACCESS_KEY_ID];
        delete process.env[OBJECT_STORAGE_ENV.SECRET_ACCESS_KEY];
        delete process.env[OBJECT_STORAGE_ENV.REGION];
        delete process.env[OBJECT_STORAGE_ENV.BUCKET];
    });

    afterEach(() => {
        // Cleanup after each test
        delete process.env[STORAGE_BOX_ENV.USERNAME];
        delete process.env[STORAGE_BOX_ENV.PASSWORD];
        delete process.env[STORAGE_BOX_ENV.PROTOCOL];
        delete process.env[STORAGE_BOX_ENV.STORAGE_BOX_ID];
        delete process.env[STORAGE_BOX_ENV.ROBOT_USERNAME];
        delete process.env[STORAGE_BOX_ENV.ROBOT_PASSWORD];
        delete process.env[STORAGE_SHARE_ENV.USERNAME];
        delete process.env[STORAGE_SHARE_ENV.PASSWORD];
        delete process.env[STORAGE_SHARE_ENV.INSTANCE];
        delete process.env[OBJECT_STORAGE_ENV.ACCESS_KEY_ID];
        delete process.env[OBJECT_STORAGE_ENV.SECRET_ACCESS_KEY];
        delete process.env[OBJECT_STORAGE_ENV.REGION];
        delete process.env[OBJECT_STORAGE_ENV.BUCKET];
    });

    describe('loadStorageBoxEnv', () => {
        it('should return basic config with type when no env vars are set', () => {
            const config = loadStorageBoxEnv();
            expect(config).toEqual({ type: 'box' });
        });

        it('should load username from environment', () => {
            process.env[STORAGE_BOX_ENV.USERNAME] = 'test-user';
            const config = loadStorageBoxEnv();
            expect(config.username).toBe('test-user');
        });

        it('should load password from environment', () => {
            process.env[STORAGE_BOX_ENV.PASSWORD] = 'test-pass';
            const config = loadStorageBoxEnv();
            expect(config.password).toBe('test-pass');
        });

        it('should load protocol from environment', () => {
            process.env[STORAGE_BOX_ENV.PROTOCOL] = 'webdav';
            const config = loadStorageBoxEnv();
            expect(config.protocol).toBe('webdav');
        });

        it('should load storageBoxId from environment', () => {
            process.env[STORAGE_BOX_ENV.STORAGE_BOX_ID] = 'box123';
            const config = loadStorageBoxEnv();
            expect(config.storageBoxId).toBe('box123');
        });

        it('should load robotUsername from environment', () => {
            process.env[STORAGE_BOX_ENV.ROBOT_USERNAME] = 'robot-user';
            const config = loadStorageBoxEnv();
            expect(config.robotUsername).toBe('robot-user');
        });

        it('should load robotPassword from environment', () => {
            process.env[STORAGE_BOX_ENV.ROBOT_PASSWORD] = 'robot-pass';
            const config = loadStorageBoxEnv();
            expect(config.robotPassword).toBe('robot-pass');
        });

        it('should load all environment variables together', () => {
            process.env[STORAGE_BOX_ENV.USERNAME] = 'test-user';
            process.env[STORAGE_BOX_ENV.PASSWORD] = 'test-pass';
            process.env[STORAGE_BOX_ENV.PROTOCOL] = 'webdav';
            process.env[STORAGE_BOX_ENV.STORAGE_BOX_ID] = 'box123';
            process.env[STORAGE_BOX_ENV.ROBOT_USERNAME] = 'robot-user';
            process.env[STORAGE_BOX_ENV.ROBOT_PASSWORD] = 'robot-pass';

            const config = loadStorageBoxEnv();

            expect(config).toEqual({
                type: 'box',
                username: 'test-user',
                password: 'test-pass',
                protocol: 'webdav',
                storageBoxId: 'box123',
                robotUsername: 'robot-user',
                robotPassword: 'robot-pass',
            });
        });
    });

    describe('loadStorageShareEnv', () => {
        it('should return basic config with type when no env vars are set', () => {
            const config = loadStorageShareEnv();
            expect(config).toEqual({ type: 'share' });
        });

        it('should load username from environment', () => {
            process.env[STORAGE_SHARE_ENV.USERNAME] = 'share-user';
            const config = loadStorageShareEnv();
            expect(config.username).toBe('share-user');
        });

        it('should load password from environment', () => {
            process.env[STORAGE_SHARE_ENV.PASSWORD] = 'share-pass';
            const config = loadStorageShareEnv();
            expect(config.password).toBe('share-pass');
        });

        it('should load instance from environment', () => {
            process.env[STORAGE_SHARE_ENV.INSTANCE] = 'u123456';
            const config = loadStorageShareEnv();
            expect(config.instance).toBe('u123456');
        });

        it('should load all environment variables together', () => {
            process.env[STORAGE_SHARE_ENV.USERNAME] = 'share-user';
            process.env[STORAGE_SHARE_ENV.PASSWORD] = 'share-pass';
            process.env[STORAGE_SHARE_ENV.INSTANCE] = 'u123456';

            const config = loadStorageShareEnv();

            expect(config).toEqual({
                type: 'share',
                username: 'share-user',
                password: 'share-pass',
                instance: 'u123456',
            });
        });
    });

    describe('loadObjectStorageEnv', () => {
        it('should return basic config with type when no env vars are set', () => {
            const config = loadObjectStorageEnv();
            expect(config).toEqual({ type: 'object' });
        });

        it('should load accessKeyId from environment', () => {
            process.env[OBJECT_STORAGE_ENV.ACCESS_KEY_ID] = 'test-key-id';
            const config = loadObjectStorageEnv();
            expect(config.accessKeyId).toBe('test-key-id');
        });

        it('should load secretAccessKey from environment', () => {
            process.env[OBJECT_STORAGE_ENV.SECRET_ACCESS_KEY] = 'test-secret';
            const config = loadObjectStorageEnv();
            expect(config.secretAccessKey).toBe('test-secret');
        });

        it('should load region from environment', () => {
            process.env[OBJECT_STORAGE_ENV.REGION] = 'fsn1';
            const config = loadObjectStorageEnv();
            expect(config.region).toBe('fsn1');
        });

        it('should load bucket from environment', () => {
            process.env[OBJECT_STORAGE_ENV.BUCKET] = 'test-bucket';
            const config = loadObjectStorageEnv();
            expect(config.bucket).toBe('test-bucket');
        });

        it('should load all environment variables together', () => {
            process.env[OBJECT_STORAGE_ENV.ACCESS_KEY_ID] = 'test-key-id';
            process.env[OBJECT_STORAGE_ENV.SECRET_ACCESS_KEY] = 'test-secret';
            process.env[OBJECT_STORAGE_ENV.REGION] = 'nbg1';
            process.env[OBJECT_STORAGE_ENV.BUCKET] = 'test-bucket';

            const config = loadObjectStorageEnv();

            expect(config).toEqual({
                type: 'object',
                accessKeyId: 'test-key-id',
                secretAccessKey: 'test-secret',
                region: 'nbg1',
                bucket: 'test-bucket',
            });
        });
    });

    describe('mergeWithEnv', () => {
        it('should merge configs with provided config taking precedence', () => {
            const provided: Partial<StorageBoxConfig> = {
                type: 'box',
                username: 'provided-user',
                password: 'provided-pass',
            };

            const envConfig: Partial<StorageBoxConfig> = {
                type: 'box',
                username: 'env-user',
                password: 'env-pass',
                protocol: 'webdav',
            };

            const result = mergeWithEnv(provided, envConfig);

            expect(result).toEqual({
                type: 'box',
                username: 'provided-user',
                password: 'provided-pass',
                protocol: 'webdav',
            });
        });

        it('should use env values when provided values are not set', () => {
            const provided: Partial<StorageBoxConfig> = {
                type: 'box',
                username: 'provided-user',
            };

            const envConfig: Partial<StorageBoxConfig> = {
                type: 'box',
                username: 'env-user',
                password: 'env-pass',
                protocol: 'webdav',
            };

            const result = mergeWithEnv(provided, envConfig);

            expect(result).toEqual({
                type: 'box',
                username: 'provided-user',
                password: 'env-pass',
                protocol: 'webdav',
            });
        });

        it('should work with empty provided config', () => {
            const provided: Partial<StorageBoxConfig> = {
                type: 'box',
            };

            const envConfig: Partial<StorageBoxConfig> = {
                type: 'box',
                username: 'env-user',
                password: 'env-pass',
            };

            const result = mergeWithEnv(provided, envConfig);

            expect(result).toEqual({
                type: 'box',
                username: 'env-user',
                password: 'env-pass',
            });
        });

        it('should work with Storage Share config', () => {
            const provided: Partial<StorageShareConfig> = {
                type: 'share',
                instance: 'provided-instance',
            };

            const envConfig: Partial<StorageShareConfig> = {
                type: 'share',
                username: 'env-user',
                password: 'env-pass',
                instance: 'env-instance',
            };

            const result = mergeWithEnv(provided, envConfig);

            expect(result).toEqual({
                type: 'share',
                username: 'env-user',
                password: 'env-pass',
                instance: 'provided-instance',
            });
        });

        it('should work with Object Storage config', () => {
            const provided: Partial<ObjectStorageConfig> = {
                type: 'object',
                bucket: 'provided-bucket',
            };

            const envConfig: Partial<ObjectStorageConfig> = {
                type: 'object',
                accessKeyId: 'env-key',
                secretAccessKey: 'env-secret',
                region: 'fsn1',
                bucket: 'env-bucket',
            };

            const result = mergeWithEnv(provided, envConfig);

            expect(result).toEqual({
                type: 'object',
                accessKeyId: 'env-key',
                secretAccessKey: 'env-secret',
                region: 'fsn1',
                bucket: 'provided-bucket',
            });
        });
    });

    describe('Environment variable constants', () => {
        it('should have correct STORAGE_BOX_ENV constants', () => {
            expect(STORAGE_BOX_ENV).toEqual({
                USERNAME: 'HETZNER_STORAGE_BOX_USERNAME',
                PASSWORD: 'HETZNER_STORAGE_BOX_PASSWORD',
                PROTOCOL: 'HETZNER_STORAGE_BOX_PROTOCOL',
                STORAGE_BOX_ID: 'HETZNER_STORAGE_BOX_ID',
                ROBOT_USERNAME: 'HETZNER_ROBOT_USERNAME',
                ROBOT_PASSWORD: 'HETZNER_ROBOT_PASSWORD',
            });
        });

        it('should have correct STORAGE_SHARE_ENV constants', () => {
            expect(STORAGE_SHARE_ENV).toEqual({
                USERNAME: 'HETZNER_STORAGE_SHARE_USERNAME',
                PASSWORD: 'HETZNER_STORAGE_SHARE_PASSWORD',
                INSTANCE: 'HETZNER_STORAGE_SHARE_INSTANCE',
            });
        });

        it('should have correct OBJECT_STORAGE_ENV constants', () => {
            expect(OBJECT_STORAGE_ENV).toEqual({
                ACCESS_KEY_ID: 'HETZNER_OBJECT_STORAGE_ACCESS_KEY_ID',
                SECRET_ACCESS_KEY: 'HETZNER_OBJECT_STORAGE_SECRET_ACCESS_KEY',
                REGION: 'HETZNER_OBJECT_STORAGE_REGION',
                BUCKET: 'HETZNER_OBJECT_STORAGE_BUCKET',
            });
        });
    });
});
