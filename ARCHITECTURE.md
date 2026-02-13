# Project Structure

```
hetzner-storage-sdk/
├── src/
│   ├── types/
│   │   └── index.ts                 # Type definitions and interfaces
│   ├── providers/
│   │   ├── BaseStorageProvider.ts   # Abstract base provider class
│   │   ├── StorageBoxProvider.ts    # Storage Box implementation
│   │   └── StorageShareProvider.ts  # Storage Share implementation
│   ├── utils/
│   │   ├── RobotApiClient.ts        # Hetzner Robot API client
│   │   └── OcsApiClient.ts          # Nextcloud OCS API client
│   ├── HetznerStorageClient.ts      # Main factory class
│   └── index.ts                     # Public API exports
├── examples/
│   └── usage-examples.ts            # Comprehensive usage examples
├── package.json                     # Project dependencies
├── tsconfig.json                    # TypeScript configuration
├── README.md                        # Documentation
└── .gitignore                       # Git ignore rules
```

## Module Overview

### Core Modules

#### `types/index.ts`
- All TypeScript interfaces and type definitions
- Configuration types for both Storage Box and Storage Share
- Response types for API calls
- File metadata structures

#### `providers/BaseStorageProvider.ts`
- Abstract base class defining the common interface
- All providers must implement these methods:
  - File operations (list, upload, download, delete)
  - Directory operations (create, move, copy)
  - Metadata operations (exists, getMetadata)
  - Connection management (disconnect)

#### `providers/StorageBoxProvider.ts`
- Implements BaseStorageProvider for Storage Box
- Supports both WebDAV  protocols
- Includes Robot API integration for management operations
- Snapshot management capabilities

#### `providers/StorageShareProvider.ts`
- Implements BaseStorageProvider for Storage Share
- Uses Nextcloud WebDAV API for file operations
- Includes OCS API integration for sharing features
- Public link and user/group sharing support

### Utility Modules

#### `utils/RobotApiClient.ts`
- Wrapper for Hetzner Robot API
- Handles authentication and error responses
- Methods for:
  - Listing and managing storage boxes
  - Toggling services (SSH, Samba, WebDAV)
  - Creating and managing snapshots

#### `utils/OcsApiClient.ts`
- Wrapper for Nextcloud OCS API
- Handles Nextcloud-specific authentication
- Methods for:
  - Creating public shares
  - Managing user and group shares
  - Updating and deleting shares

### Main Entry Point

#### `HetznerStorageClient.ts`
- Factory class that instantiates the correct provider
- Provides convenience methods for creating clients
- Type-safe configuration validation

## Design Patterns

### 1. Factory Pattern
The `HetznerStorageClient` class acts as a factory that creates the appropriate provider based on configuration:

```typescript
const client = HetznerStorageClient.create(config);
```

### 2. Provider Pattern
Both Storage Box and Storage Share implement the same `BaseStorageProvider` interface, allowing for:
- Consistent API across different storage types
- Easy switching between providers
- Extensibility for future storage types

### 3. Separation of Concerns
- **File Operations**: Handled by WebDAV/SFTP clients
- **Management Operations**: Handled by dedicated API clients
- **Type Safety**: All interfaces defined in separate types module

## Protocol Support

### Storage Box
- **WebDAV**: Default protocol, works with standard WebDAV clients

### Storage Share
- **WebDAV**: Nextcloud WebDAV implementation
- **OCS API**: Nextcloud-specific API for sharing features

## Authentication

### Storage Box
- **File Operations**: Basic Auth with storage credentials
- **Management**: Basic Auth with Robot API credentials (can be different)

### Storage Share
- **All Operations**: Basic Auth with Nextcloud credentials

## Error Handling

All API clients implement:
- Response interceptors for standardized error handling
- Custom `StorageError` type with additional context
- Proper error propagation to consumers

## Extension Points

The SDK is designed to be extensible:

1. **New Providers**: Extend `BaseStorageProvider`
2. **New Protocols**: Add to existing providers
3. **New Management APIs**: Create new utility clients
4. **Custom Error Handling**: Override error interceptors
