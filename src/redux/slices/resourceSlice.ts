import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as resourceApi from '@/api/resourceApi';
import type { Resource, ResourceStats } from '@/api/resourceApi';

interface ResourceState {
  resources: Resource[];
  currentResource: Resource | null;
  categories: string[];
  tags: string[];
  stats: ResourceStats | null;
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: ResourceState = {
  resources: [],
  currentResource: null,
  categories: [],
  tags: [],
  stats: null,
  total: 0,
  loading: false,
  error: null,
};

export const fetchResources = createAsyncThunk(
  'resources/fetchAll',
  async (params?: any) => {
    return await resourceApi.getResources(params);
  }
);

export const fetchResourceById = createAsyncThunk(
  'resources/fetchById',
  async (id: string) => {
    return await resourceApi.getResource(id);
  }
);

export const createNewResource = createAsyncThunk(
  'resources/create',
  async (data: Partial<Resource>) => {
    return await resourceApi.createResource(data);
  }
);

export const updateExistingResource = createAsyncThunk(
  'resources/update',
  async ({ id, updates }: { id: string; updates: Partial<Resource> }) => {
    return await resourceApi.updateResource(id, updates);
  }
);

export const deleteExistingResource = createAsyncThunk(
  'resources/delete',
  async (id: string) => {
    await resourceApi.deleteResource(id);
    return id;
  }
);

export const recordResourceAccess = createAsyncThunk(
  'resources/recordAccess',
  async (id: string) => {
    await resourceApi.recordAccess(id);
    return id;
  }
);

export const toggleResourceBookmark = createAsyncThunk(
  'resources/toggleBookmark',
  async (id: string) => {
    return await resourceApi.toggleBookmark(id);
  }
);

export const fetchCategories = createAsyncThunk(
  'resources/fetchCategories',
  async () => {
    return await resourceApi.getCategories();
  }
);

export const fetchTags = createAsyncThunk(
  'resources/fetchTags',
  async () => {
    return await resourceApi.getTags();
  }
);

export const fetchResourceStats = createAsyncThunk(
  'resources/fetchStats',
  async () => {
    return await resourceApi.getResourceStats();
  }
);

export const performBulkOperation = createAsyncThunk(
  'resources/bulkOperation',
  async (operation: any) => {
    await resourceApi.bulkOperations(operation);
    return operation;
  }
);

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    clearCurrentResource: (state) => {
      state.currentResource = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.loading = false;
        state.resources = action.payload.resources;
        state.total = action.payload.total;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch resources';
      })

      .addCase(fetchResourceById.fulfilled, (state, action) => {
        state.currentResource = action.payload;
      })

      .addCase(createNewResource.fulfilled, (state, action) => {
        state.resources.unshift(action.payload);
        state.currentResource = action.payload;
        state.total += 1;
      })

      .addCase(updateExistingResource.fulfilled, (state, action) => {
        state.currentResource = action.payload;
        const index = state.resources.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      })

      .addCase(deleteExistingResource.fulfilled, (state, action) => {
        state.resources = state.resources.filter((r) => r._id !== action.payload);
        if (state.currentResource?._id === action.payload) {
          state.currentResource = null;
        }
        state.total -= 1;
      })

      .addCase(toggleResourceBookmark.fulfilled, (state, action) => {
        state.currentResource = action.payload;
        const index = state.resources.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      })

      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })

      .addCase(fetchTags.fulfilled, (state, action) => {
        state.tags = action.payload;
      })

      .addCase(fetchResourceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearCurrentResource } = resourceSlice.actions;
export default resourceSlice.reducer;
