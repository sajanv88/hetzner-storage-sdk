# Hetzner Storage SDK

A comprehensive TypeScript SDK for interacting with Hetzner Storage Box and Storage Share (Nextcloud).

## Features

- 🔧 **Dual Provider Support**: Works with both Storage Box and Storage Share
- 📦 **WebDAV Protocol**: Reliable file operations via WebDAV
- 🔒 **Type-Safe**: Full TypeScript support with complete type definitions
- 🎯 **Factory Pattern**: Easy provider switching with unified interface
- 📊 **Management APIs**: Full support for Robot API and Nextcloud OCS API
- 🚀 **Modern Async/Await**: Promise-based API throughout

## Installation

```bash
npm install hetzner-storage-sdk
# or
yarn add hetzner-storage-sdk
```

## Quick Start

### Storage Box (WebDAV)

```typescript
import { HetznerStorageClient } from 'hetzner-storage-sdk';

const client = HetznerStorageClient.create({
  type: 'box',
  username: 'u123456',
  password: 'your-password',
  storageBoxId: '12345',
  robotUsername: 'robot-user', // Optional: for management operations
  robotPassword: 'robot-pass'
});

// List files
const files = await client.listFiles('/');

// Upload a file
await client.uploadFile('./local-file.txt', '/remote-file.txt');

// Download a file
await client.downloadFile('/remote-file.txt', './downloaded-file.txt');

// Create snapshot (requires Robot API credentials)
const snapshot = await client.createSnapshot('My backup');
```

### Storage Share (Nextcloud)

```typescript
import { HetznerStorageClient } from 'hetzner-storage-sdk';

const client = HetznerStorageClient.create({
  type: 'share',
  username: 'your-username',
  password: 'your-password',
  instance: 'u123456' // Your instance ID
});

// List files
const files = await client.listFiles('/');

// Upload a file
await client.uploadFile('./document.pdf', '/documents/document.pdf');

// Create a public share link
const share = await client.createPublicShare(
  '/documents/document.pdf',
  'optional-password',
  '2024-12-31', // Expiration date
  1 // Permissions (1 = read)
);

console.log('Share URL:', share.url);
```

## Configuration

### Storage Box Configuration

```typescript
interface StorageBoxConfig {
  type: 'box';
  username: string;           // Storage Box username (e.g., 'u123456')
  password: string;           // Storage Box password
  storageBoxId?: string;      // Required for management operations
  robotUsername?: string;     // Robot API username
  robotPassword?: string;     // Robot API password
}
```

### Storage Share Configuration

```typescript
interface StorageShareConfig {
  type: 'share';
  username: string;  // Your Nextcloud username
  password: string;  // Your Nextcloud password
  instance: string;  // Instance ID (e.g., 'u123456')
}
```

## API Reference

### Common Methods (Both Providers)

#### File Operations

```typescript
// List files in a directory
listFiles(remotePath?: string): Promise<FileMetadata[]>

// Upload a file
uploadFile(
  localPath: string | Buffer | Readable,
  remotePath: string,
  options?: UploadOptions
): Promise<void>

// Download a file
downloadFile(
  remotePath: string,
  localPath?: string,
  options?: DownloadOptions
): Promise<Buffer | void>

// Delete a file or directory
deleteFile(remotePath: string): Promise<void>

// Create a directory
createDirectory(remotePath: string): Promise<void>

// Move/rename a file
moveFile(fromPath: string, toPath: string): Promise<void>

// Copy a file
copyFile(fromPath: string, toPath: string): Promise<void>

// Check if file exists
exists(remotePath: string): Promise<boolean>

// Get file metadata
getMetadata(remotePath: string): Promise<FileMetadata>

// Close connections
disconnect(): Promise<void>
```

### Storage Box Specific Methods

#### Robot API Management

```typescript
// List all storage boxes
listStorageBoxes(): Promise<StorageBoxDetails[]>

// Get storage box details
getStorageBoxDetails(): Promise<StorageBoxDetails>

// Toggle services (SSH, Samba, WebDAV)
toggleServices(services: {
  webdav?: boolean;
  samba?: boolean;
  ssh?: boolean;
}): Promise<StorageBoxDetails>

// Snapshot management
createSnapshot(comment?: string): Promise<SnapshotInfo>
listSnapshots(): Promise<SnapshotInfo[]>
deleteSnapshot(snapshotName: string): Promise<void>
revertToSnapshot(snapshotName: string): Promise<void>
```

