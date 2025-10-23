import { Provider } from 'react-redux';
import { store } from './redux/store';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Books from "./pages/Books/Books";
import DailyGoals from "./pages/DailyGoals/DailyGoals";
import MonthlyPlan from "./pages/MonthlyPlan/MonthlyPlan";
import StudySessions from "./pages/StudySessions/StudySessions";
import AdvancedProgress from "./pages/AdvancedProgress/AdvancedProgress";
import Profile from "./pages/Profile/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/subjects" element={<Books />} />
              <Route path="/daily-goals" element={<DailyGoals />} />
              <Route path="/monthly-plan" element={<MonthlyPlan />} />
              <Route path="/study-sessions" element={<StudySessions />} />
              <Route path="/advanced-progress" element={<AdvancedProgress />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
