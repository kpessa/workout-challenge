import type { UserPreferences, Workout } from '$lib/types';

/**
 * Type definitions for chart components
 * Extracted from ProgressChart.svelte for better type safety and reusability
 */

export type ViewMode = 'week' | 'month';

export interface ProcessedWorkout {
  id: string;
  date: Date;
  duration: number;
  created_at: string;
  workout_type_id: string;
}

export interface WorkoutDay {
  date: Date;
  day: number;
  completed: boolean;
  workouts: ProcessedWorkout[];
  proposed: number;
  total: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

import type { ScaleBand, ScaleLinear } from 'd3';

export interface ChartScales {
  x: ScaleBand<string>;
  y: ScaleLinear<number, number>;
}

export interface ChartEvents {
  workoutClick: (event: { date: string; proposedDuration: number }) => void;
  editWorkout: (event: { date: string; duration: number; id: string }) => void;
  deleteWorkout: (event: { date: string; id: string }) => void;
  dateClick: (event: { date: string }) => void;
}

export interface AccessibilityConfig {
  showDataTable: boolean;
  announceChanges: boolean;
  enableKeyboardNavigation: boolean;
  focusedElementIndex: number;
  totalElements: number;
}

export interface FocusableChartElement {
  type: 'bar' | 'proposed' | 'date';
  date: string;
  workoutId?: string;
  data: WorkoutDay | ProcessedWorkout | null;
  element: Element;
}

export interface ChartConfig {
  viewMode: ViewMode;
  currentPage: number;
  containerWidth: number;
  containerHeight: number;
  isDataReady: boolean;
}

export interface NavigationConfig {
  currentPage: number;
  maxPages: number;
  canGoBack: boolean;
  canGoForward: boolean;
}