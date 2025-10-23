import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import bookSlice from './slices/bookSlice';
import dailyGoalSlice from './slices/dailyGoalSlice';
import monthlyPlanSlice from './slices/monthlyPlanSlice';
import studySessionSlice from './slices/studySessionSlice';
import syllabusSlice from './slices/syllabusSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    books: bookSlice,
    dailyGoals: dailyGoalSlice,
    monthlyPlans: monthlyPlanSlice,
    studySessions: studySessionSlice,
    syllabus: syllabusSlice,
    ui: uiSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
