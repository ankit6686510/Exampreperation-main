import axiosInstance from './axiosInstance';

export interface UpscResource {
  _id: string;
  user?: string;
  category: 'Book' | 'NCERT' | 'Magazine' | 'Website' | 'Document' | 'Notes';
  subject: string;
  title: string;
  author?: string;
  publisher?: string;
  edition?: string;
  isbn?: string;
  chapters: Chapter[];
  priority: 'Must Read' | 'Recommended' | 'Optional' | 'Reference';
  examRelevance: ('Prelims' | 'Mains' | 'Interview' | 'Optional')[];
  tags: string[];
  description?: string;
  url?: string;
  totalPages?: number;
  estimatedHours: number;
  actualHours: number;
  startedAt?: string;
  completedAt?: string;
  lastReadAt?: string;
  rating?: number;
  review?: string;
  isTemplate: boolean;
  templateCategory?: 'UPSC-General' | 'UPSC-Optional' | 'State-PCS' | 'Banking' | 'SSC';
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completionPercentage?: number;
}

export interface Chapter {
  _id?: string;
  name: string;
  pageRange?: string;
  completed: boolean;
  notes?: string;
  completedAt?: string;
  timeSpent: number; // in minutes
  order: number;
}

export interface CreateUpscResourceRequest {
  category: 'Book' | 'NCERT' | 'Magazine' | 'Website' | 'Document' | 'Notes';
  subject: string;
  title: string;
  author?: string;
  publisher?: string;
  edition?: string;
  chapters?: Omit<Chapter, '_id'>[];
  priority?: 'Must Read' | 'Recommended' | 'Optional' | 'Reference';
  examRelevance?: ('Prelims' | 'Mains' | 'Interview' | 'Optional')[];
  tags?: string[];
  description?: string;
  url?: string;
  totalPages?: number;
  estimatedHours?: number;
}

export interface UpdateUpscResourceRequest {
  category?: 'Book' | 'NCERT' | 'Magazine' | 'Website' | 'Document' | 'Notes';
  subject?: string;
  title?: string;
  author?: string;
  publisher?: string;
  edition?: string;
  chapters?: Chapter[];
  priority?: 'Must Read' | 'Recommended' | 'Optional' | 'Reference';
  examRelevance?: ('Prelims' | 'Mains' | 'Interview' | 'Optional')[];
  tags?: string[];
  description?: string;
  url?: string;
  totalPages?: number;
  estimatedHours?: number;
  actualHours?: number;
  status?: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  rating?: number;
  review?: string;
  lastReadAt?: string;
}

export interface SubjectStats {
  _id: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  totalHours: number;
  estimatedHours: number;
  completionPercentage: number;
}

export interface UpscTemplate {
  templateCategory: string;
  subject: string;
  title: string;
  author?: string;
  description?: string;
  examRelevance: string[];
  priority: string;
}

export interface BulkUpdateRequest {
  resourceIds: string[];
  action: 'set_priority' | 'mark_completed' | 'add_tags';
  actionData?: {
    priority?: 'Must Read' | 'Recommended' | 'Optional' | 'Reference';
    tags?: string[];
  };
}

export const upscResourceApi = {
  // Get all UPSC resources
  getUpscResources: async (params?: {
    category?: string;
    subject?: string;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<UpscResource[]> => {
    const response = await axiosInstance.get('/upsc-resources', { params });
    return response.data.data;
  },

  // Get subject-wise statistics
  getSubjectStats: async (): Promise<SubjectStats[]> => {
    const response = await axiosInstance.get('/upsc-resources/stats');
    return response.data.data;
  },

  // Get available templates
  getTemplates: async (templateCategory?: string): Promise<Record<string, UpscTemplate[]>> => {
    const response = await axiosInstance.get('/upsc-resources/templates', {
      params: { templateCategory }
    });
    return response.data.data;
  },

  // Import template
  importTemplate: async (templateCategory: string): Promise<UpscResource[]> => {
    const response = await axiosInstance.post('/upsc-resources/import-template', {
      templateCategory
    });
    return response.data.data;
  },

  // Get single UPSC resource
  getUpscResource: async (id: string): Promise<UpscResource> => {
    const response = await axiosInstance.get(`/upsc-resources/${id}`);
    return response.data.data;
  },

  // Create UPSC resource
  createUpscResource: async (data: CreateUpscResourceRequest): Promise<UpscResource> => {
    const response = await axiosInstance.post('/upsc-resources', data);
    return response.data.data;
  },

  // Update UPSC resource
  updateUpscResource: async (id: string, data: UpdateUpscResourceRequest): Promise<UpscResource> => {
    const response = await axiosInstance.put(`/upsc-resources/${id}`, data);
    return response.data.data;
  },

  // Update chapter status
  updateChapterStatus: async (
    resourceId: string, 
    chapterId: string, 
    data: {
      completed?: boolean;
      timeSpent?: number;
      notes?: string;
    }
  ): Promise<UpscResource> => {
    const response = await axiosInstance.put(`/upsc-resources/${resourceId}/chapters`, {
      chapterId,
      ...data
    });
    return response.data.data;
  },

  // Delete UPSC resource
  deleteUpscResource: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/upsc-resources/${id}`);
  },

  // Bulk update resources
  bulkUpdateResources: async (data: BulkUpdateRequest): Promise<{ modifiedCount: number }> => {
    const response = await axiosInstance.put('/upsc-resources/bulk-update', data);
    return response.data.data;
  },

  // Helper functions for quick actions
  markChapterCompleted: async (resourceId: string, chapterId: string, timeSpent: number = 0): Promise<UpscResource> => {
    return upscResourceApi.updateChapterStatus(resourceId, chapterId, {
      completed: true,
      timeSpent
    });
  },

  markResourceCompleted: async (id: string): Promise<UpscResource> => {
    return upscResourceApi.updateUpscResource(id, {
      status: 'Completed',
      lastReadAt: new Date().toISOString()
    });
  },

  addStudyTime: async (resourceId: string, chapterId: string, minutes: number): Promise<UpscResource> => {
    return upscResourceApi.updateChapterStatus(resourceId, chapterId, {
      timeSpent: minutes
    });
  },

  rateResource: async (id: string, rating: number, review?: string): Promise<UpscResource> => {
    return upscResourceApi.updateUpscResource(id, { rating, review });
  },
};
