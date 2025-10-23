import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Clock,
  BookOpen,
  TrendingUp,
  Play,
  Pause,
  Square,
  Star,
  Award,
  Activity,
  Focus
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchStudySessions,
  createStudySession,
  deleteStudySession,
  fetchStudyAnalytics,
  clearError
} from '@/redux/slices/studySessionSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CreateStudySessionRequest } from '@/api/studySessionApi';
import SessionCard from '@/components/StudySessions/SessionCard';
import SessionFilters, { FilterOptions } from '@/components/StudySessions/SessionFilters';
import StatCard from '@/components/StatCard';

interface StudySession {
  _id: string;
  subject: string;
  topic?: string;
  startTime: string;
  endTime: string;
  duration: number;
  sessionType: string;
  productivity: number;
  mood: string;
  notes?: string;
  breaksTaken: number;
  isActive?: boolean;
  focusTime?: number;
  createdAt: string;
}

const StudySessions: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessions, analytics, isLoading, error } = useAppSelector((state) => state.studySessions);
  const { toast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [analyticsFilter, setAnalyticsFilter] = useState<'7d' | '30d' | '90d'>('7d');
  const [currentTimer, setCurrentTimer] = useState<{
    isRunning: boolean;
    startTime: Date | null;
    duration: number;
    sessionId?: string;
  }>({
    isRunning: false,
    startTime: null,
    duration: 0
  });
  
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    sessionTypes: [],
    subjects: [],
    moods: [],
    productivityRange: [1, 5],
    dateRange: {},
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [formData, setFormData] = useState<CreateStudySessionRequest>({
    subject: '',
    topic: '',
    startTime: '',
    endTime: '',
    sessionType: 'Reading',
    productivity: 3,
    notes: '',
    breaksTaken: 0,
    mood: 'Good'
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentTimer.isRunning && currentTimer.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - currentTimer.startTime!.getTime()) / 1000);
        setCurrentTimer(prev => ({ ...prev, duration: elapsed }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentTimer.isRunning, currentTimer.startTime]);

  useEffect(() => {
    dispatch(fetchStudySessions({}));
    dispatch(fetchStudyAnalytics(analyticsFilter));
  }, [dispatch, analyticsFilter]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      dispatch(clearError());
    }
  }, [error, dispatch, toast]);

  // Memoized filtered and sorted sessions
  const filteredSessions = useMemo(() => {
    let filtered = [...(sessions || [])];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(session =>
        session.subject.toLowerCase().includes(searchTerm) ||
        session.topic?.toLowerCase().includes(searchTerm) ||
        session.notes?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply session type filter
    if (filters.sessionTypes.length > 0) {
      filtered = filtered.filter(session => 
        filters.sessionTypes.includes(session.sessionType)
      );
    }

    // Apply subject filter
    if (filters.subjects.length > 0) {
      filtered = filtered.filter(session => 
        filters.subjects.includes(session.subject)
      );
    }

    // Apply mood filter
    if (filters.moods.length > 0) {
      filtered = filtered.filter(session => 
        filters.moods.includes(session.mood)
      );
    }

    // Apply productivity range filter
    filtered = filtered.filter(session => 
      session.productivity >= filters.productivityRange[0] && 
      session.productivity <= filters.productivityRange[1]
    );

    // Apply date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.startTime);
        if (filters.dateRange.from && sessionDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && sessionDate > filters.dateRange.to) return false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(a.startTime).getTime();
          bValue = new Date(b.startTime).getTime();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'productivity':
          aValue = a.productivity;
          bValue = b.productivity;
          break;
        case 'subject':
          aValue = a.subject.toLowerCase();
          bValue = b.subject.toLowerCase();
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [sessions, filters]);

  // Get unique subjects for filtering
  const availableSubjects = useMemo(() => {
    return [...new Set((sessions || []).map(session => session.subject))];
  }, [sessions]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setCurrentTimer({
      isRunning: true,
      startTime: new Date(),
      duration: 0
    });
  };

  const pauseTimer = () => {
    setCurrentTimer(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const stopTimer = () => {
    if (currentTimer.duration > 0) {
      // Automatically create session from timer
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - currentTimer.duration * 1000);
      
      setFormData({
        ...formData,
        startTime: startTime.toISOString().slice(0, 16),
        endTime: endTime.toISOString().slice(0, 16)
      });
      setShowCreateDialog(true);
    }
    
    setCurrentTimer({
      isRunning: false,
      startTime: null,
      duration: 0
    });
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.subject || !formData.startTime || !formData.endTime) {
        toast({
          title: 'Missing Required Fields',
          description: 'Please fill in all required fields (Subject, Start Time, End Time)',
          variant: 'destructive',
        });
        return;
      }

      // Calculate duration in minutes
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);
      const durationInMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
      
      if (durationInMinutes <= 0) {
        toast({
          title: 'Invalid Duration',
          description: 'End time must be after start time',
          variant: 'destructive',
        });
        return;
      }

      const sessionData = {
        subject: formData.subject,
        topic: formData.topic || '',
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: durationInMinutes,
        sessionType: formData.sessionType,
        productivity: formData.productivity,
        notes: formData.notes || '',
        breaksTaken: formData.breaksTaken,
        mood: formData.mood
      };

      console.log('Sending session data:', sessionData);

      await dispatch(createStudySession(sessionData)).unwrap();
      setShowCreateDialog(false);
      setFormData({
        subject: '',
        topic: '',
        startTime: '',
        endTime: '',
        sessionType: 'Reading',
        productivity: 3,
        notes: '',
        breaksTaken: 0,
        mood: 'Good'
      });
      setEditingSession(null);
      toast({
        title: 'Success',
        description: 'Study session created successfully',
      });
      dispatch(fetchStudyAnalytics(analyticsFilter));
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create study session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditSession = (session: StudySession) => {
    setEditingSession(session);
    setFormData({
      subject: session.subject,
      topic: session.topic || '',
      startTime: new Date(session.startTime).toISOString().slice(0, 16),
      endTime: new Date(session.endTime).toISOString().slice(0, 16),
      sessionType: session.sessionType as 'Reading' | 'Practice' | 'Revision' | 'Test' | 'Notes',
      productivity: session.productivity,
      notes: session.notes || '',
      breaksTaken: session.breaksTaken,
      mood: session.mood as 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor'
    });
    setShowCreateDialog(true);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await dispatch(deleteStudySession(id)).unwrap();
      toast({
        title: 'Success',
        description: 'Study session deleted successfully',
      });
      dispatch(fetchStudyAnalytics(analyticsFilter));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleResumeSession = (session: StudySession) => {
    // Logic to resume a session (could start timer with session context)
    setCurrentTimer({
      isRunning: true,
      startTime: new Date(),
      duration: 0,
      sessionId: session._id
    });
    toast({
      title: 'Session Resumed',
      description: `Continuing ${session.subject} session`,
    });
  };

  // Calculate enhanced analytics
  const enhancedAnalytics = useMemo(() => {
    if (!analytics || !sessions) return null;

    const averageSessionLength = sessions.length > 0 
      ? Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length)
      : 0;
    
    // Calculate peak day based on total study hours per day
    const dailyStudyTime = sessions.reduce((acc, session) => {
      const sessionDate = new Date(session.startTime).toDateString();
      const durationInHours = session.duration / 60; // Convert minutes to hours
      
      acc[sessionDate] = (acc[sessionDate] || 0) + durationInHours;
      return acc;
    }, {} as Record<string, number>);

    const peakDay = Object.entries(dailyStudyTime).reduce((best, [date, hours]) => 
      hours > best.hours ? { date, hours } : best
    , { date: 'No data', hours: 0 });

    // Format the peak day for display (show total hours)
    const peakDayFormatted = peakDay.hours > 0 ? 
      `${peakDay.hours.toFixed(1)}h` : 
      '0h';

    // Calculate study streak - consecutive days with at least one session
    const studyDates = [...new Set(sessions.map(session => 
      new Date(session.startTime).toDateString()
    ))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let currentStreak = 0;
    let maxStreak = 0;
    let lastDate: Date | null = null;

    for (const dateStr of studyDates) {
      const currentDate = new Date(dateStr);
      
      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++;
        } else {
          // Gap in streak, reset
          currentStreak = 1;
        }
      }
      
      maxStreak = Math.max(maxStreak, currentStreak);
      lastDate = currentDate;
    }

    // Check if streak continues to today
    const today = new Date().toDateString();
    const lastStudyDate = studyDates[studyDates.length - 1];
    const daysSinceLastStudy = lastStudyDate ? 
      Math.floor((new Date(today).getTime() - new Date(lastStudyDate).getTime()) / (1000 * 60 * 60 * 24)) : 
      Infinity;

    const activeStreak = daysSinceLastStudy <= 1 ? currentStreak : 0;

    return {
      ...analytics,
      averageSessionLength,
      peakDay: peakDayFormatted,
      streakDays: activeStreak
    };
  }, [analytics, sessions]);

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Study Sessions
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Track, analyze, and optimize your learning journey
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Timer Controls */}
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold text-foreground">
                      {formatTime(currentTimer.duration)}
                    </div>
                    <div className="text-xs text-muted-foreground">Study Timer</div>
                  </div>
                  <div className="flex gap-2">
                    {!currentTimer.isRunning ? (
                      <Button 
                        size="sm" 
                        onClick={startTimer}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={pauseTimer}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={stopTimer}
                      disabled={currentTimer.duration === 0}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSession ? 'Edit Study Session' : 'Create Study Session'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateSession} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({...formData, subject: e.target.value})}
                          required
                          placeholder="e.g., Mathematics"
                        />
                      </div>
                      <div>
                        <Label htmlFor="topic">Topic</Label>
                        <Input
                          id="topic"
                          value={formData.topic}
                          onChange={(e) => setFormData({...formData, topic: e.target.value})}
                          placeholder="e.g., Calculus"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Start Time *</Label>
                        <Input
                          id="startTime"
                          type="datetime-local"
                          value={formData.startTime}
                          onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time *</Label>
                        <Input
                          id="endTime"
                          type="datetime-local"
                          value={formData.endTime}
                          onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sessionType">Session Type</Label>
                        <Select 
                          value={formData.sessionType} 
                          onValueChange={(value) => setFormData({...formData, sessionType: value as 'Reading' | 'Practice' | 'Revision' | 'Test' | 'Notes'})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Reading">📖 Reading</SelectItem>
                            <SelectItem value="Practice">🎯 Practice</SelectItem>
                            <SelectItem value="Revision">📚 Revision</SelectItem>
                            <SelectItem value="Test">✅ Test</SelectItem>
                            <SelectItem value="Notes">📝 Notes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="mood">Mood</Label>
                        <Select 
                          value={formData.mood} 
                          onValueChange={(value) => setFormData({...formData, mood: value as 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor'})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Excellent">😊 Excellent</SelectItem>
                            <SelectItem value="Good">🙂 Good</SelectItem>
                            <SelectItem value="Average">😐 Average</SelectItem>
                            <SelectItem value="Poor">😞 Poor</SelectItem>
                            <SelectItem value="Very Poor">😓 Very Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="productivity">Productivity (1-5)</Label>
                        <Select 
                          value={formData.productivity.toString()} 
                          onValueChange={(value) => setFormData({...formData, productivity: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">⭐ 1 - Poor</SelectItem>
                            <SelectItem value="2">⭐⭐ 2 - Below Average</SelectItem>
                            <SelectItem value="3">⭐⭐⭐ 3 - Average</SelectItem>
                            <SelectItem value="4">⭐⭐⭐⭐ 4 - Good</SelectItem>
                            <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="breaksTaken">Breaks Taken</Label>
                        <Input
                          id="breaksTaken"
                          type="number"
                          min="0"
                          value={formData.breaksTaken}
                          onChange={(e) => setFormData({...formData, breaksTaken: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows={3}
                        placeholder="Reflection on the session, key learnings, challenges..."
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1" disabled={isLoading}>
                        {editingSession ? 'Update Session' : 'Create Session'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowCreateDialog(false);
                          setEditingSession(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Analytics Dashboard */}
        {enhancedAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Analytics Overview</h2>
              <Select value={analyticsFilter} onValueChange={(value) => setAnalyticsFilter(value as '7d' | '30d' | '90d')}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              <StatCard
                title="Total Sessions"
                value={enhancedAnalytics.totalSessions.toString()}
                icon={BookOpen}
                color="primary"
              />
              <StatCard
                title="Study Hours"
                value={`${enhancedAnalytics.totalHours}h`}
                icon={Clock}
                color="success"
              />
              <StatCard
                title="Avg Productivity"
                value={`${enhancedAnalytics.averageProductivity}/5`}
                icon={TrendingUp}
                color="accent"
              />
              <StatCard
                title="Study Streak"
                value={`${enhancedAnalytics.streakDays} days`}
                icon={Award}
                color="primary"
              />
              <StatCard
                title="Best Day Hours"
                value={enhancedAnalytics.peakDay}
                icon={Activity}
                color="accent"
              />
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SessionFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableSubjects={availableSubjects}
            totalSessions={sessions?.length || 0}
            filteredSessions={filteredSessions.length}
          />
        </motion.div>

        {/* Sessions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {filteredSessions.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {filters.search || filters.sessionTypes.length > 0 || filters.subjects.length > 0 
                      ? 'No sessions match your filters' 
                      : 'No study sessions yet'
                    }
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {filters.search || filters.sessionTypes.length > 0 || filters.subjects.length > 0
                      ? 'Try adjusting your search criteria or filters to find sessions.'
                      : 'Start your learning journey by creating your first study session!'
                    }
                  </p>
                  <div className="flex gap-3 justify-center">
                    {(filters.search || filters.sessionTypes.length > 0 || filters.subjects.length > 0) && (
                      <Button 
                        variant="outline" 
                        onClick={() => setFilters({
                          search: '',
                          sessionTypes: [],
                          subjects: [],
                          moods: [],
                          productivityRange: [1, 5],
                          dateRange: {},
                          sortBy: 'date',
                          sortOrder: 'desc'
                        })}
                      >
                        Clear Filters
                      </Button>
                    )}
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Session
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredSessions.map((session, index) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SessionCard
                      session={session}
                      onEdit={handleEditSession}
                      onDelete={handleDeleteSession}
                      onResume={handleResumeSession}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Load More Button */}
        {filteredSessions.length > 0 && filteredSessions.length < (sessions?.length || 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button variant="outline" size="lg">
              Load More Sessions
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudySessions;
