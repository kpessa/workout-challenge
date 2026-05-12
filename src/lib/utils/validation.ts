export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateWorkout(duration: number, date: string, workoutType: string | null): ValidationResult {
  const errors: string[] = [];
  
  // Validate duration
  if (!duration || duration <= 0) {
    errors.push("Duration must be greater than 0");
  } else if (duration > 1440) { // 24 hours in minutes
    errors.push("Duration cannot exceed 24 hours (1440 minutes)");
  } else if (!Number.isInteger(duration)) {
    errors.push("Duration must be a whole number");
  }
  
  // Validate date
  if (!date) {
    errors.push("Date is required");
  } else {
    // Parse date at noon to avoid timezone issues
    const parsedDate = new Date(date + 'T12:00:00');
    if (isNaN(parsedDate.getTime())) {
      errors.push("Invalid date format");
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      // Reset parsed date to start of day for comparison
      parsedDate.setHours(0, 0, 0, 0);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      if (parsedDate > todayStart) {
        errors.push("Cannot log workouts for future dates");
      }
      
      // Check if date is not too far in the past (e.g., 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (parsedDate < oneYearAgo) {
        errors.push("Date is too far in the past (max 1 year)");
      }
    }
  }
  
  // Validate workout type
  if (!workoutType) {
    errors.push("Workout type is required");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateWorkoutType(name: string, color: string): ValidationResult {
  const errors: string[] = [];
  
  // Validate name
  if (!name || name.trim().length === 0) {
    errors.push("Workout type name is required");
  } else if (name.trim().length > 50) {
    errors.push("Workout type name must be 50 characters or less");
  } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
    errors.push("Workout type name can only contain letters, numbers, spaces, hyphens, and underscores");
  }
  
  // Validate color
  if (!color) {
    errors.push("Color is required");
  } else if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    errors.push("Color must be a valid hex color (e.g., #FF5733)");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateChallengeSettings(
  challengeName: string,
  startDate: string,
  duration: number,
  dailyGoal: number
): ValidationResult {
  const errors: string[] = [];
  
  // Validate challenge name
  if (!challengeName || challengeName.trim().length === 0) {
    errors.push("Challenge name is required");
  } else if (challengeName.trim().length > 100) {
    errors.push("Challenge name must be 100 characters or less");
  }
  
  // Validate start date
  if (!startDate) {
    errors.push("Start date is required");
  } else {
    const parsedDate = new Date(startDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push("Invalid start date format");
    }
  }
  
  // Validate duration
  if (!duration || duration <= 0) {
    errors.push("Challenge duration must be greater than 0");
  } else if (duration > 365) {
    errors.push("Challenge duration cannot exceed 365 days");
  }
  
  // Validate daily goal
  if (!dailyGoal || dailyGoal <= 0) {
    errors.push("Daily goal must be greater than 0");
  } else if (dailyGoal > 1440) {
    errors.push("Daily goal cannot exceed 24 hours (1440 minutes)");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUserPreferences(
  daysPerWeek: number,
  startDate: string,
  sigmoid: {
    steepness: number;
    midpoint: number;
    minDuration: number;
    maxDuration: number;
  }
): ValidationResult {
  const errors: string[] = [];
  
  // Validate days per week
  if (!daysPerWeek || daysPerWeek < 1) {
    errors.push("Days per week must be at least 1");
  } else if (daysPerWeek > 7) {
    errors.push("Days per week cannot exceed 7");
  }
  
  // Validate start date
  if (!startDate) {
    errors.push("Start date is required");
  } else {
    const parsedDate = new Date(startDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push("Invalid start date format");
    }
  }
  
  // Validate sigmoid parameters
  if (sigmoid.steepness <= 0 || sigmoid.steepness > 1) {
    errors.push("Steepness must be between 0 and 1");
  }
  
  if (sigmoid.midpoint < 0 || sigmoid.midpoint > 90) {
    errors.push("Midpoint must be between 0 and 90 days");
  }
  
  if (sigmoid.minDuration < 1 || sigmoid.minDuration > 1440) {
    errors.push("Minimum duration must be between 1 and 1440 minutes");
  }
  
  if (sigmoid.maxDuration < sigmoid.minDuration) {
    errors.push("Maximum duration must be greater than minimum duration");
  } else if (sigmoid.maxDuration > 1440) {
    errors.push("Maximum duration cannot exceed 1440 minutes");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (password.length > 128) {
    errors.push("Password must be 128 characters or less");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}