import { describe, it, expect } from 'vitest';
import {
  validateWorkout,
  validateWorkoutType,
  validateUserPreferences,
  sanitizeInput,
  validateEmail,
  validatePassword
} from './validation';

describe('validateWorkout', () => {
  it('should accept valid workout data', () => {
    const today = new Date();
    const validDate = today.toISOString().split('T')[0];
    const result = validateWorkout(30, validDate, 'workout-1');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid duration', () => {
    const today = new Date();
    const validDate = today.toISOString().split('T')[0];
    const result = validateWorkout(0, validDate, 'workout-1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duration must be greater than 0');
  });

  it('should reject duration over 24 hours', () => {
    const today = new Date();
    const validDate = today.toISOString().split('T')[0];
    const result = validateWorkout(1441, validDate, 'workout-1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duration cannot exceed 24 hours (1440 minutes)');
  });

  it('should reject future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const result = validateWorkout(30, futureDate.toISOString().split('T')[0], 'workout-1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Cannot log workouts for future dates');
  });

  it('should reject missing workout type', () => {
    const today = new Date();
    const validDate = today.toISOString().split('T')[0];
    const result = validateWorkout(30, validDate, null);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Workout type is required');
  });
});

describe('validateWorkoutType', () => {
  it('should accept valid workout type', () => {
    const result = validateWorkoutType('Running', '#FF5733');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty name', () => {
    const result = validateWorkoutType('', '#FF5733');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Workout type name is required');
  });

  it('should reject invalid characters in name', () => {
    const result = validateWorkoutType('Running@#$', '#FF5733');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Workout type name can only contain letters, numbers, spaces, hyphens, and underscores');
  });

  it('should reject invalid hex color', () => {
    const result = validateWorkoutType('Running', 'not-a-color');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Color must be a valid hex color (e.g., #FF5733)');
  });
});

describe('validateUserPreferences', () => {
  const validSigmoid = {
    steepness: 0.1,
    midpoint: 30,
    minDuration: 30,
    maxDuration: 60
  };

  it('should accept valid preferences', () => {
    const result = validateUserPreferences(3, '2024-01-15', validSigmoid);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid days per week', () => {
    const result = validateUserPreferences(8, '2024-01-15', validSigmoid);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Days per week cannot exceed 7');
  });

  it('should reject invalid sigmoid steepness', () => {
    const result = validateUserPreferences(3, '2024-01-15', {
      ...validSigmoid,
      steepness: 1.5
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Steepness must be between 0 and 1');
  });

  it('should reject max duration less than min duration', () => {
    const result = validateUserPreferences(3, '2024-01-15', {
      ...validSigmoid,
      minDuration: 60,
      maxDuration: 30
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Maximum duration must be greater than minimum duration');
  });
});

describe('sanitizeInput', () => {
  it('should escape HTML special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const sanitized = sanitizeInput(input);
    expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('should handle normal text without modification', () => {
    const input = 'Normal workout name';
    const sanitized = sanitizeInput(input);
    expect(sanitized).toBe('Normal workout name');
  });
});

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should accept valid passwords', () => {
    const result = validatePassword('securePassword123');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject short passwords', () => {
    const result = validatePassword('short');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  it('should reject extremely long passwords', () => {
    const longPassword = 'a'.repeat(129);
    const result = validatePassword(longPassword);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be 128 characters or less');
  });
});