import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  newspaperAnalysisApi, 
  NewspaperAnalysis, 
  Article,
  MonthlyStats,
  TimelineData,
  CategoryTrend,
  RevisionReminder,
  BookmarkedArticle,
  SearchResult
} from '../../api/newspaperAnalysisApi';

interface NewspaperAnalysisState {
  analyses: NewspaperAnalysis[];
  currentAnalysis: NewspaperAnalysis | null;
  monthlyStats: MonthlyStats | null;
  timelineData: TimelineData[];
  categoryTrends: CategoryTrend[];
  revisionReminders: RevisionReminder[];
  bookmarkedArticles: BookmarkedArticle[];
  searchResults: SearchResult[];
  filters: {
    source: string;
    category: string;
    priority: string;
    startDate: string;
    endDate: string;
    search: string;
  };
  isLoading: boolean;
  statsLoading: boolean;
  searchLoading: boolean;
  error: string | null;
}

const initialState: NewspaperAnalysisState = {
  analyses: [],
  currentAnalysis: null,
  monthlyStats: null,
  timelineData: [],
  categoryTrends: [],
  revisionReminders: [],
  bookmarkedArticles: [],
  searchResults: [],
  filters: {
    source: '',
    category: '',
    priority: '',
    startDate: '',
    endDate: '',
    search: '',
  },
  isLoading: false,
  statsLoading: false,
  searchLoading: false,
  error: null,
};

