import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HetznerStorageClient } from './HetznerStorageClient';
import { ObjectStorageProvider } from './providers/ObjectStorageProvider';
import { StorageBoxProvider } from './providers/StorageBoxProvider';
import { StorageShareProvider } from './providers/StorageShareProvider';

// Mock the env-config module
vi.mock('./utils/env-config', () => ({
    loadStorageBoxEnv: vi.fn(() => ({})),
    loadStorageShareEnv: vi.fn(() => ({})),
    loadObjectStorageEnv: vi.fn(() => ({})),
    mergeWithEnv: vi.fn((config, envConfig) => ({ ...envConfig, ...config })),
}));

// Mock the provider modules
vi.mock('./providers/StorageBoxProvider');
vi.mock('./providers/StorageShareProvider');
vi.mock('./providers/ObjectStorageProvider');

describe('HetznerStorageClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create method', () => {
        it('should throw error when type is not provided', () => {
            expect(() => {
                HetznerStorageClient.create({ type: undefined as any });
            }).toThrow('Storage type is required in configuration');
        });

        it('should create StorageBoxProvider for type "box"', () => {
            const config = {
                type: 'box' as const,
                username: 'test-user',
                password: 'test-pass',
            };

            HetznerStorageClient.create(config);

            expect(StorageBoxProvider).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'box',
                    username: 'test-user',
                    password: 'test-pass',
                })
            );
        });

        it('should create StorageShareProvider for type "share"', () => {
            const config = {
                type: 'share' as const,
                username: 'test-user',
                password: 'test-pass',
                instance: 'u123456',
            };

            HetznerStorageClient.create(config);

            expect(StorageShareProvider).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'share',
                    username: 'test-user',
                    password: 'test-pass',
                    instance: 'u123456',
                })
            );
        });

        it('should create ObjectStorageProvider for type "object"', () => {
            const config = {
                type: 'object' as const,
                accessKeyId: 'test-key',
                secretAccessKey: 'test-secret',
                region: 'fsn1' as const,
                bucket: 'test-bucket',
            };

            HetznerStorageClient.create(config);

            expect(ObjectStorageProvider).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'object',
                    accessKeyId: 'test-key',
                    secretAccessKey: 'test-secret',
                    region: 'fsn1',
                    bucket: 'test-bucket',
                })
            );
        });

        it('should throw error for invalid storage type', () => {
            expect(() => {
                HetznerStorageClient.create({ type: 'invalid' as any });
            }).toThrow("Invalid storage type: invalid. Must be 'box', 'share', or 'object'.");
        });

        it('should throw error when Storage Box username is missing', () => {
            expect(() => {
                HetznerStorageClient.create({
                    type: 'box',
                    password: 'test-pass',
                } as any);
            }).toThrow('Username and password are required for Storage Box');
        });

        it('should throw error when Storage Box password is missing', () => {
            expect(() => {
                HetznerStorageClient.create({
                    type: 'box',
                    username: 'test-user',
                } as any);
            }).toThrow('Username and password are required for Storage Box');
        });

        it('should throw error when Storage Share username is missing', () => {
            expect(() => {
                HetznerStorageClient.create({
                    type: 'share',
                    password: 'test-pass',
                    instance: 'u123456',
                } as any);
            }).toThrow('Username and password are required for Storage Share');
        });

        it('should throw error when Storage Share instance is missing', () => {
            expect(() => {
                HetznerStorageClient.create({
                    type: 'share',
                    username: 'test-user',
                    password: 'test-pass',
                } as any);
            }).toThrow('Instance is required for Storage Share');
        });

        it('should throw error when Object Storage accessKeyId is missing', () => {
            expect(() => {
                HetznerStorageClient.create({
                    type: 'object',
                    secretAccessKey: 'test-secret',
                    region: 'fsn1',
                    bucket: 'test-bucket',
                } as any);
            }).toThrow('accessKeyId and secretAccessKey are required for Object Storage');
        });

        it('should throw error when Object Storage region is missing', () => {
            expect(() => {
                HetznerStorageClient.create({
                    type: 'object',
                    accessKeyId: 'test-key',
                    secretAccessKey: 'test-secret',
                    bucket: 'test-bucket',
                } as any);
            }).toThrow('Region is required for Object Storage');
        });

        it('should throw error when Object Storage bucket is missing', () => {
            expect(() => {
                HetznerStorageClient.create({
                    type: 'object',
                    accessKeyId: 'test-key',
                    secretAccessKey: 'test-secret',
                    region: 'fsn1',
                } as any);
            }).toThrow('Bucket is required for Object Storage');
        });
    });

    describe('createBoxClient method', () => {
        it('should create StorageBoxProvider with provided config', () => {
            const config = {
                username: 'test-user',
                password: 'test-pass',
            };

            HetznerStorageClient.createBoxClient(config);

            expect(StorageBoxProvider).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'box',
                    username: 'test-user',
                    password: 'test-pass',
                })
            );
        });

        it('should throw error when username is missing', () => {
            expect(() => {
                HetznerStorageClient.createBoxClient({ password: 'test-pass' } as any);
            }).toThrow('Username and password are required for Storage Box');
        });
    });

    describe('createShareClient method', () => {
        it('should create StorageShareProvider with provided config', () => {
            const config = {
                username: 'test-user',
                password: 'test-pass',
                instance: 'u123456',
            };

            HetznerStorageClient.createShareClient(config);

            expect(StorageShareProvider).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'share',
                    username: 'test-user',
                    password: 'test-pass',
                    instance: 'u123456',
                })
            );
        });

        it('should throw error when instance is missing', () => {
            expect(() => {
                HetznerStorageClient.createShareClient({
                    username: 'test-user',
                    password: 'test-pass',
                } as any);
            }).toThrow('Instance is required for Storage Share');
        });
    });

    describe('createObjectClient method', () => {
        it('should create ObjectStorageProvider with provided config', () => {
            const config = {
                accessKeyId: 'test-key',
                secretAccessKey: 'test-secret',
                region: 'fsn1' as const,
                bucket: 'test-bucket',
            };

            HetznerStorageClient.createObjectClient(config);

            expect(ObjectStorageProvider).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'object',
                    accessKeyId: 'test-key',
                    secretAccessKey: 'test-secret',
                    region: 'fsn1',
                    bucket: 'test-bucket',
                })
            );
        });

        it('should throw error when bucket is missing', () => {
            expect(() => {
                HetznerStorageClient.createObjectClient({
                    accessKeyId: 'test-key',
                    secretAccessKey: 'test-secret',
                    region: 'fsn1',
                } as any);
            }).toThrow('Bucket is required for Object Storage');
        });
    });
});
