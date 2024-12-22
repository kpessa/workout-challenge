/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Logs an error with context
 * @param error The error to log
 * @param context The context in which the error occurred
 */
export function logError(error: unknown, context: string): void {
  if (error instanceof Error) {
    console.error(`Error in ${context}:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } else {
    console.error(`Unknown error in ${context}:`, error);
  }
}

/**
 * Checks if an error is a ValidationError
 * @param error The error to check
 * @returns true if the error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Formats an error message for display
 * @param error The error to format
 * @returns A user-friendly error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }
  if (error instanceof Error) {
    return 'An unexpected error occurred. Please try again.';
  }
  return 'Something went wrong. Please try again.';
} 