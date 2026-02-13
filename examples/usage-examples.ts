/**
 * Hetzner Storage SDK - Usage Examples
 * 
 * This file contains practical examples of using the SDK
 */

import { HetznerStorageClient, StorageBoxProvider, StorageShareProvider, ObjectStorageProvider } from '../dist';



async function example1_BasicStorageBox() {
  console.log('\n=== Example 1: Basic Storage Box Usage ===\n');

  const client = HetznerStorageClient.create({
    type: 'box',
    protocol: 'webdav'
  });

  try {
    // List root directory
    const files = await client.listFiles('/');
    console.log('Files in root:', files.length);
    files.forEach(f => console.log(`  - ${f.filename} (${f.type})`));

    // Clean up any existing test folder first
    if (await client.exists('/test-folder')) {
      await client.deleteFile('/test-folder');
      console.log('Cleaned up existing test-folder');
    }

    // Create a directory
    await client.createDirectory('/test-folder');
    console.log('Created directory: /test-folder');

    // Upload a file from buffer
    const content = Buffer.from('Hello, Hetzner Storage!');
    await client.uploadFile(content, '/test-folder/hello.txt');
    console.log('Uploaded file: /test-folder/hello.txt');

    // Download and read the file
    const downloaded = await client.downloadFile('/test-folder/hello.txt') as Buffer;
    console.log('Downloaded content:', downloaded.toString());

    // Get file metadata
    const metadata = await client.getMetadata('/test-folder/hello.txt');
    console.log('File metadata:', {
      size: metadata.size,
      modified: metadata.lastModified,
      type: metadata.type
    });

    // Check if file exists
    const exists = await client.exists('/test-folder/hello.txt');
    console.log('File exists:', exists);

    // Clean up
    await client.deleteFile('/test-folder');
    console.log('Deleted directory: /test-folder');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}


// ============================================================================
// EXAMPLE 3: Storage Box Management with Robot API
// ============================================================================

async function example3_RobotAPIManagement() {
  console.log('\n=== Example 3: Robot API Management ===\n');

  const client = HetznerStorageClient.create({
    type: 'box',
    username: 'u123456',
    password: 'your-password',
    storageBoxId: '12345',
    robotUsername: 'robot-user',
    robotPassword: 'robot-password'
  }) as StorageBoxProvider;

  try {
    // List all storage boxes
    const boxes = await client.listStorageBoxes();
    console.log('Storage boxes:', boxes.length);
    boxes.forEach(box => {
      console.log(`  - Box ${box.id}: ${box.name}`);
      console.log(`    Location: ${box.location}`);
      console.log(`    Usage: ${box.disk_usage}/${box.disk_quota} GB`);
    });

    // Get specific box details
    const box = await client.getStorageBoxDetails();
    console.log('\nCurrent box details:');
    console.log(`  WebDAV: ${box.webdav ? 'enabled' : 'disabled'}`);
    console.log(`  SSH: ${box.ssh ? 'enabled' : 'disabled'}`);
    console.log(`  Samba: ${box.samba ? 'enabled' : 'disabled'}`);

    // Toggle services
    const updated = await client.toggleServices({
      webdav: true,
      ssh: true,
      samba: false
    });
    console.log('\nServices updated:');
    console.log(`  WebDAV: ${updated.webdav}`);
    console.log(`  SSH: ${updated.ssh}`);
    console.log(`  Samba: ${updated.samba}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

// ============================================================================
// EXAMPLE 4: Snapshot Management
// ============================================================================

async function example4_SnapshotManagement() {
  console.log('\n=== Example 4: Snapshot Management ===\n');

  const client = HetznerStorageClient.create({
    type: 'box',
    username: 'u123456',
    password: 'your-password',
    storageBoxId: '12345',
    robotUsername: 'robot-user',
    robotPassword: 'robot-password'
  }) as StorageBoxProvider;

  try {
    // Create a snapshot
    const snapshot = await client.createSnapshot('Backup before update');
    console.log('Snapshot created:', snapshot.name);
    console.log('Created at:', snapshot.created);
    console.log('Comment:', snapshot.comment);

    // List all snapshots
    const snapshots = await client.listSnapshots();
    console.log(`\nTotal snapshots: ${snapshots.length}`);
    snapshots.forEach(s => {
      console.log(`  - ${s.name} (${s.created})`);
      if (s.comment) console.log(`    Comment: ${s.comment}`);
    });

    // To revert to a snapshot (use with caution!):
    // await client.revertToSnapshot(snapshot.name);

    // To delete a snapshot:
    // await client.deleteSnapshot(snapshot.name);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

// ============================================================================
// EXAMPLE 5: Storage Share Basic Usage
// ============================================================================

async function example5_StorageShareBasics() {
  console.log('\n=== Example 5: Storage Share Basics ===\n');

  const client = HetznerStorageClient.create({
    type: 'share',
    username: 'your-username',
    password: 'your-password',
    instance: 'u123456'
  });

  try {
    // List files
    const files = await client.listFiles('/');
    console.log('Files in Nextcloud:', files.length);

    // Create directory
    await client.createDirectory('/Projects');
    console.log('Created /Projects directory');

    // Upload file
    const content = Buffer.from('Project documentation');
    await client.uploadFile(content, '/Projects/README.md');
    console.log('Uploaded /Projects/README.md');

    // List project files
    const projectFiles = await client.listFiles('/Projects');
    console.log('Files in /Projects:', projectFiles.length);

    // Download file
    const downloaded = await client.downloadFile('/Projects/README.md') as Buffer;
    console.log('Downloaded content:', downloaded.toString());

    // Copy file
    await client.copyFile('/Projects/README.md', '/Projects/README-backup.md');
    console.log('Created backup copy');

    // Move file
    await client.moveFile('/Projects/README-backup.md', '/README-backup.md');
    console.log('Moved backup to root');

    // Clean up
    await client.deleteFile('/Projects');
    await client.deleteFile('/README-backup.md');
    console.log('Cleaned up');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

// ============================================================================
// EXAMPLE 6: Storage Share - Public Link Sharing
// ============================================================================

async function example6_PublicLinkSharing() {
  console.log('\n=== Example 6: Public Link Sharing ===\n');

  const client = HetznerStorageClient.create({
    type: 'share',
    username: 'your-username',
    password: 'your-password',
    instance: 'u123456'
  }) as StorageShareProvider;

  try {
    // Upload a file to share
    await client.uploadFile(
      Buffer.from('Shared document content'),
      '/shared-document.pdf'
    );
    console.log('Uploaded document');

    // Create a public share with password protection
    const share = await client.createPublicShare(
      '/shared-document.pdf',
      'secure-pass-123',  // Password
      '2024-12-31',        // Expiration date
      1                    // Read-only permission
    );

    console.log('\nPublic share created:');
    console.log('  URL:', share.url);
    console.log('  Password:', 'secure-pass-123');
    console.log('  Token:', share.token);
    console.log('  Expires:', share.expiration);

    // List all shares
    const allShares = await client.listShares();
    console.log(`\nTotal shares: ${allShares.length}`);
    allShares.forEach(s => {
      console.log(`  - ${s.path} (${s.share_type === 3 ? 'Public' : 'Private'})`);
    });

    // Get shares for specific file
    const fileShares = await client.getSharesForPath('/shared-document.pdf');
    console.log(`\nShares for document: ${fileShares.length}`);

    // Update share (e.g., change expiration)
    const updated = await client.updateShare(share.id, {
      expireDate: '2025-01-31'
    });
    console.log('Updated expiration to:', updated.expiration);

    // Clean up
    await client.deleteShare(share.id);
    await client.deleteFile('/shared-document.pdf');
    console.log('Cleaned up share and file');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

// ============================================================================
// EXAMPLE 7: Storage Share - User and Group Sharing
// ============================================================================

async function example7_UserGroupSharing() {
  console.log('\n=== Example 7: User and Group Sharing ===\n');

  const client = HetznerStorageClient.create({
    type: 'share',
    username: 'your-username',
    password: 'your-password',
    instance: 'u123456'
  }) as StorageShareProvider;

  try {
    // Create a shared folder
    await client.createDirectory('/Team');
    await client.uploadFile(
      Buffer.from('Team document'),
      '/Team/project.docx'
    );

    // Share with a specific user (read-only)
    const userShare = await client.createUserShare(
      '/Team/project.docx',
      'john.doe',
      1  // Read permission
    );
    console.log('Shared with user john.doe:', userShare.id);

    // Share folder with a group (full permissions)
    const groupShare = await client.createGroupShare(
      '/Team',
      'developers',
      31  // All permissions (read, write, create, delete, share)
    );
    console.log('Shared with group developers:', groupShare.id);

    // Custom share with specific permissions
    const customShare = await client.createShare({
      path: '/Team/project.docx',
      shareType: 0,  // User share
      shareWith: 'jane.smith',
      permissions: 19,  // Read + Update + Share (1 + 2 + 16)
      note: 'Please review and provide feedback'
    });
    console.log('Custom share created:', customShare.id);

    // List all shares
    const shares = await client.listShares();
    console.log(`\nTotal shares: ${shares.length}`);
    shares.forEach(s => {
      const type = s.share_type === 0 ? 'User' : s.share_type === 1 ? 'Group' : 'Public';
      console.log(`  - ${type}: ${s.path}`);
      if (s.share_with) console.log(`    With: ${s.share_with}`);
    });

    // Clean up shares
    await client.deleteShare(userShare.id);
    await client.deleteShare(groupShare.id);
    await client.deleteShare(customShare.id);
    await client.deleteFile('/Team');
    console.log('Cleaned up');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

// ============================================================================
// EXAMPLE 8: Advanced - Backup System with Rotation
// ============================================================================

async function example8_BackupSystem() {
  console.log('\n=== Example 8: Backup System with Rotation ===\n');

  const client = HetznerStorageClient.create({
    type: 'box',
    username: 'u123456',
    password: 'your-password',
    storageBoxId: '12345',
    robotUsername: 'robot-user',
    robotPassword: 'robot-password'
  }) as StorageBoxProvider;

  try {
    const backupDir = '/backups';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupDir = `${backupDir}/${timestamp}`;

    // Create backup directory
    if (!(await client.exists(backupDir))) {
      await client.createDirectory(backupDir);
    }
    await client.createDirectory(currentBackupDir);

    // Simulate backing up multiple files
    const filesToBackup = [
      { name: 'database.sql', content: 'SELECT * FROM users...' },
      { name: 'config.json', content: '{"app": "myapp"}' },
      { name: 'logs.txt', content: 'Application logs...' }
    ];

    console.log(`Creating backup in ${currentBackupDir}`);
    for (const file of filesToBackup) {
      await client.uploadFile(
        Buffer.from(file.content),
        `${currentBackupDir}/${file.name}`
      );
      console.log(`  ✓ Backed up ${file.name}`);
    }

    // Create snapshot
    const snapshot = await client.createSnapshot(`Backup ${timestamp}`);
    console.log(`\nSnapshot created: ${snapshot.name}`);

    // List all backups
    const backups = await client.listFiles(backupDir);
    console.log(`\nTotal backups: ${backups.length}`);

    // Rotation: Keep only last 7 backups
    if (backups.length > 7) {
      const oldBackups = backups
        .sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime())
        .slice(0, backups.length - 7);

      console.log(`\nRemoving ${oldBackups.length} old backups...`);
      for (const backup of oldBackups) {
        await client.deleteFile(backup.path);
        console.log(`  ✓ Removed ${backup.filename}`);
      }
    }

    // List snapshots
    const snapshots = await client.listSnapshots();
    console.log(`\nTotal snapshots: ${snapshots.length}`);

    console.log('\n✅ Backup completed successfully');

  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await client.disconnect();
  }
}

// ============================================================================
// EXAMPLE 9: Advanced - File Synchronization
// ============================================================================

async function example9_FileSynchronization() {
  console.log('\n=== Example 9: File Synchronization ===\n');

  const sourceClient = HetznerStorageClient.create({
    type: 'box',
    username: 'u123456-source',
    password: 'source-password'
  });

  const targetClient = HetznerStorageClient.create({
    type: 'share',
    username: 'target-username',
    password: 'target-password',
    instance: 'u789012'
  });

  try {
    const sourceDir = '/source-folder';
    const targetDir = '/synced-folder';

    // Get files from source
    const sourceFiles = await sourceClient.listFiles(sourceDir);
    console.log(`Files in source: ${sourceFiles.length}`);

    // Create target directory
    if (!(await targetClient.exists(targetDir))) {
      await targetClient.createDirectory(targetDir);
    }

    // Sync files
    console.log('\nSyncing files...');
    for (const file of sourceFiles) {
      if (file.type === 'file') {
        const content = await sourceClient.downloadFile(file.path) as Buffer;
        const targetPath = `${targetDir}/${file.filename}`;

        await targetClient.uploadFile(content, targetPath, { overwrite: true });
        console.log(`  ✓ Synced ${file.filename}`);
      }
    }

    console.log('\n✅ Synchronization completed');

  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await sourceClient.disconnect();
    await targetClient.disconnect();
  }
}

// ============================================================================
// EXAMPLE 10: Basic Object Storage Usage
// ============================================================================

async function example10_ObjectStorageBasics() {
  console.log('\n=== Example 10: Object Storage Basics ===\n');

  const client = HetznerStorageClient.create({
    type: 'object',
    region: 'hel1',
  }) as ObjectStorageProvider;

  try {
    // List files in root
    const files = await client.listFiles('/');
    console.log('Files in bucket:', files.length);
    files.forEach(f => console.log(`  - ${f.filename} (${f.type}, ${f.size} bytes)`));

    // Create a directory
    await client.createDirectory('/documents');
    console.log('Created directory: /documents');

    // Upload a file from buffer
    const content = Buffer.from('Hello, Hetzner Object Storage!');
    await client.uploadFile(content, '/documents/hello.txt', {
      contentType: 'text/plain'
    });
    console.log('Uploaded file: /documents/hello.txt');

    // Download and read the file
    const downloaded = await client.downloadFile('/documents/hello.txt') as Buffer;
    console.log('Downloaded content:', downloaded.toString());

    // Get file metadata
    const metadata = await client.getMetadata('/documents/hello.txt');
    console.log('File metadata:', {
      size: metadata.size,
      modified: metadata.lastModified,
      type: metadata.type,
      mime: metadata.mime
    });

    // Check if file exists
    const exists = await client.exists('/documents/hello.txt');
    console.log('File exists:', exists);

    // Copy a file
    await client.copyFile('/documents/hello.txt', '/documents/hello-copy.txt');
    console.log('Copied file');

    // Move a file
    await client.moveFile('/documents/hello-copy.txt', '/hello-moved.txt');
    console.log('Moved file');

    // Clean up
    await client.deleteFile('/documents');
    await client.deleteFile('/hello-moved.txt');
    console.log('Cleaned up');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

// ============================================================================
// EXAMPLE 11: Object Storage - Presigned URLs
// ============================================================================

async function example11_PresignedUrls() {
  console.log('\n=== Example 11: Presigned URLs ===\n');

  const client = HetznerStorageClient.createObjectClient({
    region: 'hel1',
  });

  try {
    // Upload a file first
    await client.uploadFile(
      Buffer.from('Shared content via presigned URL'),
      '/shared/report.pdf',
      { contentType: 'application/pdf' }
    );

    // Generate a presigned download URL (valid for 1 hour)
    const downloadUrl = await client.getPresignedDownloadUrl('/shared/report.pdf', {
      expiresIn: 3600
    });
    console.log('Download URL (1h):', downloadUrl);

    // Generate a presigned upload URL (valid for 30 minutes)
    const uploadUrl = await client.getPresignedUploadUrl('/shared/upload-target.pdf', {
      expiresIn: 1800,
      contentType: 'application/pdf'
    });
    console.log('Upload URL (30m):', uploadUrl);

    // Clean up
    await client.deleteFile('/shared/report.pdf');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

// ============================================================================
// EXAMPLE 12: Object Storage - Multipart Upload
// ============================================================================

async function example12_MultipartUpload() {
  console.log('\n=== Example 12: Multipart Upload ===\n');

  const client = HetznerStorageClient.createObjectClient({
    region: 'hel1',
  });

  try {
    const key = '/uploads/large-file.bin';

    // Initiate multipart upload
    const upload = await client.createMultipartUpload(key, 'application/octet-stream');
    console.log('Multipart upload started:', upload.uploadId);

    // Simulate uploading parts (minimum 5MB per part in real usage)
    const parts = [];
    for (let i = 1; i <= 3; i++) {
      const partData = Buffer.alloc(5 * 1024 * 1024, i); // 5MB per part
      const part = await client.uploadPart(key, upload.uploadId, i, partData);
      parts.push(part);
      console.log(`  Part ${i} uploaded, ETag: ${part.etag}`);
    }

    // Complete the multipart upload
    await client.completeMultipartUpload(key, upload.uploadId, parts);
    console.log('Multipart upload completed');

    // Verify the file
    const metadata = await client.getMetadata(key);
    console.log('Uploaded file size:', metadata.size, 'bytes');

    // Clean up
    await client.deleteFile(key);

  } catch (error) {
    console.error('Error:', error);
    // If upload fails, abort it to clean up parts
    // await client.abortMultipartUpload(key, upload.uploadId);
  } finally {
    await client.disconnect();
  }
}

// ============================================================================
// EXAMPLE 13: Object Storage - Bucket Management
// ============================================================================

async function example13_BucketManagement() {
  console.log('\n=== Example 13: Bucket Management ===\n');

  const client = HetznerStorageClient.createObjectClient({
    region: 'hel1',
  });

  try {
    // List all buckets
    const buckets = await client.listBuckets();
    console.log('Existing buckets:', buckets.length);
    buckets.forEach(b => {
      console.log(`  - ${b.name} (created: ${b.creationDate?.toISOString() || 'unknown'})`);
    });

    // Create a new bucket
    const newBucketName = `my-new-bucket-${Date.now()}`;
    await client.createBucket(newBucketName);
    console.log(`Created bucket: ${newBucketName}`);

    // Check if bucket exists
    const exists = await client.bucketExists(newBucketName);
    console.log(`Bucket ${newBucketName} exists:`, exists);

    // List objects with pagination
    const result = await client.listObjectsPaginated({
      prefix: 'logs/',
      maxKeys: 100
    });
    console.log(`\nObjects with prefix 'logs/':`);
    console.log(`  Found: ${result.files.length}`);
    console.log(`  Has more: ${result.isTruncated}`);

    // Delete the bucket (must be empty)
    await client.deleteBucket(newBucketName);
    console.log(`Deleted bucket: ${newBucketName}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.disconnect();
  }
}

// ============================================================================
// Run Examples
// ============================================================================

async function runExamples() {
  // Uncomment the examples you want to run:

  await Promise.all([
    example1_BasicStorageBox(),
    example10_ObjectStorageBasics(),
    example11_PresignedUrls(),
    example12_MultipartUpload(),
    example13_BucketManagement(),

    //  example3_RobotAPIManagement(),
    //  example4_SnapshotManagement(),
    //  example5_StorageShareBasics(),
    //  example6_PublicLinkSharing(),
    //  example7_UserGroupSharing(),
    //  example8_BackupSystem(),
    //  example9_FileSynchronization()
  ]);
  console.log('\n All examples completed\n');
}

// Run if executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  example1_BasicStorageBox,
  example3_RobotAPIManagement,
  example4_SnapshotManagement,
  example5_StorageShareBasics,
  example6_PublicLinkSharing,
  example7_UserGroupSharing,
  example8_BackupSystem,
  example9_FileSynchronization,
  example10_ObjectStorageBasics,
  example11_PresignedUrls,
  example12_MultipartUpload,
  example13_BucketManagement
};
