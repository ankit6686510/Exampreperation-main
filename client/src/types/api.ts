// API Error Types
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
}

// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  examTypes?: string[];
  examDate?: string;
  profilePicture?: string;
  targetScore?: number;
  studyPreferences?: StudyPreferences;
  progressStats?: ProgressStats;
  notifications?: NotificationSettings;
  createdAt?: string;
  lastActiveAt?: string;
}

export interface StudyPreferences {
  dailyStudyHours?: number;
  preferredStudyTime?: string;
  breakDuration?: number;
  studySessionDuration?: number;
}

export interface ProgressStats {
  totalStudyHours: number;
  totalGoalsCompleted: number;
  totalBooksRead: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  dailyReminder: boolean;
  weeklyReport: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  examTypes: string[];
  examDate: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

// Resource Types
export interface Resource {
  _id: string;
  user: string;
  title: string;
  description?: string;
  url?: string;
  category?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  type?: 'video' | 'article' | 'pdf' | 'book' | 'course' | 'other';
  isBookmarked?: boolean;
  accessCount?: number;
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceData {
  title: string;
  description?: string;
  url?: string;
  category?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  type?: 'video' | 'article' | 'pdf' | 'book' | 'course' | 'other';
}

export interface UpdateResourceData extends Partial<CreateResourceData> {
  isBookmarked?: boolean;
}

// Daily Goal Types
export interface Task {
  _id?: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface DailyGoal {
  _id: string;
  user: string;
  date: string;
  title: string;
  description?: string;
  tasks: Task[];
  targetHours?: number;
  actualHours?: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyGoalData {
  date: string;
  title: string;
  description?: string;
  tasks?: Omit<Task, '_id'>[];
  targetHours?: number;
}

export interface UpdateDailyGoalData extends Partial<CreateDailyGoalData> {
  completed?: boolean;
  actualHours?: number;
}

// Study Session Types
export interface StudySession {
  _id: string;
  user: string;
  title: string;
  subject: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudySessionData {
  title: string;
  subject: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
}

export interface UpdateStudySessionData extends Partial<CreateStudySessionData> {}

// Book Types
export interface Chapter {
  _id?: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  status: 'not-started' | 'in-progress' | 'completed';
  notes?: string;
  completedAt?: string;
  tests?: Test[];
  revisions?: Revision[];
  linkedSyllabusItems?: string[];
}

export interface Test {
  _id?: string;
  date: string;
  score?: number;
  totalMarks?: number;
  notes?: string;
}

export interface Revision {
  _id?: string;
  date: string;
  notes?: string;
}

export interface Book {
  _id: string;
  user: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  chapters: Chapter[];
  status: 'not-started' | 'in-progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookData {
  title: string;
  author: string;
  totalPages: number;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  chapters?: Omit<Chapter, '_id'>[];
}

export interface UpdateBookData extends Partial<CreateBookData> {
  currentPage?: number;
  status?: 'not-started' | 'in-progress' | 'completed';
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query Types
export interface ResourceQueryParams extends PaginationParams {
  search?: string;
  category?: string;
  tags?: string;
  priority?: 'low' | 'medium' | 'high';
  isBookmarked?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DailyGoalQueryParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
  completed?: boolean;
}

export interface StudySessionQueryParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
  subject?: string;
}

export interface BookQueryParams extends PaginationParams {
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'not-started' | 'in-progress' | 'completed';
}