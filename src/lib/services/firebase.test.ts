import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  saveWorkout, 
  getWorkouts, 
  updateWorkout, 
  deleteWorkout,
  saveUserPreferences,
  getUserPreferences 
} from './firebase';
import type { Workout } from '$lib/types';

// Mock Firebase Auth
const mockUser = { uid: 'test-user-123' };
const mockAuthState = { currentUser: mockUser };

vi.mock('$lib/firebase', () => ({
  auth: mockAuthState,
  db: {}
}));

// Mock Firestore functions
const mockAddDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  serverTimestamp: vi.fn(() => 'server-timestamp')
}));

describe('Firebase Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth state
    mockAuthState.currentUser = mockUser;
    
    // Setup default mock returns
    mockCollection.mockReturnValue('collection-ref');
    mockDoc.mockReturnValue('doc-ref');
    mockQuery.mockReturnValue('query-ref');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveWorkout', () => {
    it('should save a workout with user ID and timestamp', async () => {
      const mockWorkout: Partial<Workout> = {
        date: '2024-01-15',
        duration: 45,
        type: 'strength'
      };

      mockAddDoc.mockResolvedValue({ id: 'workout-123' });

      const result = await saveWorkout(mockWorkout);

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'users',
        'test-user-123',
        'workouts'
      );
      expect(mockAddDoc).toHaveBeenCalledWith(
        'collection-ref',
        expect.objectContaining({
          date: '2024-01-15',
          duration: 45,
          type: 'strength',
          user_id: 'test-user-123',
          created_at: 'server-timestamp',
          updated_at: 'server-timestamp'
        })
      );
      expect(result).toEqual({ id: 'workout-123' });
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuthState.currentUser = null;

      await expect(saveWorkout({ date: '2024-01-15', duration: 30 }))
        .rejects.toThrow('User not authenticated');
    });

    it('should handle Firestore errors gracefully', async () => {
      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(saveWorkout({ date: '2024-01-15', duration: 30 }))
        .rejects.toThrow('Firestore error');
    });
  });

  describe('getWorkouts', () => {
    it('should retrieve all workouts for authenticated user', async () => {
      const mockWorkouts = [
        { id: 'w1', data: () => ({ date: '2024-01-01', duration: 30, type: 'cardio' }) },
        { id: 'w2', data: () => ({ date: '2024-01-02', duration: 45, type: 'strength' }) }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockWorkouts,
        empty: false
      });

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const result = await getWorkouts(startDate, endDate);

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'users',
        'test-user-123',
        'workouts'
      );
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledTimes(2); // For date range
      expect(mockOrderBy).toHaveBeenCalledWith('date', 'asc');
      
      expect(result).toEqual([
        { id: 'w1', date: '2024-01-01', duration: 30, type: 'cardio' },
        { id: 'w2', date: '2024-01-02', duration: 45, type: 'strength' }
      ]);
    });

    it('should return empty array when no workouts exist', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
        empty: true
      });

      const result = await getWorkouts('2024-01-01', '2024-01-31');
      expect(result).toEqual([]);
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuthState.currentUser = null;

      await expect(getWorkouts('2024-01-01', '2024-01-31'))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('updateWorkout', () => {
    it('should update an existing workout', async () => {
      const workoutId = 'workout-123';
      const updates = { duration: 60, type: 'yoga' };

      mockUpdateDoc.mockResolvedValue(undefined);

      await updateWorkout(workoutId, updates);

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'users',
        'test-user-123',
        'workouts',
        workoutId
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'doc-ref',
        expect.objectContaining({
          duration: 60,
          type: 'yoga',
          updated_at: 'server-timestamp'
        })
      );
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuthState.currentUser = null;

      await expect(updateWorkout('workout-123', { duration: 60 }))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('deleteWorkout', () => {
    it('should delete a workout', async () => {
      const workoutId = 'workout-123';

      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteWorkout(workoutId);

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'users',
        'test-user-123',
        'workouts',
        workoutId
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref');
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuthState.currentUser = null;

      await expect(deleteWorkout('workout-123'))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('User Preferences', () => {
    describe('saveUserPreferences', () => {
      it('should save user preferences', async () => {
        const preferences = {
          weekStartsOn: 'monday',
          defaultDuration: 45
        };

        mockSetDoc.mockResolvedValue(undefined);

        await saveUserPreferences(preferences);

        expect(mockDoc).toHaveBeenCalledWith(
          expect.anything(),
          'users',
          'test-user-123'
        );
        expect(mockSetDoc).toHaveBeenCalledWith(
          'doc-ref',
          expect.objectContaining({
            weekStartsOn: 'monday',
            defaultDuration: 45,
            user_id: 'test-user-123',
            updated_at: expect.any(String)
          }),
          { merge: true }
        );
      });
    });

    describe('getUserPreferences', () => {
      it('should retrieve user preferences', async () => {
        const mockPreferences = {
          weekStartsOn: 'sunday',
          defaultDuration: 30
        };

        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => mockPreferences
        });

        const result = await getUserPreferences();

        expect(mockDoc).toHaveBeenCalledWith(
          expect.anything(),
          'users',
          'test-user-123'
        );
        expect(result).toEqual(mockPreferences);
      });

      it('should return null when preferences do not exist', async () => {
        mockGetDoc.mockResolvedValue({
          exists: () => false,
          data: () => null
        });

        const result = await getUserPreferences();
        expect(result).toBeNull();
      });
    });
  });
});