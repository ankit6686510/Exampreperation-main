import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as sharedResourceApi from '@/api/sharedResourceApi';
import type { SharedResource } from '@/api/sharedResourceApi';

interface SharedResourceState {
  resources: SharedResource[];
  currentResource: SharedResource | null;
  myBookmarks: SharedResource[];
  myResources: SharedResource[];
  trendingResources: SharedResource[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: SharedResourceState = {
  resources: [],
  currentResource: null,
  myBookmarks: [],
  myResources: [],
  trendingResources: [],
  total: 0,
  loading: false,
  error: null,
};

export const createSharedResource = createAsyncThunk(
  'sharedResources/create',
  async (data: Partial<SharedResource>) => {
    return await sharedResourceApi.createSharedResource(data);
  }
);

export const fetchGroupResources = createAsyncThunk(
  'sharedResources/fetchGroupResources',
  async ({ groupId, params }: { groupId: string; params?: any }) => {
    return await sharedResourceApi.getGroupResources(groupId, params);
  }
);

export const fetchSharedResourceById = createAsyncThunk(
  'sharedResources/fetchById',
  async (id: string) => {
    return await sharedResourceApi.getSharedResource(id);
  }
);

export const downloadSharedResource = createAsyncThunk(
  'sharedResources/download',
  async (id: string) => {
    await sharedResourceApi.downloadResource(id);
    return id;
  }
);

export const toggleSharedResourceBookmark = createAsyncThunk(
  'sharedResources/toggleBookmark',
  async (id: string) => {
    return await sharedResourceApi.toggleBookmark(id);
  }
);

export const rateSharedResource = createAsyncThunk(
  'sharedResources/rate',
  async ({ id, rating, comment }: { id: string; rating: number; comment?: string }) => {
    return await sharedResourceApi.rateResource(id, rating, comment);
  }
);

export const flagSharedResource = createAsyncThunk(
  'sharedResources/flag',
  async ({ id, reason }: { id: string; reason: string }) => {
    await sharedResourceApi.flagResource(id, reason);
    return id;
  }
);

export const fetchMyBookmarks = createAsyncThunk(
  'sharedResources/fetchMyBookmarks',
  async () => {
    return await sharedResourceApi.getUserBookmarks();
  }
);

export const fetchMySharedResources = createAsyncThunk(
  'sharedResources/fetchMyResources',
  async () => {
    return await sharedResourceApi.getUserSharedResources();
  }
);

export const fetchTrendingResources = createAsyncThunk(
  'sharedResources/fetchTrending',
  async ({ groupId, params }: { groupId: string; params?: any }) => {
    return await sharedResourceApi.getTrendingResources(groupId, params);
  }
);

const sharedResourceSlice = createSlice({
  name: 'sharedResources',
  initialState,
  reducers: {
    clearCurrentResource: (state) => {
      state.currentResource = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSharedResource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSharedResource.fulfilled, (state, action) => {
        state.loading = false;
        state.resources.unshift(action.payload);
        state.myResources.unshift(action.payload);
        state.currentResource = action.payload;
      })
      .addCase(createSharedResource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create resource';
      })

      .addCase(fetchGroupResources.fulfilled, (state, action) => {
        state.resources = action.payload.resources;
        state.total = action.payload.total;
      })

      .addCase(fetchSharedResourceById.fulfilled, (state, action) => {
        state.currentResource = action.payload;
      })

      .addCase(downloadSharedResource.fulfilled, (state, action) => {
        const resource = state.resources.find((r) => r._id === action.payload);
        if (resource) {
          resource.downloadCount += 1;
        }
        if (state.currentResource?._id === action.payload) {
          state.currentResource.downloadCount += 1;
        }
      })

      .addCase(toggleSharedResourceBookmark.fulfilled, (state, action) => {
        state.currentResource = action.payload;
        const index = state.resources.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      })

      .addCase(rateSharedResource.fulfilled, (state, action) => {
        state.currentResource = action.payload;
        const index = state.resources.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      })

      .addCase(fetchMyBookmarks.fulfilled, (state, action) => {
        state.myBookmarks = action.payload;
      })

      .addCase(fetchMySharedResources.fulfilled, (state, action) => {
        state.myResources = action.payload;
      })

      .addCase(fetchTrendingResources.fulfilled, (state, action) => {
        state.trendingResources = action.payload;
      });
  },
});

export const { clearCurrentResource } = sharedResourceSlice.actions;
export default sharedResourceSlice.reducer;
