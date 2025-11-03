import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';
import type { ApiError, DailyGoal as ApiDailyGoal } from '@/types/api';

export interface DailyGoal {
  id: string;
  task: string;
  completed: boolean;
  date: string;
  createdAt: string;
  _id?: string;
  user?: string;
  title?: string;
  description?: string;
  tasks?: any[];
  targetHours?: number;
  actualHours?: number;
  updatedAt?: string;
}

interface DailyGoalState {
  goals: DailyGoal[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DailyGoalState = {
  goals: [],
  isLoading: false,
  error: null,
};

export const fetchDailyGoals = createAsyncThunk(
  'dailyGoals/fetchDailyGoals',
  async (date: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/daily-goals?date=${date}`);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message || 'Failed to fetch daily goals');
    }
  }
);

export const addDailyGoal = createAsyncThunk(
  'dailyGoals/addDailyGoal',
  async (goalData: { task: string; date: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/daily-goals', goalData);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message || 'Failed to add goal');
    }
  }
);

export const toggleDailyGoal = createAsyncThunk(
  'dailyGoals/toggleDailyGoal',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/daily-goals/${id}/toggle`);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message || 'Failed to toggle goal');
    }
  }
);

export const deleteDailyGoal = createAsyncThunk(
  'dailyGoals/deleteDailyGoal',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/daily-goals/${id}`);
      return id;
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message || 'Failed to delete goal');
    }
  }
);

const dailyGoalSlice = createSlice({
  name: 'dailyGoals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyGoals.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDailyGoals.fulfilled, (state, action: PayloadAction<{ data?: DailyGoal[] } | DailyGoal[]>) => {
        state.isLoading = false;
        // Handle different API response formats and map _id to id
        const goalsData = Array.isArray(action.payload) 
          ? action.payload 
          : Array.isArray(action.payload?.data) 
            ? action.payload.data 
            : [];
            
        state.goals = goalsData.map((goal) => ({
          ...goal,
          id: (goal as { _id?: string; id: string })._id || goal.id
        }));
      })
      .addCase(fetchDailyGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addDailyGoal.fulfilled, (state, action: PayloadAction<{ data?: DailyGoal } | DailyGoal>) => {
        const goalData = 'data' in action.payload ? action.payload.data : action.payload;
        if (goalData) {
          const rawGoal = goalData as any;
          const newGoal: DailyGoal = {
            task: rawGoal.task || rawGoal.title || '',
            completed: rawGoal.completed || false,
            date: rawGoal.date || '',
            createdAt: rawGoal.createdAt || '',
            id: rawGoal._id || rawGoal.id,
            ...rawGoal
          };
          state.goals.push(newGoal);
        }
      })
      .addCase(toggleDailyGoal.fulfilled, (state, action: PayloadAction<{ data?: DailyGoal } | DailyGoal>) => {
        const goalData = 'data' in action.payload ? action.payload.data : action.payload;
        if (goalData) {
          const rawGoal = goalData as any;
          const updatedGoal: DailyGoal = {
            task: rawGoal.task || rawGoal.title || '',
            completed: rawGoal.completed || false,
            date: rawGoal.date || '',
            createdAt: rawGoal.createdAt || '',
            id: rawGoal._id || rawGoal.id,
            ...rawGoal
          };
          const index = state.goals.findIndex((goal) => goal.id === updatedGoal.id);
          if (index !== -1) {
            state.goals[index] = updatedGoal;
          }
        }
      })
      .addCase(deleteDailyGoal.fulfilled, (state, action: PayloadAction<string>) => {
        state.goals = state.goals.filter((goal) => goal.id !== action.payload);
      });
  },
});

export const { clearError } = dailyGoalSlice.actions;
export default dailyGoalSlice.reducer;
