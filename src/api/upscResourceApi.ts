import axiosInstance from './axiosInstance';

export interface Chapter {
  _id?: string;
  name: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'revision';
  notes?: string;
  lastStudiedAt?: string;
  completedAt?: string;
  revisionCount: number;
  estimatedHours?: number;
  actualHours?: number;
}

export interface UpscResource {
  _id: string;
  user: string;
  subject: string;
  bookName: string;
  author?: string;
  edition?: string;
  paperType: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'CSAT' | 'Essay' | 'Optional';
  chapters: Chapter[];
  priority: 'High' | 'Medium' | 'Low';
  targetCompletionDate?: string;
  progress: {
    totalChapters: number;
    completedChapters: number;
    inProgressChapters: number;
    percentage: number;
  };
  tags: string[];
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectStats {
  subject: string;
  totalBooks: number;
  totalChapters: number;
  completedChapters: number;
  averageProgress: number;
  totalHours: number;
}

export interface Template {
  _id: string;
  name: string;
  subject: string;
  paperType: string;
  books: Array<{
    bookName: string;
    author?: string;
    chapters: string[];
  }>;
  description?: string;
}

export const getUpscResources = async (params?: {
  subject?: string;
  paperType?: string;
  priority?: string;
  status?: string;
  search?: string;
  limit?: number;
  skip?: number;
}): Promise<{ resources: UpscResource[]; total: number }> => {
  const response = await axiosInstance.get('/upsc-resources', { params });
  return response.data;
};

export const getSubjectStats = async (): Promise<SubjectStats[]> => {
  const response = await axiosInstance.get('/upsc-resources/stats');
  return response.data;
};

export const getTemplates = async (): Promise<Template[]> => {
  const response = await axiosInstance.get('/upsc-resources/templates');
  return response.data;
};

export const getUpscResource = async (id: string): Promise<UpscResource> => {
  const response = await axiosInstance.get(`/upsc-resources/${id}`);
  return response.data;
};

export const createUpscResource = async (
  data: Partial<UpscResource>
): Promise<UpscResource> => {
  const response = await axiosInstance.post('/upsc-resources', data);
  return response.data;
};

export const updateUpscResource = async (
  id: string,
  updates: Partial<UpscResource>
): Promise<UpscResource> => {
  const response = await axiosInstance.put(`/upsc-resources/${id}`, updates);
  return response.data;
};

export const updateChapterStatus = async (
  id: string,
  chapterId: string,
  status: string,
  data?: Partial<Chapter>
): Promise<UpscResource> => {
  const response = await axiosInstance.put(`/upsc-resources/${id}/chapters`, {
    chapterId,
    status,
    ...data,
  });
  return response.data;
};

export const deleteUpscResource = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/upsc-resources/${id}`);
};

export const importUpscTemplate = async (
  templateId: string,
  customizations?: any
): Promise<UpscResource[]> => {
  const response = await axiosInstance.post('/upsc-resources/import-template', {
    templateId,
    customizations,
  });
  return response.data;
};

export const bulkUpdateResources = async (
  updates: Array<{ id: string; updates: Partial<UpscResource> }>
): Promise<UpscResource[]> => {
  const response = await axiosInstance.put('/upsc-resources/bulk-update', { updates });
  return response.data;
};
