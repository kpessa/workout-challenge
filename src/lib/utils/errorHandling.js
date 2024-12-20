// Custom error types
export class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error logging utility
export function logError(error, context = '') {
  console.error(`[${error.name}] ${context}: ${error.message}`);
  // You could add additional error reporting here (e.g., to a service)
} 