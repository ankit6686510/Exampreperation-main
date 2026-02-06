import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as newspaperApi from '@/api/newspaperAnalysisApi';
import type { NewspaperAnalysis, MonthlyStats, TimelineData, CategoryTrend, RevisionReminder } from '@/api/newspaperAnalysisApi';

interface NewspaperAnalysisState {
  analyses: NewspaperAnalysis[];
  currentAnalysis: NewspaperAnalysis | null;
  monthlyStats: MonthlyStats[];
  timeline: TimelineData[];
  categoryTrends: CategoryTrend[];
  revisionReminders: RevisionReminder[];
  bookmarkedArticles: any[];
  searchResults: any[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: {
    source?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    priority?: string;
    limit?: number;
    skip?: number;
  };
}

const initialState: NewspaperAnalysisState = {
  analyses: [],
  currentAnalysis: null,
  monthlyStats: [],
  timeline: [],
  categoryTrends: [],
  revisionReminders: [],
  bookmarkedArticles: [],
  searchResults: [],
  total: 0,
  loading: false,
  error: null,
  filters: {
    limit: 20,
    skip: 0,
  },
};

export const fetchNewspaperAnalyses = createAsyncThunk(
  'newspaperAnalysis/fetchAnalyses',
  async (params?: any) => {
    return await newspaperApi.getNewspaperAnalyses(params);
  }
);

export const fetchAnalysisById = createAsyncThunk(
  'newspaperAnalysis/fetchById',
  async (id: string) => {
    return await newspaperApi.getNewspaperAnalysis(id);
  }
);

export const fetchAnalysisByDate = createAsyncThunk(
  'newspaperAnalysis/fetchByDate',
  async (date: string) => {
    return await newspaperApi.getAnalysisByDate(date);
  }
);

export const createOrUpdateNewspaperAnalysis = createAsyncThunk(
  'newspaperAnalysis/createOrUpdate',
  async (data: Partial<NewspaperAnalysis>) => {
    return await newspaperApi.createOrUpdateAnalysis(data);
  }
);

export const addArticleToAnalysis = createAsyncThunk(
  'newspaperAnalysis/addArticle',
  async ({ analysisId, article }: { analysisId: string; article: any }) => {
    return await newspaperApi.addArticle(analysisId, article);
  }
);

export const updateAnalysisArticle = createAsyncThunk(
  'newspaperAnalysis/updateArticle',
  async ({ analysisId, articleId, updates }: { analysisId: string; articleId: string; updates: any }) => {
    return await newspaperApi.updateArticle(analysisId, articleId, updates);
  }
);

export const deleteAnalysisArticle = createAsyncThunk(
  'newspaperAnalysis/deleteArticle',
  async ({ analysisId, articleId }: { analysisId: string; articleId: string }) => {
    return await newspaperApi.deleteArticle(analysisId, articleId);
  }
);

export const fetchMonthlyStats = createAsyncThunk(
  'newspaperAnalysis/fetchMonthlyStats',
  async ({ year, month }: { year: number; month: number }) => {
    return await newspaperApi.getMonthlyStats(year, month);
  }
);

export const fetchTimeline = createAsyncThunk(
  'newspaperAnalysis/fetchTimeline',
  async (days: number = 30) => {
    return await newspaperApi.getTimeline(days);
  }
);

export const fetchCategoryTrends = createAsyncThunk(
  'newspaperAnalysis/fetchCategoryTrends',
  async (days: number = 30) => {
    return await newspaperApi.getCategoryTrends(days);
  }
);

export const fetchRevisionReminders = createAsyncThunk(
  'newspaperAnalysis/fetchRevisionReminders',
  async () => {
    return await newspaperApi.getRevisionReminders();
  }
);

export const toggleArticleBookmark = createAsyncThunk(
  'newspaperAnalysis/toggleBookmark',
  async ({ analysisId, articleId }: { analysisId: string; articleId: string }) => {
    return await newspaperApi.toggleBookmark(analysisId, articleId);
  }
);

export const fetchBookmarkedArticles = createAsyncThunk(
  'newspaperAnalysis/fetchBookmarks',
  async () => {
    return await newspaperApi.getBookmarkedArticles();
  }
);

export const searchNewspaperArticles = createAsyncThunk(
  'newspaperAnalysis/search',
  async ({ query, filters }: { query: string; filters?: any }) => {
    return await newspaperApi.searchArticles(query, filters);
  }
);

const newspaperAnalysisSlice = createSlice({
  name: 'newspaperAnalysis',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentAnalysis: (state) => {
      state.currentAnalysis = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch analyses
      .addCase(fetchNewspaperAnalyses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNewspaperAnalyses.fulfilled, (state, action) => {
        state.loading = false;
        state.analyses = action.payload.analyses;
        state.total = action.payload.total;
      })
      .addCase(fetchNewspaperAnalyses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch analyses';
      })

      // Fetch by ID
      .addCase(fetchAnalysisById.fulfilled, (state, action) => {
        state.currentAnalysis = action.payload;
      })

      // Fetch by date
      .addCase(fetchAnalysisByDate.fulfilled, (state, action) => {
        state.currentAnalysis = action.payload;
      })

      // Create or update
      .addCase(createOrUpdateNewspaperAnalysis.fulfilled, (state, action) => {
        state.currentAnalysis = action.payload;
        const index = state.analyses.findIndex((a) => a._id === action.payload._id);
        if (index !== -1) {
          state.analyses[index] = action.payload;
        } else {
          state.analyses.unshift(action.payload);
          state.total += 1;
        }
      })

      // Add article
      .addCase(addArticleToAnalysis.fulfilled, (state, action) => {
        state.currentAnalysis = action.payload;
        const index = state.analyses.findIndex((a) => a._id === action.payload._id);
        if (index !== -1) {
          state.analyses[index] = action.payload;
        }
      })

      // Update article
      .addCase(updateAnalysisArticle.fulfilled, (state, action) => {
        state.currentAnalysis = action.payload;
        const index = state.analyses.findIndex((a) => a._id === action.payload._id);
        if (index !== -1) {
          state.analyses[index] = action.payload;
        }
      })

      // Delete article
      .addCase(deleteAnalysisArticle.fulfilled, (state, action) => {
        state.currentAnalysis = action.payload;
        const index = state.analyses.findIndex((a) => a._id === action.payload._id);
        if (index !== -1) {
          state.analyses[index] = action.payload;
        }
      })

      // Monthly stats
      .addCase(fetchMonthlyStats.fulfilled, (state, action) => {
        state.monthlyStats = action.payload;
      })

      // Timeline
      .addCase(fetchTimeline.fulfilled, (state, action) => {
        state.timeline = action.payload;
      })

      // Category trends
      .addCase(fetchCategoryTrends.fulfilled, (state, action) => {
        state.categoryTrends = action.payload;
      })

      // Revision reminders
      .addCase(fetchRevisionReminders.fulfilled, (state, action) => {
        state.revisionReminders = action.payload;
      })

      // Toggle bookmark
      .addCase(toggleArticleBookmark.fulfilled, (state, action) => {
        state.currentAnalysis = action.payload;
        const index = state.analyses.findIndex((a) => a._id === action.payload._id);
        if (index !== -1) {
          state.analyses[index] = action.payload;
        }
      })

      // Bookmarked articles
      .addCase(fetchBookmarkedArticles.fulfilled, (state, action) => {
        state.bookmarkedArticles = action.payload;
      })

      // Search
      .addCase(searchNewspaperArticles.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearCurrentAnalysis } = newspaperAnalysisSlice.actions;
export default newspaperAnalysisSlice.reducer;
