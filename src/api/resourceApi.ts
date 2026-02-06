import axiosInstance from './axiosInstance';

export interface Resource {
  _id: string;
  user: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'article' | 'link' | 'other';
  url: string;
  category: string;
  tags: string[];
  examRelevance: Array<'Prelims' | 'Mains' | 'Interview' | 'Optional'>;
  isPublic: boolean;
  isBookmarked: boolean;
  accessCount: number;
  lastAccessedAt?: string;
  fileSize?: number;
  duration?: number;
  quality?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceStats {
  totalResources: number;
  byCategory: { [key: string]: number };
  byType: { [key: string]: number };
  totalBookmarks: number;
  totalAccess: number;
}

export const getResources = async (params?: {
  category?: string;
  type?: string;
  tags?: string[];
  search?: string;
  isBookmarked?: boolean;
  limit?: number;
  skip?: number;
}): Promise<{ resources: Resource[]; total: number }> => {
  const response = await axiosInstance.get('/resources', { params });
  return response.data;
};

export const getResource = async (id: string): Promise<Resource> => {
  const response = await axiosInstance.get(`/resources/${id}`);
  return response.data;
};

export const createResource = async (
  data: Partial<Resource>
): Promise<Resource> => {
  const response = await axiosInstance.post('/resources', data);
  return response.data;
};

export const updateResource = async (
  id: string,
  updates: Partial<Resource>
): Promise<Resource> => {
  const response = await axiosInstance.put(`/resources/${id}`, updates);
  return response.data;
};

export const deleteResource = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/resources/${id}`);
};

export const recordAccess = async (id: string): Promise<void> => {
  await axiosInstance.post(`/resources/${id}/access`);
};

export const toggleBookmark = async (id: string): Promise<Resource> => {
  const response = await axiosInstance.post(`/resources/${id}/bookmark`);
  return response.data;
};

export const getCategories = async (): Promise<string[]> => {
  const response = await axiosInstance.get('/resources/categories');
  return response.data;
};

export const getTags = async (): Promise<string[]> => {
  const response = await axiosInstance.get('/resources/tags');
  return response.data;
};

export const getResourceStats = async (): Promise<ResourceStats> => {
  const response = await axiosInstance.get('/resources/stats');
  return response.data;
};

export const bulkOperations = async (operation: {
  action: 'delete' | 'bookmark' | 'unbookmark' | 'updateCategory';
  resourceIds: string[];
  data?: any;
}): Promise<void> => {
  await axiosInstance.post('/resources/bulk', operation);
};