### Storage Share Specific Methods

#### OCS API Share Management

```typescript
// Create a public link share
createPublicShare(
  path: string,
  password?: string,
  expireDate?: string,
  permissions?: number
): Promise<OCSShareData>

// Create a user share
createUserShare(
  path: string,
  shareWith: string,
  permissions?: number
): Promise<OCSShareData>

// Create a group share
createGroupShare(
  path: string,
  shareWith: string,
  permissions?: number
): Promise<OCSShareData>

// List all shares
listShares(): Promise<OCSShareData[]>

// Get share details
getShare(shareId: string): Promise<OCSShareData>

// Update a share
updateShare(
  shareId: string,
  options: Partial<CreateShareOptions>
): Promise<OCSShareData>

// Delete a share
deleteShare(shareId: string): Promise<void>

// Get shares for a specific path
getSharesForPath(path: string): Promise<OCSShareData[]>
```

## Usage Examples

### Example 1: Backup with Snapshot (Storage Box)

```typescript
import { HetznerStorageClient } from 'hetzner-storage-sdk';

async function createBackup() {
  const client = HetznerStorageClient.create({
    type: 'box',
    username: 'u123456',
    password: 'your-password',
    storageBoxId: '12345',
    robotUsername: 'robot-user',
    robotPassword: 'robot-pass'
  });

  // Upload backup files
  await client.createDirectory('/backups');
  await client.uploadFile('./database.sql', '/backups/database.sql');
  
  // Create snapshot
  const snapshot = await client.createSnapshot('Daily backup');
  console.log('Snapshot created:', snapshot.name);
  
  // List all snapshots
  const snapshots = await client.listSnapshots();
  console.log('Total snapshots:', snapshots.length);
  
  await client.disconnect();
}
```

### Example 2: Share Files with Team (Storage Share)

```typescript
import { HetznerStorageClient } from 'hetzner-storage-sdk';

async function shareWithTeam() {
  const client = HetznerStorageClient.create({
    type: 'share',
    username: 'your-username',
    password: 'your-password',
    instance: 'u123456'
  });

  // Upload document
  await client.uploadFile('./report.pdf', '/team/report.pdf');
  
  // Create public share with password
  const publicShare = await client.createPublicShare(
    '/team/report.pdf',
    'secure-password',
    '2024-12-31',
    1 // Read-only
  );
  
  console.log('Share link:', publicShare.url);
  console.log('Password:', 'secure-password');
  
  // Also share with specific team member
  const userShare = await client.createUserShare(
    '/team/report.pdf',
    'john.doe',
    31 // Full permissions
  );
  
  console.log('Shared with john.doe');
  
  await client.disconnect();
}
```

### Example 3: Sync Local Directory (Storage Box)

```typescript
import { HetznerStorageClient } from 'hetzner-storage-sdk';
import { readdir } from 'fs/promises';
import { join } from 'path';

async function syncDirectory(localDir: string, remoteDir: string) {
  const client = HetznerStorageClient.create({
    type: 'box',
    username: 'u123456',
    password: 'your-password'
  });

  // Create remote directory if it doesn't exist
  if (!(await client.exists(remoteDir))) {
    await client.createDirectory(remoteDir);
  }

  // Get local files
  const localFiles = await readdir(localDir);

  // Upload each file
  for (const file of localFiles) {
    const localPath = join(localDir, file);
    const remotePath = `${remoteDir}/${file}`;
    
    console.log(`Uploading ${file}...`);
    await client.uploadFile(localPath, remotePath, { overwrite: true });
  }

  console.log(`Synced ${localFiles.length} files`);
  await client.disconnect();
}
```

### Example 4: Download and Process Files

```typescript
import { HetznerStorageClient } from 'hetzner-storage-sdk';

async function processFiles() {
  const client = HetznerStorageClient.create({
    type: 'box',
    username: 'u123456',
    password: 'your-password'
  });

  // List all CSV files
  const files = await client.listFiles('/data');
  const csvFiles = files.filter(f => f.filename.endsWith('.csv'));

  for (const file of csvFiles) {
    // Download as buffer (not to disk)
    const buffer = await client.downloadFile(file.path) as Buffer;
    const content = buffer.toString('utf-8');
    
    // Process content
    console.log(`Processing ${file.filename}`);
    const lines = content.split('\n');
    console.log(`  - ${lines.length} lines`);
    
    // Your processing logic here...
  }

  await client.disconnect();
}
```

