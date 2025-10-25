import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { useEffect } from 'react';
import { fetchProfile } from '@/redux/slices/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const dispatch = useAppDispatch();
  const { token, user, isLoading, isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If we have a token but no user data, fetch the profile
    if (token && !user && !isLoading) {
      dispatch(fetchProfile());
    }
  }, [token, user, isLoading, dispatch]);

  // Show loading while checking authentication
  if (token && !isInitialized && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
