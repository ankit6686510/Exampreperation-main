import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import bookSlice from './slices/bookSlice';
import dailyGoalSlice from './slices/dailyGoalSlice';
import monthlyPlanSlice from './slices/monthlyPlanSlice';
import studySessionSlice from './slices/studySessionSlice';
import syllabusSlice from './slices/syllabusSlice';
import upscResourceSlice from './slices/upscResourceSlice';
import newspaperAnalysisSlice from './slices/newspaperAnalysisSlice';
import uiSlice from './slices/uiSlice';
import resourceSlice from './slices/resourceSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    books: bookSlice,
    dailyGoals: dailyGoalSlice,
    monthlyPlans: monthlyPlanSlice,
    studySessions: studySessionSlice,
    syllabus: syllabusSlice,
    upscResources: upscResourceSlice,
    newspaperAnalysis: newspaperAnalysisSlice,
    ui: uiSlice,
    resources: resourceSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
