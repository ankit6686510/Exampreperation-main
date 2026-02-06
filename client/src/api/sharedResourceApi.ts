import axiosInstance from './axiosInstance';

export interface SharedResource {
  _id: string;
  title: string;
  description?: string;
  group: {
    _id: string;
    name: string;
  };
  sharedBy: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  resourceType: 'file' | 'link' | 'note' | 'book' | 'video' | 'article' | 'practice-test' | 'other';
  contentData: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    url?: string;
    urlPreview?: {
      title?: string;
      description?: string;
      image?: string;
      siteName?: string;
    };
    textContent?: string;
    bookInfo?: {
      title?: string;
      author?: string;
      isbn?: string;
      publisher?: string;
      publicationYear?: number;
      pages?: number;
    };
    videoInfo?: {
      duration?: number;
      platform?: string;
      videoId?: string;
    };
  };
  subject: string;
  topics: string[];
  examTypes: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  visibility: 'group' | 'partners' | 'private';
  tags: string[];
  ratings: Array<{
    user: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    rating: number;
    review?: string;
    categories: {
      quality?: number;
      relevance?: number;
      clarity?: number;
      usefulness?: number;
    };
    ratedAt: string;
  }>;
  bookmarks: Array<{
    user: {
      _id: string;
      name: string;
    };
    bookmarkedAt: string;
    personalNotes?: string;
  }>;
  stats: {
    totalViews: number;
    totalDownloads: number;
    totalBookmarks: number;
    averageRating: number;
    totalRatings: number;
    popularityScore: number;
  };
  accessibility: {
    isPublic: boolean;
    requiresApproval: boolean;
    allowDownload: boolean;
    allowBookmark: boolean;
    allowRating: boolean;
  };
  uploadInfo: {
    uploadDate: string;
    lastModified: string;
    version: string;
  };
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSharedResourceRequest {
  title: string;
  description?: string;
  groupId: string;
  resourceType: string;
  contentData: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    url?: string;
    urlPreview?: {
      title?: string;
      description?: string;
      image?: string;
      siteName?: string;
    };
    textContent?: string;
    bookInfo?: {
      title?: string;
      author?: string;
      isbn?: string;
      publisher?: string;
      publicationYear?: number;
      pages?: number;
    };
    videoInfo?: {
      duration?: number;
      platform?: string;
      videoId?: string;
    };
  };
  subject: string;
  topics?: string[];
  examTypes?: string[];
  difficulty?: string;
  visibility?: string;
  tags?: string[];
  accessibility?: {
    isPublic?: boolean;
    requiresApproval?: boolean;
    allowDownload?: boolean;
    allowBookmark?: boolean;
    allowRating?: boolean;
  };
}

export const sharedResourceApi = {
  // Create/upload shared resource
  createSharedResource: async (data: CreateSharedResourceRequest) => {
    const response = await axiosInstance.post('/shared-resources', data);
    return response.data;
  },

  // Get resources for a group
  getGroupResources: async (groupId: string, params?: {
    resourceType?: string;
    subject?: string;
    difficulty?: string;
    tags?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    page?: number;
  }) => {
    const response = await axiosInstance.get(`/shared-resources/group/${groupId}`, { params });
    return response.data;
  },

  // Get single shared resource
  getSharedResource: async (resourceId: string) => {
    const response = await axiosInstance.get(`/shared-resources/${resourceId}`);
    return response.data;
  },

  // Download/access shared resource
  downloadResource: async (resourceId: string) => {
    const response = await axiosInstance.post(`/shared-resources/${resourceId}/download`);
    return response.data;
  },

  // Toggle bookmark for a resource
  toggleBookmark: async (resourceId: string, personalNotes?: string) => {
    const response = await axiosInstance.post(`/shared-resources/${resourceId}/bookmark`, {
      personalNotes
    });
    return response.data;
  },

  // Rate a shared resource
  rateResource: async (resourceId: string, data: {
    rating: number;
    review?: string;
    categories?: {
      quality?: number;
      relevance?: number;
      clarity?: number;
      usefulness?: number;
    };
  }) => {
    const response = await axiosInstance.post(`/shared-resources/${resourceId}/rate`, data);
    return response.data;
  },

  // Report/flag a resource
  flagResource: async (resourceId: string, data: {
    reason: string;
    description?: string;
  }) => {
    const response = await axiosInstance.post(`/shared-resources/${resourceId}/flag`, data);
    return response.data;
  },

  // Get user's bookmarked resources
  getUserBookmarks: async (params?: {
    groupId?: string;
    limit?: number;
    page?: number;
  }) => {
    const response = await axiosInstance.get('/shared-resources/my-bookmarks', { params });
    return response.data;
  },

  // Get user's shared resources
  getUserSharedResources: async (params?: {
    groupId?: string;
    limit?: number;
    page?: number;
  }) => {
    const response = await axiosInstance.get('/shared-resources/my-resources', { params });
    return response.data;
  },

  // Get trending resources for a group
  getTrendingResources: async (groupId: string, params?: {
    days?: number;
    limit?: number;
  }) => {
    const response = await axiosInstance.get(`/shared-resources/group/${groupId}/trending`, { params });
    return response.data;
  },
};
