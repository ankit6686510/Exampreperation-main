import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { studySessionApi, StudySession, CreateStudySessionRequest, StudyAnalytics } from '../../api/studySessionApi';

interface StudySessionState {
  sessions: StudySession[];
  currentSession: StudySession | null;
  analytics: StudyAnalytics | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    current: number;
    pages: number;
    total: number;
  } | null;
}

const initialState: StudySessionState = {
  sessions: [],
  currentSession: null,
  analytics: null,
  isLoading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const createStudySession = createAsyncThunk(
  'studySessions/create',
  async (sessionData: CreateStudySessionRequest, { rejectWithValue }) => {
    try {
      const session = await studySessionApi.createSession(sessionData);
      return session;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create study session');
    }
  }
);

export const fetchStudySessions = createAsyncThunk(
  'studySessions/fetchAll',
  async (params: {
    page?: number;
    limit?: number;
    subject?: string;
    startDate?: string;
    endDate?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await studySessionApi.getSessions(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch study sessions');
    }
  }
);

export const fetchStudySession = createAsyncThunk(
  'studySessions/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const session = await studySessionApi.getSession(id);
      return session;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch study session');
    }
  }
);

export const updateStudySession = createAsyncThunk(
  'studySessions/update',
  async ({ id, data }: { id: string; data: Partial<CreateStudySessionRequest> }, { rejectWithValue }) => {
    try {
      const session = await studySessionApi.updateSession(id, data);
      return session;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update study session');
    }
  }
);

export const deleteStudySession = createAsyncThunk(
  'studySessions/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await studySessionApi.deleteSession(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete study session');
    }
  }
);

export const fetchStudyAnalytics = createAsyncThunk(
  'studySessions/fetchAnalytics',
  async (period: '7d' | '30d' | '90d' = '7d', { rejectWithValue }) => {
    try {
      const analytics = await studySessionApi.getAnalytics(period);
      return analytics;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

const studySessionSlice = createSlice({
  name: 'studySessions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
    clearSessions: (state) => {
      state.sessions = [];
      state.pagination = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create study session
      .addCase(createStudySession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createStudySession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions.unshift(action.payload);
      })
      .addCase(createStudySession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch study sessions
      .addCase(fetchStudySessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudySessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload.data;
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchStudySessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch single study session
      .addCase(fetchStudySession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudySession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload;
      })
      .addCase(fetchStudySession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update study session
      .addCase(updateStudySession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStudySession.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.sessions.findIndex(session => session._id === action.payload._id);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        if (state.currentSession?._id === action.payload._id) {
          state.currentSession = action.payload;
        }
      })
      .addCase(updateStudySession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete study session
      .addCase(deleteStudySession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteStudySession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = state.sessions.filter(session => session._id !== action.payload);
        if (state.currentSession?._id === action.payload) {
          state.currentSession = null;
        }
      })
      .addCase(deleteStudySession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch analytics
      .addCase(fetchStudyAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudyAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchStudyAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentSession, clearSessions } = studySessionSlice.actions;
export default studySessionSlice.reducer;
