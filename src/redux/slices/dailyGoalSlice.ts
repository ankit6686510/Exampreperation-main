import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';

export interface DailyGoal {
  id: string;
  task: string;
  completed: boolean;
  date: string;
  createdAt: string;
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
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch daily goals');
    }
  }
);

export const addDailyGoal = createAsyncThunk(
  'dailyGoals/addDailyGoal',
  async (goalData: { task: string; date: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/daily-goals', { ...goalData, completed: false });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add goal');
    }
  }
);

export const toggleDailyGoal = createAsyncThunk(
  'dailyGoals/toggleDailyGoal',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/daily-goals/${id}/toggle`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle goal');
    }
  }
);

export const deleteDailyGoal = createAsyncThunk(
  'dailyGoals/deleteDailyGoal',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/daily-goals/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete goal');
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
      .addCase(fetchDailyGoals.fulfilled, (state, action: PayloadAction<DailyGoal[]>) => {
        state.isLoading = false;
        state.goals = action.payload;
      })
      .addCase(fetchDailyGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addDailyGoal.fulfilled, (state, action: PayloadAction<DailyGoal>) => {
        state.goals.push(action.payload);
      })
      .addCase(toggleDailyGoal.fulfilled, (state, action: PayloadAction<DailyGoal>) => {
        const index = state.goals.findIndex((goal) => goal.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      })
      .addCase(deleteDailyGoal.fulfilled, (state, action: PayloadAction<string>) => {
        state.goals = state.goals.filter((goal) => goal.id !== action.payload);
      });
  },
});

export const { clearError } = dailyGoalSlice.actions;
export default dailyGoalSlice.reducer;
