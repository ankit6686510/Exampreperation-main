import axiosInstance from './axiosInstance';

export interface Article {
  _id?: string;
  title: string;
  summary: string;
  keyPoints: string[];
  category: 'Polity & Governance' | 'Economy' | 'International Relations' | 'Environment & Ecology' | 'Science & Technology' | 'Social Issues' | 'Internal Security' | 'History & Culture' | 'Geography' | 'Agriculture' | 'Disaster Management' | 'Ethics' | 'Miscellaneous';
  subCategory?: string;
  tags: string[];
  examRelevance: Array<'Prelims' | 'Mains' | 'Interview' | 'Optional'>;
  priority: 'High' | 'Medium' | 'Low';
  url?: string;
  pageNumber?: number;
  linkedTopics?: string[];
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
  totalTimeSpent: number;
  completionStatus: 'Not Started' | 'In Progress' | 'Completed';
  overallNotes?: string;
  importantEvents: Array<{
    event: string;
    significance: string;
    category: string;
  }>;
  monthlyTheme?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyStats {
  _id: string;
  count: number;
  highPriority: number;
  prelimsRelevant: number;
  mainsRelevant: number;
  totalTimeSpent: number;
}

export interface TimelineData {
  date: string;
  articleCount: number;
  timeSpent: number;
  sources: string[];
}

export interface CategoryTrend {
  _id: string;
  weeklyData: Array<{
    week: number;
    count: number;
    highPriorityCount: number;
  }>;
  totalCount: number;
}

export interface RevisionReminder {
  date: string;
  source: string;
  title: string;
  category: string;
  priority: string;
  lastRevisedAt?: string;
  revisionCount: number;
  revisionUrgency: 'Due' | 'Overdue' | 'Critical' | 'Low';
}

export const getNewspaperAnalyses = async (params?: {
  source?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  priority?: string;
  limit?: number;
  skip?: number;
}): Promise<{ analyses: NewspaperAnalysis[]; total: number }> => {
  const response = await axiosInstance.get('/newspaper-analysis', { params });
  return response.data;
};

export const getNewspaperAnalysis = async (id: string): Promise<NewspaperAnalysis> => {
  const response = await axiosInstance.get(`/newspaper-analysis/${id}`);
  return response.data;
};

export const getAnalysisByDate = async (date: string): Promise<NewspaperAnalysis | null> => {
  const response = await axiosInstance.get(`/newspaper-analysis/date/${date}`);
  return response.data;
};

export const createOrUpdateAnalysis = async (
  data: Partial<NewspaperAnalysis>
): Promise<NewspaperAnalysis> => {
  const response = await axiosInstance.post('/newspaper-analysis', data);
  return response.data;
};

export const addArticle = async (
  analysisId: string,
  article: Partial<Article>
): Promise<NewspaperAnalysis> => {
  const response = await axiosInstance.post(`/newspaper-analysis/${analysisId}/articles`, article);
  return response.data;
};

export const updateArticle = async (
  analysisId: string,
  articleId: string,
  updates: Partial<Article>
): Promise<NewspaperAnalysis> => {
  const response = await axiosInstance.put(
    `/newspaper-analysis/${analysisId}/articles/${articleId}`,
    updates
  );
  return response.data;
};

export const deleteArticle = async (
  analysisId: string,
  articleId: string
): Promise<NewspaperAnalysis> => {
  const response = await axiosInstance.delete(
    `/newspaper-analysis/${analysisId}/articles/${articleId}`
  );
  return response.data;
};

export const getMonthlyStats = async (
  year: number,
  month: number
): Promise<MonthlyStats[]> => {
  const response = await axiosInstance.get(`/newspaper-analysis/stats/${year}/${month}`);
  return response.data;
};

export const getTimeline = async (days: number = 30): Promise<TimelineData[]> => {
  const response = await axiosInstance.get('/newspaper-analysis/timeline', {
    params: { days },
  });
  return response.data;
};

export const getCategoryTrends = async (days: number = 30): Promise<CategoryTrend[]> => {
  const response = await axiosInstance.get('/newspaper-analysis/trends', {
    params: { days },
  });
  return response.data;
};

export const getRevisionReminders = async (): Promise<RevisionReminder[]> => {
  const response = await axiosInstance.get('/newspaper-analysis/reminders');
  return response.data;
};

export const generateMonthlyCompilation = async (
  year: number,
  month: number
): Promise<any> => {
  const response = await axiosInstance.get(`/newspaper-analysis/compilation/${year}/${month}`);
  return response.data;
};

export const toggleBookmark = async (
  analysisId: string,
  articleId: string
): Promise<NewspaperAnalysis> => {
  const response = await axiosInstance.put(
    `/newspaper-analysis/${analysisId}/articles/${articleId}/bookmark`
  );
  return response.data;
};

export const getBookmarkedArticles = async (): Promise<any> => {
  const response = await axiosInstance.get('/newspaper-analysis/bookmarks');
  return response.data;
};

export const searchArticles = async (query: string, filters?: {
  category?: string;
  priority?: string;
  examRelevance?: string;
}): Promise<any> => {
  const response = await axiosInstance.get('/newspaper-analysis/search', {
    params: { query, ...filters },
  });
  return response.data;
};
