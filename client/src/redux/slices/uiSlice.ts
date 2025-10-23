import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Alert {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UIState {
  isLoading: boolean;
  alerts: Alert[];
}

const initialState: UIState = {
  isLoading: false,
  alerts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addAlert: (state, action: PayloadAction<Omit<Alert, 'id'>>) => {
      const id = Date.now().toString();
      state.alerts.push({ ...action.payload, id });
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((alert) => alert.id !== action.payload);
    },
    clearAlerts: (state) => {
      state.alerts = [];
    },
  },
});

export const { setLoading, addAlert, removeAlert, clearAlerts } = uiSlice.actions;
export default uiSlice.reducer;
