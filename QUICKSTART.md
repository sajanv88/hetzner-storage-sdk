# Quick Start Guide - Hetzner Storage SDK

## Installation & Setup

### 1. Install Dependencies

```bash
cd hetzner-storage-sdk
npm install
```

### 2. Build the Project

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

## Quick Examples

### Storage Box - Basic File Operations

```typescript
import { HetznerStorageClient } from './src';

async function quickExample() {
  // Create client
  const client = HetznerStorageClient.create({
    type: 'box',
    username: 'u123456',
    password: 'your-password'
  });

  // Upload a file
  await client.uploadFile(
    Buffer.from('Hello World'),
    '/hello.txt'
  );

  // List files
  const files = await client.listFiles('/');
  console.log('Files:', files);

  // Download
  const content = await client.downloadFile('/hello.txt');
  console.log('Content:', content.toString());

  // Cleanup
  await client.disconnect();
}

quickExample().catch(console.error);
```

### Storage Share - Create Public Link

```typescript
import { HetznerStorageClient } from './src';

async function shareExample() {
  const client = HetznerStorageClient.create({
    type: 'share',
    username: 'your-username',
    password: 'your-password',
    instance: 'u123456'
  });

  // Upload file
  await client.uploadFile(
    Buffer.from('Document content'),
    '/document.pdf'
  );

  // Create public share
  const share = await client.createPublicShare(
    '/document.pdf',
    'password123',  // Optional password
    '2024-12-31'    // Expiration date
  );

  console.log('Share URL:', share.url);
  
  await client.disconnect();
}

shareExample().catch(console.error);
```

## Configuration Options

### Storage Box Configuration

```typescript
{
  type: 'box',
  username: string,          // Required: Storage Box username
  password: string,          // Required: Storage Box password
  protocol?: 'webdav'
  storageBoxId?: string,     // Optional: Required for Robot API
  robotUsername?: string,    // Optional: For management operations
  robotPassword?: string     // Optional: For management operations
}
```

### Storage Share Configuration

```typescript
{
  type: 'share',
  username: string,    // Required: Nextcloud username
  password: string,    // Required: Nextcloud password
  instance: string     // Required: Instance ID (e.g., 'u123456')
}
```

## Development

### TypeScript Development

```bash
# Watch mode for development
npm run dev
```

### Project Structure

```
src/
├── types/              # TypeScript definitions
├── providers/          # Storage implementations
│   ├── BaseStorageProvider.ts
│   ├── StorageBoxProvider.ts
│   └── StorageShareProvider.ts
├── utils/             # API clients
│   ├── RobotApiClient.ts
│   └── OcsApiClient.ts
├── HetznerStorageClient.ts  # Factory
└── index.ts           # Main export
```

## Testing Your Setup

Create a test file `test.ts`:

```typescript
import { HetznerStorageClient } from './src';

// add this in your environment.. 
// HETZNER_STORAGE_BOX_USERNAME
// HETZNER_STORAGE_BOX_PASSWORD
async function test() {
  const client = HetznerStorageClient.create({
    type: 'box',
  });

  try {
    const files = await client.listFiles('/');
    console.log('✅ Connection successful!');
    console.log('Files found:', files.length);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await client.disconnect();
  }
}

test();
```

Run with:

```bash
npx ts-node test.ts
```

## Common Use Cases

### 1. Backup System

```typescript
const client = HetznerStorageClient.create({ /* config */ });
await client.uploadFile('./database.sql', '/backups/db.sql');
await client.createSnapshot('Daily backup');
```

### 2. File Sharing

```typescript
const client = HetznerStorageClient.create({ /* config */ });
const share = await client.createPublicShare('/file.pdf', 'pass123');
console.log('Share link:', share.url);
```

### 3. Sync Files

```typescript
const client = HetznerStorageClient.create({ /* config */ });
const files = await client.listFiles('/source');
for (const file of files) {
  const content = await client.downloadFile(file.path);
  await client.uploadFile(content, `/backup/${file.filename}`);
}
```

## Next Steps

1. Check `examples/usage-examples.ts` for comprehensive examples
2. Read `README.md` for full API documentation
3. See `ARCHITECTURE.md` for design details

## Troubleshooting

### Connection Issues

- **WebDAV**: Verify username format (usually `uXXXXXX`)
- **Robot API**: Ensure Robot credentials are separate from storage credentials

### Common Errors

- `401 Unauthorized`: Check username/password
- `404 Not Found`: Verify file path (use `/` prefix)
- `ECONNREFUSED`: Check network connectivity

## Support

For issues or questions:
1. Check the examples in `examples/` directory
2. Review API documentation in `README.md`
3. Examine type definitions in `src/types/index.ts`
