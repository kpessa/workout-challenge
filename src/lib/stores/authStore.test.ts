import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore } from './authStore';
import type { User } from 'firebase/auth';

// Mock Firebase Auth functions
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockGoogleAuthProvider = vi.fn();

vi.mock('$lib/firebase', () => ({
  auth: {}
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  signInWithPopup: mockSignInWithPopup,
  GoogleAuthProvider: mockGoogleAuthProvider
}));

// Mock user object
const mockUser: Partial<User> = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg'
};

describe('Auth Store', () => {
  let unsubscribe: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    authStore.set({ user: null, loading: true });
  });

  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const state = get(authStore);
      expect(state.loading).toBe(true);
      expect(state.user).toBe(null);
    });

    it('should subscribe to auth state changes on initialization', () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // Simulate immediate auth state callback
        callback(mockUser as User);
        return () => {}; // Return unsubscribe function
      });

      authStore.initialize();

      expect(mockOnAuthStateChanged).toHaveBeenCalled();
      
      // Allow time for async operations
      setTimeout(() => {
        const state = get(authStore);
        expect(state.loading).toBe(false);
        expect(state.user).toEqual(mockUser);
      }, 0);
    });
  });

  describe('Sign In', () => {
    it('should sign in with email and password successfully', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      await authStore.signIn('test@example.com', 'password123');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });

    it('should handle sign in errors', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      await expect(authStore.signIn('test@example.com', 'wrong-password'))
        .rejects.toThrow(errorMessage);
    });

    it('should sign in with Google provider', async () => {
      mockSignInWithPopup.mockResolvedValue({
        user: mockUser
      });

      await authStore.signInWithGoogle();

      expect(mockGoogleAuthProvider).toHaveBeenCalled();
      expect(mockSignInWithPopup).toHaveBeenCalled();
    });
  });

  describe('Sign Up', () => {
    it('should create a new user account successfully', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      await authStore.signUp('newuser@example.com', 'password123');

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'password123'
      );
    });

    it('should handle sign up errors', async () => {
      const errorMessage = 'Email already in use';
      mockCreateUserWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      await expect(authStore.signUp('existing@example.com', 'password123'))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('Sign Out', () => {
    it('should sign out user successfully', async () => {
      mockSignOut.mockResolvedValue(undefined);

      // Set initial authenticated state
      authStore.set({ user: mockUser as User, loading: false });

      await authStore.signOut();

      expect(mockSignOut).toHaveBeenCalled();
      
      const state = get(authStore);
      expect(state.user).toBe(null);
    });

    it('should handle sign out errors', async () => {
      const errorMessage = 'Sign out failed';
      mockSignOut.mockRejectedValue(new Error(errorMessage));

      await expect(authStore.signOut())
        .rejects.toThrow(errorMessage);
    });
  });

  describe('Auth State Management', () => {
    it('should update store when user signs in', () => {
      authStore.set({ user: mockUser as User, loading: false });

      const state = get(authStore);
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBe(false);
    });

    it('should clear user when signed out', () => {
      authStore.set({ user: null, loading: false });

      const state = get(authStore);
      expect(state.user).toBe(null);
      expect(state.loading).toBe(false);
    });

    it('should handle loading states correctly', () => {
      // Initial loading
      authStore.set({ user: null, loading: true });
      let state = get(authStore);
      expect(state.loading).toBe(true);

      // After auth check
      authStore.set({ user: mockUser as User, loading: false });
      state = get(authStore);
      expect(state.loading).toBe(false);
    });
  });

  describe('Store Subscription', () => {
    it('should notify subscribers when auth state changes', () => {
      const mockSubscriber = vi.fn();
      
      unsubscribe = authStore.subscribe(mockSubscriber);

      // Initial call
      expect(mockSubscriber).toHaveBeenCalledTimes(1);

      // Update store
      authStore.set({ user: mockUser as User, loading: false });

      expect(mockSubscriber).toHaveBeenCalledTimes(2);
      expect(mockSubscriber).toHaveBeenLastCalledWith({
        user: mockUser,
        loading: false
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error('Network error')
      );

      await expect(authStore.signIn('test@example.com', 'password'))
        .rejects.toThrow('Network error');
    });

    it('should handle Firebase-specific errors', async () => {
      const firebaseError = {
        code: 'auth/user-not-found',
        message: 'User not found'
      };
      
      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(authStore.signIn('nonexistent@example.com', 'password'))
        .rejects.toMatchObject(firebaseError);
    });
  });
});