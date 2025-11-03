import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import bookSlice from './slices/bookSlice';
import dailyGoalSlice from './slices/dailyGoalSlice';
import monthlyPlanSlice from './slices/monthlyPlanSlice';
import studySessionSlice from './slices/studySessionSlice';
import syllabusSlice from './slices/syllabusSlice';
import uiSlice from './slices/uiSlice';
import notificationSlice from './slices/notificationSlice';
import newspaperAnalysisSlice from './slices/newspaperAnalysisSlice';
import studyGroupSlice from './slices/studyGroupSlice';
import studyRoomSlice from './slices/studyRoomSlice';
import upscResourceSlice from './slices/upscResourceSlice';
import resourceSlice from './slices/resourceSlice';
import sharedResourceSlice from './slices/sharedResourceSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    books: bookSlice,
    dailyGoals: dailyGoalSlice,
    monthlyPlans: monthlyPlanSlice,
    studySessions: studySessionSlice,
    syllabus: syllabusSlice,
    ui: uiSlice,
    notifications: notificationSlice,
    newspaperAnalysis: newspaperAnalysisSlice,
    studyGroups: studyGroupSlice,
    studyRooms: studyRoomSlice,
    upscResources: upscResourceSlice,
    resources: resourceSlice,
    sharedResources: sharedResourceSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
