import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as upscResourceApi from '@/api/upscResourceApi';
import type { UpscResource, SubjectStats, Template } from '@/api/upscResourceApi';

interface UpscResourceState {
  resources: UpscResource[];
  currentResource: UpscResource | null;
  subjectStats: SubjectStats[];
  templates: Template[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: UpscResourceState = {
  resources: [],
  currentResource: null,
  subjectStats: [],
  templates: [],
  total: 0,
  loading: false,
  error: null,
};

export const fetchUpscResources = createAsyncThunk(
  'upscResources/fetchAll',
  async (params?: any) => {
    return await upscResourceApi.getUpscResources(params);
  }
);

export const fetchSubjectStats = createAsyncThunk(
  'upscResources/fetchStats',
  async () => {
    return await upscResourceApi.getSubjectStats();
  }
);

export const fetchTemplates = createAsyncThunk(
  'upscResources/fetchTemplates',
  async () => {
    return await upscResourceApi.getTemplates();
  }
);

export const fetchUpscResourceById = createAsyncThunk(
  'upscResources/fetchById',
  async (id: string) => {
    return await upscResourceApi.getUpscResource(id);
  }
);

export const createUpscResource = createAsyncThunk(
  'upscResources/create',
  async (data: Partial<UpscResource>) => {
    return await upscResourceApi.createUpscResource(data);
  }
);

export const updateUpscResource = createAsyncThunk(
  'upscResources/update',
  async ({ id, updates }: { id: string; updates: Partial<UpscResource> }) => {
    return await upscResourceApi.updateUpscResource(id, updates);
  }
);

export const updateChapter = createAsyncThunk(
  'upscResources/updateChapter',
  async ({ id, chapterId, status, data }: { id: string; chapterId: string; status: string; data?: any }) => {
    return await upscResourceApi.updateChapterStatus(id, chapterId, status, data);
  }
);

export const deleteUpscResource = createAsyncThunk(
  'upscResources/delete',
  async (id: string) => {
    await upscResourceApi.deleteUpscResource(id);
    return id;
  }
);

export const importTemplate = createAsyncThunk(
  'upscResources/importTemplate',
  async ({ templateId, customizations }: { templateId: string; customizations?: any }) => {
    return await upscResourceApi.importUpscTemplate(templateId, customizations);
  }
);

export const bulkUpdate = createAsyncThunk(
  'upscResources/bulkUpdate',
  async (updates: Array<{ id: string; updates: Partial<UpscResource> }>) => {
    return await upscResourceApi.bulkUpdateResources(updates);
  }
);

const upscResourceSlice = createSlice({
  name: 'upscResources',
  initialState,
  reducers: {
    clearCurrentResource: (state) => {
      state.currentResource = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUpscResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpscResources.fulfilled, (state, action) => {
        state.loading = false;
        state.resources = action.payload.resources;
        state.total = action.payload.total;
      })
      .addCase(fetchUpscResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch resources';
      })

      .addCase(fetchSubjectStats.fulfilled, (state, action) => {
        state.subjectStats = action.payload;
      })

      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      })

      .addCase(fetchUpscResourceById.fulfilled, (state, action) => {
        state.currentResource = action.payload;
      })

      .addCase(createUpscResource.fulfilled, (state, action) => {
        state.resources.unshift(action.payload);
        state.currentResource = action.payload;
        state.total += 1;
      })

      .addCase(updateUpscResource.fulfilled, (state, action) => {
        state.currentResource = action.payload;
        const index = state.resources.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      })

      .addCase(updateChapter.fulfilled, (state, action) => {
        state.currentResource = action.payload;
        const index = state.resources.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      })

      .addCase(deleteUpscResource.fulfilled, (state, action) => {
        state.resources = state.resources.filter((r) => r._id !== action.payload);
        if (state.currentResource?._id === action.payload) {
          state.currentResource = null;
        }
        state.total -= 1;
      })

      .addCase(importTemplate.fulfilled, (state, action) => {
        state.resources = [...action.payload, ...state.resources];
        state.total += action.payload.length;
      })

      .addCase(bulkUpdate.fulfilled, (state, action) => {
        action.payload.forEach((updated) => {
          const index = state.resources.findIndex((r) => r._id === updated._id);
          if (index !== -1) {
            state.resources[index] = updated;
          }
        });
      });
  },
});

export const { clearCurrentResource } = upscResourceSlice.actions;
export default upscResourceSlice.reducer;
