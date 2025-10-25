import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Target, Calendar, Clock, FileText, TrendingUp, User, LogOut, Users, Video, Share2, Trophy } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logout } from '@/redux/slices/authSlice';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

const Sidebar = ({ mobile = false, onNavigate }: SidebarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    onNavigate?.(); // Close mobile menu
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.(); // Close mobile menu on navigation
  };

  // Navigation items - General purpose study app
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Subjects', path: '/subjects' },
    { icon: Target, label: 'Daily Goals', path: '/daily-goals' },
    { icon: Calendar, label: 'Monthly Plan', path: '/monthly-plan' },
    { icon: Clock, label: 'Study Sessions', path: '/study-sessions' },
    { icon: TrendingUp, label: 'Progress Analytics', path: '/advanced-progress' },
  ];

  // Peer Study Features
  const peerStudyItems = [
    { icon: Users, label: 'Study Groups', path: '/study-groups' },
    { icon: Video, label: 'Study Rooms', path: '/study-rooms' },
    { icon: Share2, label: 'Resources', path: '/shared-resources' },
    { icon: Trophy, label: 'Challenges', path: '/challenges' },
  ];

  const profileItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: LogOut, label: 'Logout', path: '/logout', action: 'logout' },
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 w-64 h-screen bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] shadow-lg overflow-y-auto">
      {/* Background Image Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
            <pattern id="circles" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#circles)" opacity="0.5" />
          {/* Wave pattern */}
          <path d="M0,100 Q64,50 128,100 T256,100 L256,120 L0,120 Z" fill="currentColor" opacity="0.1" />
          <path d="M0,200 Q96,150 192,200 T384,200 L384,220 L0,220 Z" fill="currentColor" opacity="0.08" />
          <path d="M0,300 Q128,250 256,300 T512,300 L512,320 L0,320 Z" fill="currentColor" opacity="0.06" />
        </svg>
      </div>
      
      <div className="relative flex h-full flex-col">
        <div className="p-6 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--sidebar-primary))] to-[hsl(var(--sidebar-accent))] flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lg font-black text-[hsl(var(--sidebar-primary))]">E</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-[hsl(var(--sidebar-foreground))] tracking-tight">
                Examprep
              </h1>
              <p className="text-xs text-[hsl(var(--sidebar-foreground))] opacity-75">Study Smart</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[hsl(var(--sidebar-primary))] bg-opacity-10 border border-[hsl(var(--sidebar-primary))] border-opacity-20">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-primary))] bg-opacity-20 flex items-center justify-center">
              <User className="h-4 w-4 text-[hsl(var(--sidebar-foreground))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))]">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-[hsl(var(--sidebar-foreground))] opacity-75">Student</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 bg-[hsl(var(--sidebar-background))]">
          <div className="space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => mobile && onNavigate?.()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-white bg-opacity-20 text-[hsl(var(--sidebar-foreground))] shadow-sm border border-white border-opacity-30'
                          : 'text-[hsl(var(--sidebar-foreground))] opacity-80 hover:opacity-100 hover:bg-white hover:bg-opacity-10'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`h-4 w-4 transition-all duration-200 ${isActive ? 'text-[hsl(var(--sidebar-foreground))]' : 'opacity-70 group-hover:opacity-90'}`} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Peer Study Section */}
            <div>
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-[hsl(var(--sidebar-foreground))] opacity-60 uppercase tracking-wider">
                  Peer Study
                </h3>
              </div>
              <div className="space-y-1">
                {peerStudyItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => mobile && onNavigate?.()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                          isActive
                            ? 'bg-white bg-opacity-20 text-[hsl(var(--sidebar-foreground))] shadow-sm border border-white border-opacity-30'
                            : 'text-[hsl(var(--sidebar-foreground))] opacity-80 hover:opacity-100 hover:bg-white hover:bg-opacity-10'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={`h-4 w-4 transition-all duration-200 ${isActive ? 'text-[hsl(var(--sidebar-foreground))]' : 'opacity-70 group-hover:opacity-90'}`} />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Profile Section */}
            <div className="pt-2 border-t border-white border-opacity-20">
              {profileItems.map((item) => {
                const Icon = item.icon;
                
                // Handle logout action differently
                if (item.path === '/logout') {
                  return (
                    <AlertDialog key={item.path}>
                      <AlertDialogTrigger asChild>
                        <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-[hsl(var(--sidebar-foreground))] hover:bg-white hover:bg-opacity-15 w-full text-left group">
                          <Icon className="h-4 w-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                          {item.label}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to logout? You will need to sign in again to access your account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLogout}>
                            Yes, Logout
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  );
                }
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => mobile && onNavigate?.()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-white bg-opacity-20 text-[hsl(var(--sidebar-foreground))] shadow-sm border border-white border-opacity-30'
                          : 'text-[hsl(var(--sidebar-foreground))] opacity-80 hover:opacity-100 hover:bg-white hover:bg-opacity-10'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`h-4 w-4 transition-all duration-200 ${isActive ? 'text-[hsl(var(--sidebar-foreground))]' : 'opacity-70 group-hover:opacity-90'}`} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
