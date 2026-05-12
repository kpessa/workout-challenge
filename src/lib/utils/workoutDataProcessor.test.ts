import { describe, it, expect } from 'vitest';
import { calculateCurrentPage, calculatePageDateRange } from './workoutDataProcessor';
import type { UserPreferences } from '$lib/types';

/**
 * Test suite for workout data processor utilities
 * Demonstrates the testability benefits of the refactored code
 */

describe('workoutDataProcessor', () => {
  const mockUserPreferences: UserPreferences = {
    startDate: '2025-01-01',
    daysPerWeek: 3,
    sigmoid: {
      initialMinutes: 10,
      targetMinutes: 30,
      weeklyIncrease: 2,
      plateauWeeks: 8
    }
  };

  describe('calculateCurrentPage', () => {
    it('should calculate correct page for week view', () => {
      // Mock today as January 15, 2025 (2 weeks after start)
      const originalDate = Date;
      global.Date = class extends Date {
        constructor(...args: ConstructorParameters<typeof Date>) {
          if (args.length === 0) {
            super('2025-01-15T00:00:00.000Z');
          } else {
            super(...args);
          }
        }
      } as unknown as DateConstructor;

      const page = calculateCurrentPage(mockUserPreferences, 'week');
      expect(page).toBe(2); // Should be in week 2

      global.Date = originalDate;
    });

    it('should calculate correct page for month view', () => {
      const originalDate = Date;
      global.Date = class extends Date {
        constructor(...args: ConstructorParameters<typeof Date>) {
          if (args.length === 0) {
            super('2025-01-15T00:00:00.000Z');
          } else {
            super(...args);
          }
        }
      } as unknown as DateConstructor;

      const page = calculateCurrentPage(mockUserPreferences, 'month');
      expect(page).toBe(0); // Should be in month 0 (first month)

      global.Date = originalDate;
    });

    it('should handle null user preferences', () => {
      const page = calculateCurrentPage(null as unknown as UserPreferences, 'week');
      expect(page).toBe(0);
    });
  });

  describe('calculatePageDateRange', () => {
    it('should calculate correct date range for week view', () => {
      const startDate = new Date('2025-01-01'); // Wednesday
      const { pageStartDate, pageEndDate } = calculatePageDateRange(startDate, 0, 'week');
      
      // Should start from the Sunday before (2024-12-29)
      expect(pageStartDate.getDay()).toBe(0); // Sunday
      expect(pageEndDate.getTime() - pageStartDate.getTime()).toBe(6 * 24 * 60 * 60 * 1000); // 6 days difference
    });

    it('should calculate correct date range for month view', () => {
      const startDate = new Date('2025-01-01');
      const { pageStartDate, pageEndDate } = calculatePageDateRange(startDate, 0, 'month');
      
      expect(pageEndDate.getTime() - pageStartDate.getTime()).toBe(29 * 24 * 60 * 60 * 1000); // 29 days difference
    });

    it('should handle different pages correctly', () => {
      const startDate = new Date('2025-01-01');
      const week1 = calculatePageDateRange(startDate, 1, 'week');
      const week0 = calculatePageDateRange(startDate, 0, 'week');
      
      // Week 1 should start 7 days after week 0
      expect(week1.pageStartDate.getTime() - week0.pageStartDate.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });
});