import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup test environment
beforeAll(() => {
  // Add any global test setup here
});

afterAll(() => {
  // Add any global test teardown here
});
