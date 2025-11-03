import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Resource {
  _id: string;
  id: string;
  title: string;
  link: string;
  description?: string;
  category: string;
  linkType: 'external_url' | 'file_upload' | 'notes' | 'document';
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  accessCount: number;
  lastAccessedAt?: string;
  isBookmarked: boolean;
  relatedBooks: Array<{
    _id: string;
    title: string;
    subject: string;
  }>;
  fileSize?: number;
  fileType?: string;
  originalFileName?: string;
  formattedFileSize?: string;
  linkPreview?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceFilters {
  search?: string;
  category?: string;
  tags?: string[];
  priority?: string;
  linkType?: string;
  isBookmarked?: boolean;
}

export interface ResourceStats {
  totalResources: number;
  totalBookmarked: number;
  totalAccesses: number;
  categoriesCount: number;
  avgAccessCount: number;
  linkTypeDistribution: Record<string, number>;
}

export interface ResourcePagination {
  currentPage: number;
  totalPages: number;
  totalResources: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface ResourceState {
  resources: Resource[];
  categories: string[];
  tags: Array<{ tag: string; count: number }>;
  stats: ResourceStats;
  pagination: ResourcePagination | null;
  filters: ResourceFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
  selectedResources: string[];
}

const initialState: ResourceState = {
  resources: [],
  categories: [],
  tags: [],
  stats: {
    totalResources: 0,
    totalBookmarked: 0,
    totalAccesses: 0,
    categoriesCount: 0,
    avgAccessCount: 0,
    linkTypeDistribution: {}
  },
  pagination: null,
  filters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc',
  isLoading: false,
  error: null,
  selectedResources: []
};

// Async thunks
export const fetchResources = createAsyncThunk(
  'resources/fetchResources',
  async (params: {
    filters?: ResourceFilters;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}) => {
    const { filters = {}, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 50 } = params;
    
    const searchParams = new URLSearchParams();
    
    if (filters.search) searchParams.append('search', filters.search);
    if (filters.category) searchParams.append('category', filters.category);
    if (filters.tags?.length) {
      filters.tags.forEach(tag => searchParams.append('tags', tag));
    }
    if (filters.priority) searchParams.append('priority', filters.priority);
    if (filters.linkType) searchParams.append('linkType', filters.linkType);
    if (filters.isBookmarked !== undefined) {
      searchParams.append('isBookmarked', filters.isBookmarked.toString());
    }
    
    searchParams.append('sortBy', sortBy);
    searchParams.append('sortOrder', sortOrder);
    searchParams.append('page', page.toString());
    searchParams.append('limit', limit.toString());

    const response = await fetch(`/api/resources?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    
    return response.json();
  }
);

export const createResource = createAsyncThunk(
  'resources/createResource',
  async (resourceData: Partial<Resource>) => {
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(resourceData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create resource');
    }
    
    return response.json();
  }
);

export const updateResource = createAsyncThunk(
  'resources/updateResource',
  async ({ id, data }: { id: string; data: Partial<Resource> }) => {
    const response = await fetch(`/api/resources/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update resource');
    }
    
    return response.json();
  }
);

export const deleteResource = createAsyncThunk(
  'resources/deleteResource',
  async (id: string) => {
    const response = await fetch(`/api/resources/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete resource');
    }
    
    return { id };
  }
);

export const recordAccess = createAsyncThunk(
  'resources/recordAccess',
  async (id: string) => {
    const response = await fetch(`/api/resources/${id}/access`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to record access');
    }
    
    const result = await response.json();
    return { id, ...result.data };
  }
);

export const toggleBookmark = createAsyncThunk(
  'resources/toggleBookmark',
  async (id: string) => {
    const response = await fetch(`/api/resources/${id}/bookmark`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle bookmark');
    }
    
    const result = await response.json();
    return { id, ...result.data };
  }
);

export const fetchCategories = createAsyncThunk(
  'resources/fetchCategories',
  async () => {
    const response = await fetch('/api/resources/categories', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    const result = await response.json();
    return result.data;
  }
);

export const fetchTags = createAsyncThunk(
  'resources/fetchTags',
  async () => {
    const response = await fetch('/api/resources/tags', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }
    
    const result = await response.json();
    return result.data;
  }
);

export const fetchStats = createAsyncThunk(
  'resources/fetchStats',
  async () => {
    const response = await fetch('/api/resources/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    const result = await response.json();
    return result.data;
  }
);

export const bulkOperations = createAsyncThunk(
  'resources/bulkOperations',
  async ({ operation, resourceIds, data }: {
    operation: 'delete' | 'bookmark' | 'unbookmark' | 'updateCategory' | 'updatePriority';
    resourceIds: string[];
    data?: { category?: string; priority?: string };
  }) => {
    const response = await fetch('/api/resources/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ operation, resourceIds, data })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to perform bulk operation');
    }
    
    return { operation, resourceIds, data };
  }
);

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ResourceFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSorting: (state, action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    setSelectedResources: (state, action: PayloadAction<string[]>) => {
      state.selectedResources = action.payload;
    },
    toggleResourceSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const index = state.selectedResources.indexOf(id);
      if (index > -1) {
        state.selectedResources.splice(index, 1);
      } else {
        state.selectedResources.push(id);
      }
    },
    clearSelection: (state) => {
      state.selectedResources = [];
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch resources
      .addCase(fetchResources.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resources = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch resources';
      })
      
      // Create resource
      .addCase(createResource.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resources.unshift(action.payload.data);
      })
      .addCase(createResource.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create resource';
      })
      
      // Update resource
      .addCase(updateResource.fulfilled, (state, action) => {
        const index = state.resources.findIndex(r => r._id === action.payload.data._id);
        if (index !== -1) {
          state.resources[index] = action.payload.data;
        }
      })
      .addCase(updateResource.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update resource';
      })
      
      // Delete resource
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.resources = state.resources.filter(r => r._id !== action.payload.id);
      })
      .addCase(deleteResource.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete resource';
      })
      
      // Record access
      .addCase(recordAccess.fulfilled, (state, action) => {
        const resource = state.resources.find(r => r._id === action.payload.id);
        if (resource) {
          resource.accessCount = action.payload.accessCount;
          resource.lastAccessedAt = action.payload.lastAccessedAt;
        }
      })
      
      // Toggle bookmark
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        const resource = state.resources.find(r => r._id === action.payload.id);
        if (resource) {
          resource.isBookmarked = action.payload.isBookmarked;
        }
      })
      
      // Fetch categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      
      // Fetch tags
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.tags = action.payload;
      })
      
      // Fetch stats
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      
      // Bulk operations
      .addCase(bulkOperations.fulfilled, (state, action) => {
        const { operation, resourceIds } = action.payload;
        
        switch (operation) {
          case 'delete':
            state.resources = state.resources.filter(r => !resourceIds.includes(r._id));
            break;
          case 'bookmark':
            state.resources.forEach(r => {
              if (resourceIds.includes(r._id)) {
                r.isBookmarked = true;
              }
            });
            break;
          case 'unbookmark':
            state.resources.forEach(r => {
              if (resourceIds.includes(r._id)) {
                r.isBookmarked = false;
              }
            });
            break;
        }
        
        state.selectedResources = [];
      });
  }
});

export const {
  setFilters,
  clearFilters,
  setSorting,
  setSelectedResources,
  toggleResourceSelection,
  clearSelection,
  clearError
} = resourceSlice.actions;

export default resourceSlice.reducer;