### Example 5: Automated Backup Rotation

```typescript
import { HetznerStorageClient } from 'hetzner-storage-sdk';

async function rotateBackups() {
  const client = HetznerStorageClient.create({
    type: 'box',
    username: 'u123456',
    password: 'your-password',
    storageBoxId: '12345',
    robotUsername: 'robot-user',
    robotPassword: 'robot-pass'
  });

  const backupDir = '/backups';
  const maxBackups = 7; // Keep last 7 backups

  // Create new backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const currentBackup = `${backupDir}/${timestamp}`;
  
  await client.createDirectory(currentBackup);
  await client.uploadFile('./data.tar.gz', `${currentBackup}/data.tar.gz`);
  
  // Create snapshot
  await client.createSnapshot(`Backup ${timestamp}`);

  // Get all backups
  const backups = await client.listFiles(backupDir);
  
  // Delete old backups
  if (backups.length > maxBackups) {
    const sortedBackups = backups.sort((a, b) => 
      a.lastModified.getTime() - b.lastModified.getTime()
    );
    
    const toDelete = sortedBackups.slice(0, backups.length - maxBackups);
    for (const backup of toDelete) {
      await client.deleteFile(backup.path);
      console.log(`Deleted old backup: ${backup.filename}`);
    }
  }

  await client.disconnect();
}
```

## Error Handling

```typescript
import { HetznerStorageClient, StorageError } from 'hetzner-storage-sdk';

async function handleErrors() {
  const client = HetznerStorageClient.create({
    type: 'box',
    username: 'u123456',
    password: 'your-password'
  });

  try {
    await client.uploadFile('./file.txt', '/remote/file.txt');
  } catch (error) {
    if (error instanceof Error) {
      const storageError = error as StorageError;
      console.error('Error:', storageError.message);
      console.error('Code:', storageError.code);
      console.error('Status:', storageError.statusCode);
    }
  } finally {
    await client.disconnect();
  }
}
```

## Architecture

The SDK follows a clean architecture with:

- **Factory Pattern**: `HetznerStorageClient` creates the appropriate provider
- **Provider Pattern**: Abstract `BaseStorageProvider` with concrete implementations
- **Separation of Concerns**: 
  - File operations via WebDAV
  - Management via Robot API (Storage Box) or OCS API (Storage Share)

```
┌─────────────────────────────────┐
│   HetznerStorageClient          │
│   (Factory)                     │
└─────────────┬───────────────────┘
              │
      ┌───────┴────────┐
      │                │
┌─────▼─────┐    ┌────▼──────┐
│ Storage   │    │ Storage   │
│ Box       │    │ Share     │
│ Provider  │    │ Provider  │
└─────┬─────┘    └────┬──────┘
      │                │
  ┌───┴───┐        ┌───┴───┐
  │WebDAV │        │WebDAV │
  │Robot  │        │  OCS  │
  │  API  │        │  API  │
  └───────┘        └───────┘
```

## Protocol Details

### WebDAV Operations

Both Storage Box and Storage Share use WebDAV for file operations:

- **PROPFIND**: List directory contents
- **PUT**: Upload files
- **GET**: Download files
- **DELETE**: Remove files/directories
- **MKCOL**: Create directories
- **MOVE**: Move/rename files
- **COPY**: Copy files

### Storage Box URL Format
```
https://<username>.your-storagebox.de/
```

### Storage Share URL Format
```
https://<instance>.your-storageshare.de/remote.php/dav/files/<username>/
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { 
  HetznerStorageClient,
  StorageBoxConfig,
  StorageShareConfig,
  FileMetadata,
  StorageBoxDetails,
  SnapshotInfo,
  OCSShareData
} from 'hetzner-storage-sdk';

// Full autocomplete and type checking
const client = HetznerStorageClient.create({
  type: 'box',
  username: 'u123456',
  password: 'pass'
});

const files: FileMetadata[] = await client.listFiles('/');
```

## Dependencies

- **axios**: HTTP client for API requests
- **webdav**: WebDAV client for file operations

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions:
- Check the examples in the documentation
- Review the type definitions for detailed API information
- Open an issue on the project repository
- [Contact Me](mailto:work@sajankumarv.com)