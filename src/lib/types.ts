export interface SigmoidParams {
  steepness: number;
  midpoint: number;
  minDuration: number;
  maxDuration: number;
}

export interface UserPreferences {
  startDate: string;
  daysPerWeek: number;
  sigmoidParams: SigmoidParams;
}

export interface WorkoutType {
  id: string;
  name: string;
  color: string;
  created_at?: string;
  user_id?: string;
}

export interface Workout {
  id: string;
  date: string;
  duration: number;
  workout_type_id?: string;
  created_at?: string;
  user_id?: string;
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

export interface AuthState {
  user: {
    id: string;
    email: string;
  } | null;
  loading: boolean;
}

export interface User {
  id: string;
  email: string;
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
 