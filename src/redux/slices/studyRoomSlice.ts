import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as studyRoomApi from '@/api/studyRoomApi';
import type { StudyRoom } from '@/api/studyRoomApi';

interface StudyRoomState {
  rooms: StudyRoom[];
  currentRoom: StudyRoom | null;
  myHistory: StudyRoom[];
  loading: boolean;
  error: string | null;
}

const initialState: StudyRoomState = {
  rooms: [],
  currentRoom: null,
  myHistory: [],
  loading: false,
  error: null,
};

export const createRoom = createAsyncThunk(
  'studyRooms/create',
  async (data: Partial<StudyRoom>) => {
    return await studyRoomApi.createStudyRoom(data);
  }
);

export const fetchGroupRooms = createAsyncThunk(
  'studyRooms/fetchGroupRooms',
  async ({ groupId, params }: { groupId: string; params?: any }) => {
    return await studyRoomApi.getGroupStudyRooms(groupId, params);
  }
);

export const fetchRoomById = createAsyncThunk(
  'studyRooms/fetchById',
  async (id: string) => {
    return await studyRoomApi.getStudyRoom(id);
  }
);

export const joinRoom = createAsyncThunk(
  'studyRooms/join',
  async (id: string) => {
    return await studyRoomApi.joinStudyRoom(id);
  }
);

export const leaveRoom = createAsyncThunk(
  'studyRooms/leave',
  async (id: string) => {
    return await studyRoomApi.leaveStudyRoom(id);
  }
);

export const startSession = createAsyncThunk(
  'studyRooms/startSession',
  async (id: string) => {
    return await studyRoomApi.startStudySession(id);
  }
);

export const endSession = createAsyncThunk(
  'studyRooms/endSession',
  async (id: string) => {
    return await studyRoomApi.endStudySession(id);
  }
);

export const nextPomodoro = createAsyncThunk(
  'studyRooms/nextPomodoro',
  async (id: string) => {
    return await studyRoomApi.nextPomodoroPhase(id);
  }
);

export const submitFeedback = createAsyncThunk(
  'studyRooms/submitFeedback',
  async ({ id, feedback }: { id: string; feedback: any }) => {
    return await studyRoomApi.submitSessionFeedback(id, feedback);
  }
);

export const fetchMyHistory = createAsyncThunk(
  'studyRooms/fetchHistory',
  async (params?: any) => {
    return await studyRoomApi.getUserStudyRoomHistory(params);
  }
);

const studyRoomSlice = createSlice({
  name: 'studyRooms',
  initialState,
  reducers: {
    clearCurrentRoom: (state) => {
      state.currentRoom = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms.unshift(action.payload);
        state.currentRoom = action.payload;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create room';
      })

      .addCase(fetchGroupRooms.fulfilled, (state, action) => {
        state.rooms = action.payload;
      })

      .addCase(fetchRoomById.fulfilled, (state, action) => {
        state.currentRoom = action.payload;
      })

      .addCase(joinRoom.fulfilled, (state, action) => {
        state.currentRoom = action.payload;
      })

      .addCase(leaveRoom.fulfilled, (state, action) => {
        state.currentRoom = action.payload;
      })

      .addCase(startSession.fulfilled, (state, action) => {
        state.currentRoom = action.payload;
      })

      .addCase(endSession.fulfilled, (state, action) => {
        state.currentRoom = action.payload;
      })

      .addCase(nextPomodoro.fulfilled, (state, action) => {
        state.currentRoom = action.payload;
      })

      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.currentRoom = action.payload;
      })

      .addCase(fetchMyHistory.fulfilled, (state, action) => {
        state.myHistory = action.payload;
      });
  },
});

export const { clearCurrentRoom } = studyRoomSlice.actions;
export default studyRoomSlice.reducer;
