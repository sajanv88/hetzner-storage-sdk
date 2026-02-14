import { beforeAll, afterAll, vi } from 'vitest';

// Mock environment variables for testing
beforeAll(() => {
  // Clear any existing environment variables
  delete process.env.HETZNER_STORAGE_BOX_USERNAME;
  delete process.env.HETZNER_STORAGE_BOX_PASSWORD;
  delete process.env.HETZNER_STORAGE_BOX_PROTOCOL;
  delete process.env.HETZNER_STORAGE_BOX_ID;
  delete process.env.HETZNER_ROBOT_USERNAME;
  delete process.env.HETZNER_ROBOT_PASSWORD;
  delete process.env.HETZNER_STORAGE_SHARE_USERNAME;
  delete process.env.HETZNER_STORAGE_SHARE_PASSWORD;
  delete process.env.HETZNER_STORAGE_SHARE_INSTANCE;
  delete process.env.HETZNER_OBJECT_STORAGE_ACCESS_KEY_ID;
  delete process.env.HETZNER_OBJECT_STORAGE_SECRET_ACCESS_KEY;
  delete process.env.HETZNER_OBJECT_STORAGE_REGION;
  delete process.env.HETZNER_OBJECT_STORAGE_BUCKET;
});

afterAll(() => {
  vi.restoreAllMocks();
});
