export interface WorkoutType {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Workout {
  id: string;
  date: string;
  duration: number;
  workout_type_id: string;
  workout_type?: WorkoutType;
  user_id: string;
  created_at: string;
}

export interface WorkoutClickEvent {
  date: string;
  proposedDuration: number;
}

export interface EditWorkoutEvent {
  id: string;
  date: string;
  duration: number;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export interface ScheduleState {
  workouts: Workout[];
  startDate: string;
  duration: number;
}

export interface CalendarWorkout extends Workout {
  completed: boolean;
  workouts: Workout[];
  targetDuration: number;
  day: number;
  proposed: number;
  total: number;
}

export interface SigmoidParams {
  startMinutes: number;
  endMinutes: number;
  steepness: number;
  midpoint: number;
} 