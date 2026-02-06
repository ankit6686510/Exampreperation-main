import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as studyGroupApi from '@/api/studyGroupApi';
import type { StudyGroup, GroupActivity, Leaderboard, GroupPermission } from '@/api/studyGroupApi';

interface StudyGroupState {
  publicGroups: StudyGroup[];
  myGroups: StudyGroup[];
  currentGroup: StudyGroup | null;
  leaderboard: Leaderboard[];
  activities: GroupActivity[];
  permissions: GroupPermission[];
  pendingPermissions: GroupPermission[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: StudyGroupState = {
  publicGroups: [],
  myGroups: [],
  currentGroup: null,
  leaderboard: [],
  activities: [],
  permissions: [],
  pendingPermissions: [],
  total: 0,
  loading: false,
  error: null,
};

export const fetchPublicGroups = createAsyncThunk(
  'studyGroups/fetchPublic',
  async (params?: any) => {
    return await studyGroupApi.getPublicGroups(params);
  }
);

export const fetchUserGroups = createAsyncThunk(
  'studyGroups/fetchUserGroups',
  async () => {
    return await studyGroupApi.getUserGroups();
  }
);

export const fetchStudyGroup = createAsyncThunk(
  'studyGroups/fetchById',
  async (id: string) => {
    return await studyGroupApi.getStudyGroup(id);
  }
);

export const createNewStudyGroup = createAsyncThunk(
  'studyGroups/create',
  async (data: Partial<StudyGroup>) => {
    return await studyGroupApi.createStudyGroup(data);
  }
);

export const updateExistingStudyGroup = createAsyncThunk(
  'studyGroups/update',
  async ({ id, updates }: { id: string; updates: Partial<StudyGroup> }) => {
    return await studyGroupApi.updateStudyGroup(id, updates);
  }
);

export const deleteExistingStudyGroup = createAsyncThunk(
  'studyGroups/delete',
  async (id: string) => {
    await studyGroupApi.deleteStudyGroup(id);
    return id;
  }
);

export const joinGroup = createAsyncThunk(
  'studyGroups/join',
  async (id: string) => {
    return await studyGroupApi.joinStudyGroup(id);
  }
);

export const leaveGroup = createAsyncThunk(
  'studyGroups/leave',
  async (id: string) => {
    return await studyGroupApi.leaveStudyGroup(id);
  }
);

export const fetchGroupLeaderboard = createAsyncThunk(
  'studyGroups/fetchLeaderboard',
  async (id: string) => {
    return await studyGroupApi.getGroupLeaderboard(id);
  }
);

export const fetchGroupActivities = createAsyncThunk(
  'studyGroups/fetchActivities',
  async ({ id, params }: { id: string; params?: any }) => {
    return await studyGroupApi.getGroupActivities(id, params);
  }
);

export const fetchPendingPermissions = createAsyncThunk(
  'studyGroups/fetchPendingPermissions',
  async () => {
    return await studyGroupApi.getPendingPermissions();
  }
);

export const fetchGroupPermissions = createAsyncThunk(
  'studyGroups/fetchGroupPermissions',
  async (groupId: string) => {
    return await studyGroupApi.getGroupPermissions(groupId);
  }
);

export const requestGroupPermission = createAsyncThunk(
  'studyGroups/requestPermission',
  async ({ groupId, data }: { groupId: string; data: any }) => {
    return await studyGroupApi.requestPermission(groupId, data);
  }
);

export const respondToGroupPermission = createAsyncThunk(
  'studyGroups/respondPermission',
  async ({ groupId, permissionId, response }: { groupId: string; permissionId: string; response: 'approve' | 'reject' }) => {
    return await studyGroupApi.respondToPermission(groupId, permissionId, response);
  }
);

const studyGroupSlice = createSlice({
  name: 'studyGroups',
  initialState,
  reducers: {
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch public groups
      .addCase(fetchPublicGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.publicGroups = action.payload.groups;
        state.total = action.payload.total;
      })
      .addCase(fetchPublicGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch groups';
      })

      // Fetch user groups
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.myGroups = action.payload;
      })

      // Fetch group by ID
      .addCase(fetchStudyGroup.fulfilled, (state, action) => {
        state.currentGroup = action.payload;
      })

      // Create group
      .addCase(createNewStudyGroup.fulfilled, (state, action) => {
        state.myGroups.unshift(action.payload);
        state.currentGroup = action.payload;
      })

      // Update group
      .addCase(updateExistingStudyGroup.fulfilled, (state, action) => {
        state.currentGroup = action.payload;
        const index = state.myGroups.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) {
          state.myGroups[index] = action.payload;
        }
      })

      // Delete group
      .addCase(deleteExistingStudyGroup.fulfilled, (state, action) => {
        state.myGroups = state.myGroups.filter((g) => g._id !== action.payload);
        if (state.currentGroup?._id === action.payload) {
          state.currentGroup = null;
        }
      })

      // Join group
      .addCase(joinGroup.fulfilled, (state, action) => {
        state.currentGroup = action.payload;
        const existsInMyGroups = state.myGroups.some((g) => g._id === action.payload._id);
        if (!existsInMyGroups) {
          state.myGroups.unshift(action.payload);
        }
      })

      // Leave group
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.myGroups = state.myGroups.filter((g) => g._id !== action.payload._id);
        if (state.currentGroup?._id === action.payload._id) {
          state.currentGroup = null;
        }
      })

      // Leaderboard
      .addCase(fetchGroupLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
      })

      // Activities
      .addCase(fetchGroupActivities.fulfilled, (state, action) => {
        state.activities = action.payload.activities;
      })

      // Permissions
      .addCase(fetchPendingPermissions.fulfilled, (state, action) => {
        state.pendingPermissions = action.payload;
      })
      .addCase(fetchGroupPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload;
      })
      .addCase(requestGroupPermission.fulfilled, (state, action) => {
        state.permissions.unshift(action.payload);
      })
      .addCase(respondToGroupPermission.fulfilled, (state, action) => {
        const index = state.pendingPermissions.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.pendingPermissions.splice(index, 1);
        }
      });
  },
});

export const { clearCurrentGroup } = studyGroupSlice.actions;
export default studyGroupSlice.reducer;
