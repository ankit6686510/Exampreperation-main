import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { upscResourceApi, UpscResource, SubjectStats, UpscTemplate } from '../../api/upscResourceApi';

interface UpscResourceState {
  resources: UpscResource[];
  selectedResources: string[];
  subjectStats: SubjectStats[];
  templates: Record<string, UpscTemplate[]>;
  filters: {
    category: string;
    subject: string;
    status: string;
    priority: string;
    search: string;
  };
  isLoading: boolean;
  statsLoading: boolean;
  templatesLoading: boolean;
  error: string | null;
}

const initialState: UpscResourceState = {
  resources: [],
  selectedResources: [],
  subjectStats: [],
  templates: {},
  filters: {
    category: '',
    subject: '',
    status: '',
    priority: '',
    search: '',
  },
  isLoading: false,
  statsLoading: false,
  templatesLoading: false,
  error: null,
};

// Async thunks
export const fetchUpscResources = createAsyncThunk(
  'upscResources/fetchResources',
  async (filters?: { category?: string; subject?: string; status?: string; priority?: string; search?: string }) => {
    return await upscResourceApi.getUpscResources(filters);
  }
);

export const fetchSubjectStats = createAsyncThunk(
  'upscResources/fetchSubjectStats',
  async () => {
    return await upscResourceApi.getSubjectStats();
  }
);

export const fetchTemplates = createAsyncThunk(
  'upscResources/fetchTemplates',
  async (templateCategory?: string) => {
    return await upscResourceApi.getTemplates(templateCategory);
  }
);

export const createUpscResource = createAsyncThunk(
  'upscResources/createResource',
  async (data: Parameters<typeof upscResourceApi.createUpscResource>[0]) => {
    return await upscResourceApi.createUpscResource(data);
  }
);

export const updateUpscResource = createAsyncThunk(
  'upscResources/updateResource',
  async ({ id, data }: { id: string; data: Parameters<typeof upscResourceApi.updateUpscResource>[1] }) => {
    return await upscResourceApi.updateUpscResource(id, data);
  }
);

export const updateChapterStatus = createAsyncThunk(
  'upscResources/updateChapterStatus',
  async ({ 
    resourceId, 
    chapterId, 
    data 
  }: { 
    resourceId: string; 
    chapterId: string; 
    data: Parameters<typeof upscResourceApi.updateChapterStatus>[2] 
  }) => {
    return await upscResourceApi.updateChapterStatus(resourceId, chapterId, data);
  }
);

export const deleteUpscResource = createAsyncThunk(
  'upscResources/deleteResource',
  async (id: string) => {
    await upscResourceApi.deleteUpscResource(id);
    return id;
  }
);

export const importTemplate = createAsyncThunk(
  'upscResources/importTemplate',
  async (templateCategory: string) => {
    return await upscResourceApi.importTemplate(templateCategory);
  }
);

export const bulkUpdateResources = createAsyncThunk(
  'upscResources/bulkUpdate',
  async (data: Parameters<typeof upscResourceApi.bulkUpdateResources>[0]) => {
    return await upscResourceApi.bulkUpdateResources(data);
  }
);

const upscResourceSlice = createSlice({
  name: 'upscResources',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<UpscResourceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    toggleResourceSelection: (state, action: PayloadAction<string>) => {
      const resourceId = action.payload;
      if (state.selectedResources.includes(resourceId)) {
        state.selectedResources = state.selectedResources.filter(id => id !== resourceId);
      } else {
        state.selectedResources.push(resourceId);
      }
    },
    clearSelection: (state) => {
      state.selectedResources = [];
    },
    selectAllResources: (state) => {
      state.selectedResources = state.resources.map(resource => resource._id);
    },
    updateResourceOptimistic: (state, action: PayloadAction<{ id: string; updates: Partial<UpscResource> }>) => {
      const { id, updates } = action.payload;
      const index = state.resources.findIndex(resource => resource._id === id);
      if (index !== -1) {
        state.resources[index] = { ...state.resources[index], ...updates };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch resources
      .addCase(fetchUpscResources.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUpscResources.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resources = action.payload;
      })
      .addCase(fetchUpscResources.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch UPSC resources';
      })
      
      // Fetch subject stats
      .addCase(fetchSubjectStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchSubjectStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.subjectStats = action.payload;
      })
      .addCase(fetchSubjectStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.error.message || 'Failed to fetch subject statistics';
      })
      
      // Fetch templates
      .addCase(fetchTemplates.pending, (state) => {
        state.templatesLoading = true;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.error = action.error.message || 'Failed to fetch templates';
      })
      
      // Create resource
      .addCase(createUpscResource.fulfilled, (state, action) => {
        state.resources.push(action.payload);
      })
      .addCase(createUpscResource.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create UPSC resource';
      })
      
      // Update resource
      .addCase(updateUpscResource.fulfilled, (state, action) => {
        const index = state.resources.findIndex(resource => resource._id === action.payload._id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      })
      .addCase(updateUpscResource.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update UPSC resource';
      })
      
      // Update chapter status
      .addCase(updateChapterStatus.fulfilled, (state, action) => {
        const index = state.resources.findIndex(resource => resource._id === action.payload._id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      })
      .addCase(updateChapterStatus.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update chapter status';
      })
      
      // Delete resource
      .addCase(deleteUpscResource.fulfilled, (state, action) => {
        state.resources = state.resources.filter(resource => resource._id !== action.payload);
        state.selectedResources = state.selectedResources.filter(id => id !== action.payload);
      })
      .addCase(deleteUpscResource.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete UPSC resource';
      })
      
      // Import template
      .addCase(importTemplate.fulfilled, (state, action) => {
        state.resources.push(...action.payload);
      })
      .addCase(importTemplate.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to import template';
      })
      
      // Bulk update
      .addCase(bulkUpdateResources.fulfilled, (state) => {
        // Clear selection after successful bulk update
        state.selectedResources = [];
      })
      .addCase(bulkUpdateResources.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to bulk update resources';
      });
  },
});

export const {
  setFilters,
  clearFilters,
  toggleResourceSelection,
  clearSelection,
  selectAllResources,
  updateResourceOptimistic,
  clearError,
} = upscResourceSlice.actions;

export default upscResourceSlice.reducer;
