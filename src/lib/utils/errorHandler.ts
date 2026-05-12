/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

import type { FirebaseError } from 'firebase/app';

export interface ErrorContext {
  context: string;
  error: unknown;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface UserFriendlyError {
  message: string;
  code?: string;
  retry?: boolean;
}

/**
 * Maps Firebase auth errors to user-friendly messages
 */
const AUTH_ERROR_MAP: Record<string, string> = {
  'auth/invalid-credential': 'Invalid email or password',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'An account already exists with this email',
  'auth/weak-password': 'Password should be at least 6 characters',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/user-disabled': 'This account has been disabled',
  'auth/requires-recent-login': 'Please sign in again to continue',
  'auth/popup-closed-by-user': 'Sign-in cancelled',
  'auth/popup-blocked': 'Please allow popups for authentication'
};

/**
 * Maps Firestore errors to user-friendly messages
 */
const FIRESTORE_ERROR_MAP: Record<string, string> = {
  'permission-denied': 'You don\'t have permission to perform this action',
  'unavailable': 'Service temporarily unavailable. Please try again',
  'deadline-exceeded': 'Request timed out. Please try again',
  'resource-exhausted': 'Quota exceeded. Please try again later',
  'failed-precondition': 'Operation failed. Please refresh and try again',
  'aborted': 'Operation was cancelled',
  'out-of-range': 'Invalid data range',
  'unimplemented': 'Feature not available',
  'internal': 'An internal error occurred',
  'data-loss': 'Data may have been lost. Please refresh',
  'unauthenticated': 'Please sign in to continue'
};

/**
 * Handles authentication errors
 */
export function handleAuthError(error: unknown): UserFriendlyError {
  if (isFirebaseError(error)) {
    const message = AUTH_ERROR_MAP[error.code] || 'Authentication failed. Please try again';
    return {
      message,
      code: error.code,
      retry: !['auth/user-disabled', 'auth/email-already-in-use'].includes(error.code)
    };
  }
  
  return {
    message: 'An unexpected error occurred during authentication',
    retry: true
  };
}

/**
 * Handles Firestore database errors
 */
export function handleFirestoreError(error: unknown): UserFriendlyError {
  if (isFirebaseError(error)) {
    const message = FIRESTORE_ERROR_MAP[error.code] || 'Database operation failed. Please try again';
    return {
      message,
      code: error.code,
      retry: !['permission-denied', 'unauthenticated'].includes(error.code)
    };
  }
  
  return {
    message: 'Failed to save data. Please try again',
    retry: true
  };
}

/**
 * Handles validation errors
 */
export function handleValidationError(errors: string[]): UserFriendlyError {
  return {
    message: errors.join('. '),
    code: 'validation-error',
    retry: false
  };
}

/**
 * Handles network errors
 */
export function handleNetworkError(error: unknown): UserFriendlyError {
  if (error instanceof Error && error.message.includes('network')) {
    return {
      message: 'Network connection lost. Please check your internet connection',
      code: 'network-error',
      retry: true
    };
  }
  
  return {
    message: 'Connection error. Please try again',
    code: 'connection-error',
    retry: true
  };
}

/**
 * Main error handler that determines error type and returns appropriate message
 */
export function handleError(context: ErrorContext): UserFriendlyError {
  const { error } = context;
  
  // Log error for debugging (in development only)
  if (import.meta.env.DEV) {
    logError(context);
  }
  
  // Check for specific error types
  if (isFirebaseError(error)) {
    if (error.code.startsWith('auth/')) {
      return handleAuthError(error);
    }
    return handleFirestoreError(error);
  }
  
  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return handleNetworkError(error);
    }
  }
  
  // Default error
  return {
    message: 'An unexpected error occurred. Please try again',
    code: 'unknown-error',
    retry: true
  };
}

/**
 * Logs error for debugging (development only)
 */
export function logError(context: ErrorContext): void {
  const { context: contextName, error, userId, metadata } = context;
  
  if (import.meta.env.DEV) {
    console.group(`🔴 Error in ${contextName}`);
    console.error('Error:', error);
    if (userId) console.log('User ID:', userId);
    if (metadata) console.log('Metadata:', metadata);
    console.trace();
    console.groupEnd();
  }
  
  // In production, you could send to error monitoring service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Type guard to check if error is a Firebase error
 */
function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string'
  );
}

/**
 * Creates a toast-friendly error message
 */
export function getToastError(error: UserFriendlyError): {
  title: string;
  description: string;
  variant: 'destructive' | 'warning';
} {
  return {
    title: error.retry ? 'Error' : 'Action Required',
    description: error.message,
    variant: error.retry ? 'warning' : 'destructive'
  };
}

/**
 * Retry utility for operations that may fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const errorInfo = handleError({ context, error });
      
      if (!errorInfo.retry || i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
}