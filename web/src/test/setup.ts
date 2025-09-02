// Test setup for DOM environment
import { vi } from 'vitest'

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    pushState: vi.fn(),
    back: vi.fn(),
  }
})

// Mock window.alert
Object.defineProperty(window, 'alert', {
  value: vi.fn(),
})
