# Testing Guide

This project uses [Vitest](https://vitest.dev/) for testing.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Structure

- Unit tests are colocated with source files using the `.test.ts` extension
- Test setup and global configuration is in `tests/setup.ts`
- Vitest configuration is in `vite.config.ts`

## Writing Tests

Tests use Vitest's API which is similar to Jest:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup code
  });

  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

## Mocking

Use Vitest's `vi` API for mocking:

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('./module', () => ({
  myFunction: vi.fn(() => 'mocked value'),
}));

// Mock environment variables
process.env.MY_VAR = 'test-value';
```

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

Coverage thresholds and excluded files are configured in `vite.config.ts`.