// Async thunks
export const fetchAnalyses = createAsyncThunk(
  'newspaperAnalysis/fetchAnalyses',
  async (filters?: {
    source?: string;
    category?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    return await newspaperAnalysisApi.getAnalyses(filters);
  }
);

export const fetchAnalysisByDate = createAsyncThunk(
  'newspaperAnalysis/fetchAnalysisByDate',
  async (date: string) => {
    return await newspaperAnalysisApi.getAnalysisByDate(date);
  }
);

export const fetchAnalysis = createAsyncThunk(
  'newspaperAnalysis/fetchAnalysis',
  async (id: string) => {
    return await newspaperAnalysisApi.getAnalysis(id);
  }
);

export const createOrUpdateAnalysis = createAsyncThunk(
  'newspaperAnalysis/createOrUpdate',
  async (data: Parameters<typeof newspaperAnalysisApi.createOrUpdateAnalysis>[0]) => {
    return await newspaperAnalysisApi.createOrUpdateAnalysis(data);
  }
);

export const addArticle = createAsyncThunk(
  'newspaperAnalysis/addArticle',
  async ({ analysisId, data }: { 
    analysisId: string; 
    data: Parameters<typeof newspaperAnalysisApi.addArticle>[1] 
  }) => {
    return await newspaperAnalysisApi.addArticle(analysisId, data);
  }
);

export const updateArticle = createAsyncThunk(
  'newspaperAnalysis/updateArticle',
  async ({ 
    analysisId, 
    articleId, 
    data 
  }: { 
    analysisId: string; 
    articleId: string; 
    data: Parameters<typeof newspaperAnalysisApi.updateArticle>[2] 
  }) => {
    return await newspaperAnalysisApi.updateArticle(analysisId, articleId, data);
  }
);

export const deleteArticle = createAsyncThunk(
  'newspaperAnalysis/deleteArticle',
  async ({ analysisId, articleId }: { analysisId: string; articleId: string }) => {
    return await newspaperAnalysisApi.deleteArticle(analysisId, articleId);
  }
);

export const toggleBookmark = createAsyncThunk(
  'newspaperAnalysis/toggleBookmark',
  async ({ analysisId, articleId }: { analysisId: string; articleId: string }) => {
    return await newspaperAnalysisApi.toggleBookmark(analysisId, articleId);
  }
);

export const fetchMonthlyStats = createAsyncThunk(
  'newspaperAnalysis/fetchMonthlyStats',
  async ({ year, month }: { year: number; month: number }) => {
    return await newspaperAnalysisApi.getMonthlyStats(year, month);
  }
);

export const fetchTimeline = createAsyncThunk(
  'newspaperAnalysis/fetchTimeline',
  async (days: number = 30) => {
    return await newspaperAnalysisApi.getTimeline(days);
  }
);

export const fetchCategoryTrends = createAsyncThunk(
  'newspaperAnalysis/fetchCategoryTrends',
  async (days: number = 30) => {
    return await newspaperAnalysisApi.getCategoryTrends(days);
  }
);

export const fetchRevisionReminders = createAsyncThunk(
  'newspaperAnalysis/fetchRevisionReminders',
  async () => {
    return await newspaperAnalysisApi.getRevisionReminders();
  }
);

export const fetchBookmarkedArticles = createAsyncThunk(
  'newspaperAnalysis/fetchBookmarkedArticles',
  async (params?: { category?: string; days?: number }) => {
    return await newspaperAnalysisApi.getBookmarkedArticles(params);
  }
);

export const searchArticles = createAsyncThunk(
  'newspaperAnalysis/searchArticles',
  async (params: Parameters<typeof newspaperAnalysisApi.searchArticles>[0]) => {
    return await newspaperAnalysisApi.searchArticles(params);
  }
);

export const generateMonthlyCompilation = createAsyncThunk(
  'newspaperAnalysis/generateCompilation',
  async ({ year, month, format = 'json' }: { year: number; month: number; format?: 'json' | 'pdf' }) => {
    return await newspaperAnalysisApi.generateMonthlyCompilation(year, month, format);
  }
);

const newspaperAnalysisSlice = createSlice({
  name: 'newspaperAnalysis',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<NewspaperAnalysisState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentAnalysis: (state, action: PayloadAction<NewspaperAnalysis | null>) => {
      state.currentAnalysis = action.payload;
    },
    updateAnalysisOptimistic: (state, action: PayloadAction<{ id: string; updates: Partial<NewspaperAnalysis> }>) => {
      const { id, updates } = action.payload;
      const index = state.analyses.findIndex(analysis => analysis._id === id);
      if (index !== -1) {
        state.analyses[index] = { ...state.analyses[index], ...updates };
      }
      if (state.currentAnalysis && state.currentAnalysis._id === id) {
        state.currentAnalysis = { ...state.currentAnalysis, ...updates };
      }
    },
    updateArticleOptimistic: (state, action: PayloadAction<{ 
      analysisId: string; 
      articleId: string; 
      updates: Partial<Article> 
    }>) => {
      const { analysisId, articleId, updates } = action.payload;
      
      // Update in analyses array
      const analysisIndex = state.analyses.findIndex(analysis => analysis._id === analysisId);
      if (analysisIndex !== -1) {
        const articleIndex = state.analyses[analysisIndex].articles.findIndex(article => article._id === articleId);
        if (articleIndex !== -1) {
          state.analyses[analysisIndex].articles[articleIndex] = { 
            ...state.analyses[analysisIndex].articles[articleIndex], 
            ...updates 
          };
        }
      }
      
      // Update in current analysis
      if (state.currentAnalysis && state.currentAnalysis._id === analysisId) {
        const articleIndex = state.currentAnalysis.articles.findIndex(article => article._id === articleId);
        if (articleIndex !== -1) {
          state.currentAnalysis.articles[articleIndex] = { 
            ...state.currentAnalysis.articles[articleIndex], 
            ...updates 
          };
        }
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch analyses
      .addCase(fetchAnalyses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalyses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analyses = action.payload;
      })
      .addCase(fetchAnalyses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch newspaper analyses';
      })
      
      // Fetch analysis by date
      .addCase(fetchAnalysisByDate.fulfilled, (state, action) => {
        state.analyses = action.payload;
      })
      
      // Fetch single analysis
      .addCase(fetchAnalysis.fulfilled, (state, action) => {
        state.currentAnalysis = action.payload;
      })
      
      // Create or update analysis
      .addCase(createOrUpdateAnalysis.fulfilled, (state, action) => {
        const existingIndex = state.analyses.findIndex(analysis => analysis._id === action.payload._id);
        if (existingIndex !== -1) {
          state.analyses[existingIndex] = action.payload;
        } else {
          state.analyses.push(action.payload);
        }
        state.currentAnalysis = action.payload;
      })
      .addCase(createOrUpdateAnalysis.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to save newspaper analysis';
      })
      
      // Add article
      .addCase(addArticle.fulfilled, (state, action) => {
        const index = state.analyses.findIndex(analysis => analysis._id === action.payload._id);
        if (index !== -1) {
          state.analyses[index] = action.payload;
        }
        if (state.currentAnalysis && state.currentAnalysis._id === action.payload._id) {
          state.currentAnalysis = action.payload;
        }
      })
      .addCase(addArticle.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add article';
      })
      
      // Update article
      .addCase(updateArticle.fulfilled, (state, action) => {
        const index = state.analyses.findIndex(analysis => analysis._id === action.payload._id);
        if (index !== -1) {
          state.analyses[index] = action.payload;
        }
        if (state.currentAnalysis && state.currentAnalysis._id === action.payload._id) {
          state.currentAnalysis = action.payload;
        }
      })
      .addCase(updateArticle.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update article';
      })
      
      // Delete article
      .addCase(deleteArticle.fulfilled, (state, action) => {
        const index = state.analyses.findIndex(analysis => analysis._id === action.payload._id);
        if (index !== -1) {
          state.analyses[index] = action.payload;
        }
        if (state.currentAnalysis && state.currentAnalysis._id === action.payload._id) {
          state.currentAnalysis = action.payload;
        }
      })
      .addCase(deleteArticle.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete article';
      })
      
      // Toggle bookmark
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        const index = state.analyses.findIndex(analysis => analysis._id === action.payload._id);
        if (index !== -1) {
          state.analyses[index] = action.payload;
        }
        if (state.currentAnalysis && state.currentAnalysis._id === action.payload._id) {
          state.currentAnalysis = action.payload;
        }
      })
      
      // Fetch monthly stats
      .addCase(fetchMonthlyStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchMonthlyStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.monthlyStats = action.payload;
      })
      .addCase(fetchMonthlyStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.error.message || 'Failed to fetch monthly statistics';
      })
      
      // Fetch timeline
      .addCase(fetchTimeline.fulfilled, (state, action) => {
        state.timelineData = action.payload;
      })
      
      // Fetch category trends
      .addCase(fetchCategoryTrends.fulfilled, (state, action) => {
        state.categoryTrends = action.payload;
      })
      
      // Fetch revision reminders
      .addCase(fetchRevisionReminders.fulfilled, (state, action) => {
        state.revisionReminders = action.payload;
      })
      
      // Fetch bookmarked articles
      .addCase(fetchBookmarkedArticles.fulfilled, (state, action) => {
        state.bookmarkedArticles = action.payload;
      })
      
      // Search articles
      .addCase(searchArticles.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchArticles.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchArticles.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.error.message || 'Failed to search articles';
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setCurrentAnalysis,
  updateAnalysisOptimistic,
  updateArticleOptimistic,
  clearSearchResults,
  clearError,
} = newspaperAnalysisSlice.actions;

export default newspaperAnalysisSlice.reducer;
