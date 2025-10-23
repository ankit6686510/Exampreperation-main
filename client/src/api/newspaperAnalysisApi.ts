import axiosInstance from './axiosInstance';

export interface Article {
  _id?: string;
  title: string;
  summary: string;
  keyPoints: string[];
  category: 'Polity & Governance' | 'Economy' | 'International Relations' | 'Environment & Ecology' | 
    'Science & Technology' | 'Social Issues' | 'Internal Security' | 'History & Culture' | 
    'Geography' | 'Agriculture' | 'Disaster Management' | 'Ethics' | 'Miscellaneous';
  subCategory?: string;
  tags: string[];
  examRelevance: ('Prelims' | 'Mains' | 'Interview' | 'Optional')[];
  priority: 'High' | 'Medium' | 'Low';
  url?: string;
  pageNumber?: number;
  linkedTopics: string[];
  notes?: string;
  isBookmarked: boolean;
  lastRevisedAt?: string;
  revisionCount: number;
  order: number;
}

export interface NewspaperAnalysis {
  _id: string;
  user: string;
  date: string;
  source: 'The Hindu' | 'Indian Express' | 'PIB' | 'Livemint' | 'Economic Times' | 'Other';
  articles: Article[];
  totalTimeSpent: number; // in minutes
  completionStatus: 'Not Started' | 'In Progress' | 'Completed';
  overallNotes?: string;
  importantEvents: {
    event: string;
    significance: string;
    category: string;
  }[];
  monthlyTheme?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnalysisRequest {
  date: string;
  source: 'The Hindu' | 'Indian Express' | 'PIB' | 'Livemint' | 'Economic Times' | 'Other';
  articles?: Omit<Article, '_id'>[];
  totalTimeSpent?: number;
  overallNotes?: string;
  importantEvents?: {
    event: string;
    significance: string;
    category: string;
  }[];
  monthlyTheme?: string;
}

export interface AddArticleRequest {
  title: string;
  summary: string;
  keyPoints?: string[];
  category: Article['category'];
  subCategory?: string;
  tags?: string[];
  examRelevance?: Article['examRelevance'];
  priority?: 'High' | 'Medium' | 'Low';
  url?: string;
  pageNumber?: number;
  linkedTopics?: string[];
  notes?: string;
}

export interface UpdateArticleRequest extends Partial<AddArticleRequest> {
  lastRevisedAt?: string;
  isBookmarked?: boolean;
  revisionCount?: number;
}

export interface MonthlyStats {
  categoryStats: {
    _id: string;
    count: number;
    highPriority: number;
    prelimsRelevant: number;
    mainsRelevant: number;
    totalTimeSpent: number;
  }[];
  summary: {
    totalDays: number;
    totalArticles: number;
    totalTimeSpent: number;
    avgArticlesPerDay: number;
    sources: string[];
  };
}

export interface TimelineData {
  date: string;
  articleCount: number;
  timeSpent: number;
  sources: string[];
}

export interface CategoryTrend {
  _id: string;
  weeklyData: {
    week: number;
    count: number;
    highPriorityCount: number;
  }[];
  totalCount: number;
}

export interface RevisionReminder {
  _id: string;
  date: string;
  source: string;
  title: string;
  category: string;
  priority: string;
  lastRevisedAt?: string;
  revisionCount: number;
  revisionUrgency: 'Due' | 'Overdue' | 'Critical' | 'Low';
}

export interface MonthlyCompilation {
  month: number;
  year: number;
  categories: {
    category: string;
    articles: {
      date: string;
      source: string;
      title: string;
      summary: string;
      keyPoints: string[];
      priority: string;
      examRelevance: string[];
      tags: string[];
    }[];
    count: number;
  }[];
  generatedAt: string;
}

export interface BookmarkedArticle {
  _id: string;
  date: string;
  source: string;
  title: string;
  summary: string;
  category: string;
  priority: string;
  examRelevance: string[];
  tags: string[];
  notes?: string;
  articleId: string;
}

export interface SearchResult {
  _id: string;
  date: string;
  source: string;
  title: string;
  summary: string;
  keyPoints: string[];
  category: string;
  priority: string;
  examRelevance: string[];
  tags: string[];
  notes?: string;
  isBookmarked: boolean;
  articleId: string;
}

export const newspaperAnalysisApi = {
  // Get all newspaper analyses
  getAnalyses: async (params?: {
    source?: string;
    category?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<NewspaperAnalysis[]> => {
    const response = await axiosInstance.get('/newspaper-analysis', { params });
    return response.data.data;
  },

  // Get analysis for specific date
  getAnalysisByDate: async (date: string): Promise<NewspaperAnalysis[]> => {
    const response = await axiosInstance.get(`/newspaper-analysis/date/${date}`);
    return response.data.data;
  },

  // Get single analysis
  getAnalysis: async (id: string): Promise<NewspaperAnalysis> => {
    const response = await axiosInstance.get(`/newspaper-analysis/${id}`);
    return response.data.data;
  },

  // Create or update analysis
  createOrUpdateAnalysis: async (data: CreateAnalysisRequest): Promise<NewspaperAnalysis> => {
    const response = await axiosInstance.post('/newspaper-analysis', data);
    return response.data.data;
  },

  // Add article to existing analysis
  addArticle: async (analysisId: string, data: AddArticleRequest): Promise<NewspaperAnalysis> => {
    const response = await axiosInstance.post(`/newspaper-analysis/${analysisId}/articles`, data);
    return response.data.data;
  },

  // Update specific article
  updateArticle: async (
    analysisId: string, 
    articleId: string, 
    data: UpdateArticleRequest
  ): Promise<NewspaperAnalysis> => {
    const response = await axiosInstance.put(`/newspaper-analysis/${analysisId}/articles/${articleId}`, data);
    return response.data.data;
  },

  // Delete article
  deleteArticle: async (analysisId: string, articleId: string): Promise<NewspaperAnalysis> => {
    const response = await axiosInstance.delete(`/newspaper-analysis/${analysisId}/articles/${articleId}`);
    return response.data.data;
  },

  // Toggle bookmark
  toggleBookmark: async (analysisId: string, articleId: string): Promise<NewspaperAnalysis> => {
    const response = await axiosInstance.put(`/newspaper-analysis/${analysisId}/articles/${articleId}/bookmark`);
    return response.data.data;
  },

  // Get monthly statistics
  getMonthlyStats: async (year: number, month: number): Promise<MonthlyStats> => {
    const response = await axiosInstance.get(`/newspaper-analysis/stats/${year}/${month}`);
    return response.data.data;
  },

  // Get timeline data
  getTimeline: async (days: number = 30): Promise<TimelineData[]> => {
    const response = await axiosInstance.get('/newspaper-analysis/timeline', {
      params: { days }
    });
    return response.data.data;
  },

  // Get category trends
  getCategoryTrends: async (days: number = 30): Promise<CategoryTrend[]> => {
    const response = await axiosInstance.get('/newspaper-analysis/trends', {
      params: { days }
    });
    return response.data.data;
  },

  // Get revision reminders
  getRevisionReminders: async (): Promise<RevisionReminder[]> => {
    const response = await axiosInstance.get('/newspaper-analysis/reminders');
    return response.data.data;
  },

  // Generate monthly compilation
  generateMonthlyCompilation: async (year: number, month: number, format: 'json' | 'pdf' = 'json'): Promise<MonthlyCompilation> => {
    const response = await axiosInstance.get(`/newspaper-analysis/compilation/${year}/${month}`, {
      params: { format }
    });
    return response.data.data;
  },

  // Get bookmarked articles
  getBookmarkedArticles: async (params?: {
    category?: string;
    days?: number;
  }): Promise<BookmarkedArticle[]> => {
    const response = await axiosInstance.get('/newspaper-analysis/bookmarks', { params });
    return response.data.data;
  },

  // Search articles
  searchArticles: async (params: {
    query: string;
    category?: string;
    priority?: string;
    examRelevance?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SearchResult[]> => {
    const response = await axiosInstance.get('/newspaper-analysis/search', { params });
    return response.data.data;
  },

  // Helper functions for common operations
  createTodaysAnalysis: async (source: 'The Hindu' | 'Indian Express' | 'PIB' | 'Livemint' | 'Economic Times' | 'Other'): Promise<NewspaperAnalysis> => {
    return newspaperAnalysisApi.createOrUpdateAnalysis({
      date: new Date().toISOString().split('T')[0],
      source,
      articles: [],
      totalTimeSpent: 0
    });
  },

  quickAddArticle: async (
    analysisId: string,
    title: string,
    summary: string,
    category: Article['category'],
    priority: 'High' | 'Medium' | 'Low' = 'Medium'
  ): Promise<NewspaperAnalysis> => {
    return newspaperAnalysisApi.addArticle(analysisId, {
      title,
      summary,
      category,
      priority,
      keyPoints: [],
      tags: [],
      examRelevance: ['Prelims']
    });
  },

  markForRevision: async (
    analysisId: string, 
    articleId: string, 
    notes?: string
  ): Promise<NewspaperAnalysis> => {
    return newspaperAnalysisApi.updateArticle(analysisId, articleId, {
      lastRevisedAt: new Date().toISOString(),
      notes: notes || 'Marked for revision'
    });
  },

  categorizeArticle: async (
    analysisId: string,
    articleId: string,
    category: Article['category'],
    examRelevance: Article['examRelevance'],
    priority: 'High' | 'Medium' | 'Low'
  ): Promise<NewspaperAnalysis> => {
    return newspaperAnalysisApi.updateArticle(analysisId, articleId, {
      category,
      examRelevance,
      priority
    });
  },
};
