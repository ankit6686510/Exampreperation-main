import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';

export interface MonthlyPlan {
  id: string;
  subject: string;
  target: string;
  deadline: string;
  completed: boolean;
  createdAt: string;
}

interface MonthlyPlanState {
  plans: MonthlyPlan[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MonthlyPlanState = {
  plans: [],
  isLoading: false,
  error: null,
};

export const fetchMonthlyPlans = createAsyncThunk(
  'monthlyPlans/fetchMonthlyPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/monthly-plans');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch monthly plans');
    }
  }
);

export const addMonthlyPlan = createAsyncThunk(
  'monthlyPlans/addMonthlyPlan',
  async (planData: Omit<MonthlyPlan, 'id' | 'createdAt' | 'completed'>, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/monthly-plans', { ...planData, completed: false });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add plan');
    }
  }
);

export const updateMonthlyPlan = createAsyncThunk(
  'monthlyPlans/updateMonthlyPlan',
  async ({ id, data }: { id: string; data: Partial<MonthlyPlan> }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/monthly-plans/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update plan');
    }
  }
);

export const deleteMonthlyPlan = createAsyncThunk(
  'monthlyPlans/deleteMonthlyPlan',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/monthly-plans/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete plan');
    }
  }
);

const monthlyPlanSlice = createSlice({
  name: 'monthlyPlans',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlyPlans.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMonthlyPlans.fulfilled, (state, action: PayloadAction<MonthlyPlan[]>) => {
        state.isLoading = false;
        state.plans = action.payload;
      })
      .addCase(fetchMonthlyPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addMonthlyPlan.fulfilled, (state, action: PayloadAction<MonthlyPlan>) => {
        state.plans.push(action.payload);
      })
      .addCase(updateMonthlyPlan.fulfilled, (state, action: PayloadAction<MonthlyPlan>) => {
        const index = state.plans.findIndex((plan) => plan.id === action.payload.id);
        if (index !== -1) {
          state.plans[index] = action.payload;
        }
      })
      .addCase(deleteMonthlyPlan.fulfilled, (state, action: PayloadAction<string>) => {
        state.plans = state.plans.filter((plan) => plan.id !== action.payload);
      });
  },
});

export const { clearError } = monthlyPlanSlice.actions;
export default monthlyPlanSlice.reducer;
