import axiosInstance from './axiosInstance';

export interface SyllabusItem {
  _id: string;
  user: string;
  title: string;
  description?: string;
  subject: string;
  unit?: string;
  topic?: string;
  subtopic?: string;
  level: number; // 1: Subject, 2: Unit, 3: Topic, 4: Subtopic
  parentId?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision';
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  actualHours: number;
  notes?: string;
  lastStudiedDate?: string;
  revisionCount: number;
  dueDate?: string;
  tags: string[];
  linkedBooks: string[];
  linkedSessions: string[];
  order: number;
  isActive: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  children?: SyllabusItem[];
  completionPercentage?: number;
}

export interface CreateSyllabusItemRequest {
  title: string;
  description?: string;
  subject: string;
  unit?: string;
  topic?: string;
  subtopic?: string;
  level: number;
  parentId?: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  dueDate?: string;
  tags?: string[];
  order?: number;
}

export interface UpdateSyllabusItemRequest {
  title?: string;
  description?: string;
  subject?: string;
  unit?: string;
  topic?: string;
  subtopic?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'needs_revision';
  priority?: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
  dueDate?: string;
  tags?: string[];
  order?: number;
}

export interface SyllabusResponse {
  success: boolean;
  data: SyllabusItem[];
}

export interface SyllabusStats {
  overall: {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    needsRevision: number;
    totalEstimatedHours: number;
    totalActualHours: number;
    highPriority: number;
    completionPercentage: number;
  };
  subjects: Array<{
    _id: string;
    total: number;
    completed: number;
    inProgress: number;
    needsRevision: number;
    totalHours: number;
    completionPercentage: number;
  }>;
}

export interface BulkUpdateRequest {
  items: string[];
  action: 'mark_completed' | 'mark_in_progress' | 'set_priority' | 'add_hours';
  actionData?: {
    priority?: 'low' | 'medium' | 'high';
    hours?: number;
  };
}

export const syllabusApi = {
  // Get all syllabus items
  getSyllabus: async (params?: {
    subject?: string;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<SyllabusItem[]> => {
    const response = await axiosInstance.get('/syllabus', { params });
    return response.data.data;
  },

  // Get syllabus statistics
  getStats: async (params?: {
    subject?: string;
  }): Promise<SyllabusStats> => {
    const response = await axiosInstance.get('/syllabus/stats', { params });
    return response.data.data;
  },

  // Get single syllabus item
  getSyllabusItem: async (id: string): Promise<SyllabusItem> => {
    const response = await axiosInstance.get(`/syllabus/${id}`);
    return response.data.data;
  },

  // Create syllabus item
  createSyllabusItem: async (data: CreateSyllabusItemRequest): Promise<SyllabusItem> => {
    const response = await axiosInstance.post('/syllabus', data);
    return response.data.data;
  },

  // Update syllabus item
  updateSyllabusItem: async (id: string, data: UpdateSyllabusItemRequest): Promise<SyllabusItem> => {
    const response = await axiosInstance.put(`/syllabus/${id}`, data);
    return response.data.data;
  },

  // Delete syllabus item
  deleteSyllabusItem: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/syllabus/${id}`);
  },

  // Bulk update syllabus items
  bulkUpdateSyllabus: async (data: BulkUpdateRequest): Promise<{ modifiedCount: number }> => {
    const response = await axiosInstance.put('/syllabus/bulk/update', data);
    return response.data.data;
  },

  // Get study recommendations
  getRecommendations: async (limit?: number): Promise<SyllabusItem[]> => {
    const response = await axiosInstance.get('/syllabus/recommendations', {
      params: { limit }
    });
    return response.data.data;
  },

  // Link books to syllabus item
  linkBooks: async (id: string, bookIds: string[]): Promise<SyllabusItem> => {
    const response = await axiosInstance.put(`/syllabus/${id}/link-books`, { bookIds });
    return response.data.data;
  },

  // Helper functions for creating syllabus structure
  createSubject: async (title: string, description?: string): Promise<SyllabusItem> => {
    return syllabusApi.createSyllabusItem({
      title,
      description,
      subject: title,
      level: 1,
      priority: 'medium',
    });
  },

  createUnit: async (title: string, subject: string, parentId: string, description?: string): Promise<SyllabusItem> => {
    return syllabusApi.createSyllabusItem({
      title,
      description,
      subject,
      unit: title,
      level: 2,
      parentId,
      priority: 'medium',
    });
  },

  createTopic: async (title: string, subject: string, unit: string, parentId: string, description?: string): Promise<SyllabusItem> => {
    return syllabusApi.createSyllabusItem({
      title,
      description,
      subject,
      unit,
      topic: title,
      level: 3,
      parentId,
      priority: 'medium',
    });
  },

  createSubtopic: async (title: string, subject: string, unit: string, topic: string, parentId: string, description?: string): Promise<SyllabusItem> => {
    return syllabusApi.createSyllabusItem({
      title,
      description,
      subject,
      unit,
      topic,
      subtopic: title,
      level: 4,
      parentId,
      priority: 'medium',
    });
  },
};
