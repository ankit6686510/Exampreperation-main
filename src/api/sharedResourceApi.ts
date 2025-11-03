import axiosInstance from './axiosInstance';

export interface SharedResource {
  _id: string;
  group: {
    _id: string;
    name: string;
  };
  sharedBy: {
    _id: string;
    name: string;
  };
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'link' | 'document' | 'image' | 'other';
  url: string;
  fileSize?: number;
  tags: string[];
  category: string;
  examRelevance: Array<'Prelims' | 'Mains' | 'Interview' | 'Optional'>;
  downloadCount: number;
  bookmarkCount: number;
  averageRating: number;
  ratings: Array<{
    user: string;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
  flags: Array<{
    user: string;
    reason: string;
    createdAt: string;
  }>;
  isBookmarked?: boolean;
  userRating?: number;
  createdAt: string;
  updatedAt: string;
}

export const createSharedResource = async (
  data: Partial<SharedResource>
): Promise<SharedResource> => {
  const response = await axiosInstance.post('/shared-resources', data);
  return response.data;
};

export const getGroupResources = async (
  groupId: string,
  params?: {
    category?: string;
    type?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    skip?: number;
  }
): Promise<{ resources: SharedResource[]; total: number }> => {
  const response = await axiosInstance.get(`/shared-resources/group/${groupId}`, { params });
  return response.data;
};

export const getSharedResource = async (id: string): Promise<SharedResource> => {
  const response = await axiosInstance.get(`/shared-resources/${id}`);
  return response.data;
};

export const downloadResource = async (id: string): Promise<void> => {
  await axiosInstance.post(`/shared-resources/${id}/download`);
};

export const toggleBookmark = async (id: string): Promise<SharedResource> => {
  const response = await axiosInstance.post(`/shared-resources/${id}/bookmark`);
  return response.data;
};

export const rateResource = async (
  id: string,
  rating: number,
  comment?: string
): Promise<SharedResource> => {
  const response = await axiosInstance.post(`/shared-resources/${id}/rate`, {
    rating,
    comment,
  });
  return response.data;
};

export const flagResource = async (
  id: string,
  reason: string
): Promise<void> => {
  await axiosInstance.post(`/shared-resources/${id}/flag`, { reason });
};

export const getUserBookmarks = async (): Promise<SharedResource[]> => {
  const response = await axiosInstance.get('/shared-resources/my-bookmarks');
  return response.data;
};

export const getUserSharedResources = async (): Promise<SharedResource[]> => {
  const response = await axiosInstance.get('/shared-resources/my-resources');
  return response.data;
};

export const getTrendingResources = async (
  groupId: string,
  params?: { limit?: number; days?: number }
): Promise<SharedResource[]> => {
  const response = await axiosInstance.get(`/shared-resources/group/${groupId}/trending`, {
    params,
  });
  return response.data;
};
