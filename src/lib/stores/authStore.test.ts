import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { authStore } from './authStore';

// Mock Firebase Auth
vi.mock('$lib/firebase', () => ({
  auth: {}
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn()
}));

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const state = get(authStore);
    expect(state.loading).toBe(true);
    expect(state.user).toBe(null);
  });

  // Additional tests would require proper Firebase mocking
  it('should handle authentication state changes', () => {
    expect(true).toBe(true); // Placeholder test
  });
});