import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Calendar, Clock, Target, TrendingUp, Award, Star, Zap, Trophy, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchStudySessions, fetchStudyAnalytics } from '@/redux/slices/studySessionSlice';
import { fetchBooks } from '@/redux/slices/bookSlice';
import { fetchDailyGoals } from '@/redux/slices/dailyGoalSlice';
import { StudySession } from '@/api/studySessionApi';

const AdvancedProgress: React.FC = () => {
  const dispatch = useAppDispatch();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  // Get data from Redux stores
  const { sessions, analytics, isLoading: sessionsLoading } = useAppSelector((state) => state.studySessions);
  const { books } = useAppSelector((state) => state.books);
  const { goals } = useAppSelector((state) => state.dailyGoals);
  const { user } = useAppSelector((state) => state.auth);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchStudySessions({ limit: 100 }));
    dispatch(fetchStudyAnalytics('30d'));
    dispatch(fetchBooks());
    dispatch(fetchDailyGoals(format(new Date(), 'yyyy-MM-dd')));
  }, [dispatch]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Process progress data based on timeframe
  const progressData = useMemo(() => {
    if (!sessions.length) return [];

    const today = new Date();
    const data = [];

    if (timeframe === 'daily') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayName = format(date, 'EEE');
        const dayString = format(date, 'yyyy-MM-dd');
        
        const daySessions = sessions.filter(session => 
          format(parseISO(session.startTime), 'yyyy-MM-dd') === dayString
        );
        
        const studyHours = daySessions.reduce((sum, session) => sum + session.duration / 60, 0);
        const tasksCompleted = daySessions.length;
        const accuracy = daySessions.length > 0 
          ? daySessions.reduce((sum, session) => sum + session.productivity, 0) / daySessions.length
          : 0;

        data.push({
          name: dayName,
          studyHours: Math.round(studyHours * 10) / 10,
          tasksCompleted,
          accuracy: Math.round(accuracy),
        });
      }
    } else if (timeframe === 'weekly') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = subDays(today, (i + 1) * 7);
        const weekEnd = subDays(today, i * 7);
        
        const weekSessions = sessions.filter(session => {
          const sessionDate = parseISO(session.startTime);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
        
        const studyHours = weekSessions.reduce((sum, session) => sum + session.duration / 60, 0);
        const tasksCompleted = weekSessions.length;
        const accuracy = weekSessions.length > 0 
          ? weekSessions.reduce((sum, session) => sum + session.productivity, 0) / weekSessions.length
          : 0;

        data.push({
          name: `Week ${4 - i}`,
          studyHours: Math.round(studyHours * 10) / 10,
          tasksCompleted,
          accuracy: Math.round(accuracy),
        });
      }
    } else {
      // Last 4 months
      for (let i = 3; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = format(month, 'MMM');
        const monthStart = startOfDay(month);
        const monthEnd = endOfDay(new Date(month.getFullYear(), month.getMonth() + 1, 0));
        
        const monthSessions = sessions.filter(session => {
          const sessionDate = parseISO(session.startTime);
          return sessionDate >= monthStart && sessionDate <= monthEnd;
        });
        
        const studyHours = monthSessions.reduce((sum, session) => sum + session.duration / 60, 0);
        const tasksCompleted = monthSessions.length;
        const accuracy = monthSessions.length > 0 
          ? monthSessions.reduce((sum, session) => sum + session.productivity, 0) / monthSessions.length
          : 0;

        data.push({
          name: monthName,
          studyHours: Math.round(studyHours * 10) / 10,
          tasksCompleted,
          accuracy: Math.round(accuracy),
        });
      }
    }

    return data;
  }, [sessions, timeframe]);

  // Process subject data from books and sessions
  const subjectData = useMemo(() => {
    if (!books.length && !sessions.length) return [];

    const subjectMap = new Map();

    // Process books data
    books.forEach(book => {
      if (!subjectMap.has(book.subject)) {
        subjectMap.set(book.subject, {
          subject: book.subject,
          completion: 0,
          accuracy: 0,
          timeSpent: 0,
          totalChapters: 0,
          completedChapters: 0,
        });
      }
      
      const subjectInfo = subjectMap.get(book.subject);
      subjectInfo.totalChapters += book.totalChapters || 0;
      subjectInfo.completedChapters += book.completedChapters || 0;
    });

    // Process sessions data
    sessions.forEach(session => {
      if (!subjectMap.has(session.subject)) {
        subjectMap.set(session.subject, {
          subject: session.subject,
          completion: 0,
          accuracy: 0,
          timeSpent: 0,
          totalChapters: 0,
          completedChapters: 0,
        });
      }
      
      const subjectInfo = subjectMap.get(session.subject);
      subjectInfo.timeSpent += session.duration / 60;
      subjectInfo.accuracy = session.productivity;
    });

    // Calculate completion percentage and format data
    return Array.from(subjectMap.values()).map((subject, index) => {
      const completion = subject.totalChapters > 0 
        ? Math.round((subject.completedChapters / subject.totalChapters) * 100)
        : Math.min(Math.round(subject.timeSpent * 2), 100); // Estimate based on time if no chapters

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      
      return {
        ...subject,
        completion,
        timeSpent: Math.round(subject.timeSpent * 10) / 10,
        color: colors[index % colors.length],
      };
    });
  }, [books, sessions]);

  // Calculate target vs actual data
  const targetData = useMemo(() => {
    const totalHours = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const completedTasks = sessions.length;
    const avgAccuracy = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + session.productivity, 0) / sessions.length
      : 0;
    const subjectsCovered = new Set(sessions.map(s => s.subject)).size;

    // These could be user-configurable targets in the future
    const targets = {
      studyHours: 150,
      tasksCompleted: 420,
      accuracyRate: 95,
      subjectsCovered: Math.max(subjectData.length, 8),
    };

    return [
      { name: 'Study Hours', actual: Math.round(totalHours), target: targets.studyHours },
      { name: 'Tasks Completed', actual: completedTasks, target: targets.tasksCompleted },
      { name: 'Accuracy Rate', actual: Math.round(avgAccuracy), target: targets.accuracyRate },
      { name: 'Subjects Covered', actual: subjectsCovered, target: targets.subjectsCovered },
    ];
  }, [sessions, subjectData]);

  // Calculate achievements based on real data
  const achievements = useMemo(() => {
    const streak = calculateStudyStreak(sessions);
    const totalHours = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const morningSessionsCount = sessions.filter(session => {
      const hour = parseISO(session.startTime).getHours();
      return hour >= 5 && hour <= 10;
    }).length;
    const perfectScores = sessions.filter(session => session.productivity >= 95).length;
    const marathonDays = calculateMarathonDays(sessions);
    const completedSubjects = subjectData.filter(subject => subject.completion >= 90).length;

    return [
      { 
        id: 1, 
        title: '7-Day Streak', 
        description: 'Studied for 7 consecutive days', 
        icon: Zap, 
        earned: streak >= 7, 
        date: streak >= 7 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 2, 
        title: 'Early Bird', 
        description: 'Completed 5 morning study sessions', 
        icon: Star, 
        earned: morningSessionsCount >= 5, 
        date: morningSessionsCount >= 5 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 3, 
        title: 'Century Club', 
        description: 'Completed 100 study sessions', 
        icon: Trophy, 
        earned: sessions.length >= 100, 
        date: sessions.length >= 100 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 4, 
        title: 'Perfect Score', 
        description: 'Achieved 95%+ productivity in a session', 
        icon: Award, 
        earned: perfectScores > 0, 
        date: perfectScores > 0 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 5, 
        title: 'Marathon Study', 
        description: 'Study for 8+ hours in a day', 
        icon: Clock, 
        earned: marathonDays > 0, 
        date: marathonDays > 0 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 6, 
        title: 'Subject Master', 
        description: 'Complete 90% of any subject', 
        icon: CheckCircle2, 
        earned: completedSubjects > 0, 
        date: completedSubjects > 0 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
    ];
  }, [sessions, subjectData]);

  // Generate heatmap data from actual study sessions
  const heatmapData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = subDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');
      
      const daySessions = sessions.filter(session => 
        format(parseISO(session.startTime), 'yyyy-MM-dd') === dateString
      );
      
      const dayHours = daySessions.reduce((sum, session) => sum + session.duration / 60, 0);
      const level = Math.min(Math.floor(dayHours / 2), 4); // 0-4 intensity levels
      
      data.push({
        date: dateString,
        count: Math.round(dayHours * 10) / 10,
        level,
      });
    }
    
    return data;
  }, [sessions]);

  // Generate smart insights based on real data
  const smartInsights = useMemo(() => {
    if (!sessions.length) return [];

    const insights = [];
    
    // Performance improvement insight
    const recentSessions = sessions.slice(0, 10);
    const olderSessions = sessions.slice(10, 20);
    if (recentSessions.length && olderSessions.length) {
      const recentAvg = recentSessions.reduce((sum, s) => sum + s.productivity, 0) / recentSessions.length;
      const olderAvg = olderSessions.reduce((sum, s) => sum + s.productivity, 0) / olderSessions.length;
      const improvement = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
      
      if (improvement > 0) {
        insights.push({
          type: 'improvement',
          title: 'Performance Boost',
          message: `Your productivity improved by ${improvement}% in recent sessions. Keep up the excellent work!`,
          icon: TrendingUp,
          color: 'green',
        });
      }
    }

    // Best study time insight
    const hourlyStats = sessions.reduce((acc, session) => {
      const hour = parseISO(session.startTime).getHours();
      if (!acc[hour]) acc[hour] = { count: 0, totalProductivity: 0 };
      acc[hour].count++;
      acc[hour].totalProductivity += session.productivity;
      return acc;
    }, {} as Record<number, { count: number; totalProductivity: number }>);

    const bestHour = Object.entries(hourlyStats)
      .filter(([_, stats]) => stats.count >= 3)
      .sort(([_, a], [__, b]) => (b.totalProductivity / b.count) - (a.totalProductivity / a.count))[0];

    if (bestHour) {
      const hour = parseInt(bestHour[0]);
      const timeSlot = hour < 12 ? `${hour} AM - ${hour + 2} AM` : `${hour - 12 || 12} PM - ${hour - 10 || 2} PM`;
      insights.push({
        type: 'pattern',
        title: 'Study Pattern',
        message: `You're most productive between ${timeSlot}. Schedule difficult topics during this time.`,
        icon: Clock,
        color: 'orange',
      });
    }

    // Goal progress insight
    const thisWeekHours = sessions
      .filter(s => parseISO(s.startTime) >= subDays(new Date(), 7))
      .reduce((sum, s) => sum + s.duration / 60, 0);
    
    if (thisWeekHours > 0) {
      const weeklyTarget = 25; // Could be configurable
      const progress = Math.round((thisWeekHours / weeklyTarget) * 100);
      insights.push({
        type: 'goal',
        title: 'Weekly Progress',
        message: `You're ${progress}% towards your weekly goal. ${progress >= 90 ? 'Almost there!' : `Just ${Math.round(weeklyTarget - thisWeekHours)} more hours to go!`}`,
        icon: Target,
        color: 'blue',
      });
    }

    // Streak insight
    const streak = calculateStudyStreak(sessions);
    if (streak > 0) {
      insights.push({
        type: 'streak',
        title: 'Study Streak',
        message: `Your current study streak is ${streak} days! ${streak >= 7 ? "Amazing consistency!" : "Keep building the habit."}`,
        icon: Award,
        color: 'purple',
      });
    }

    return insights;
  }, [sessions]);

  // Helper functions
  function calculateStudyStreak(sessions: StudySession[]) {
    if (!sessions.length) return 0;
    
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const date = subDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');
      const hasSession = sessions.some(s => 
        format(parseISO(s.startTime), 'yyyy-MM-dd') === dateString
      );
      
      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  }

  function calculateMarathonDays(sessions: StudySession[]) {
    const dailyHours = sessions.reduce((acc, session) => {
      const date = format(parseISO(session.startTime), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = 0;
      acc[date] += session.duration / 60;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.values(dailyHours).filter(hours => hours >= 8).length;
  }

  const getIntensityColor = (level: number) => {
    const colors = ['#f3f4f6', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1'];
    return colors[level] || colors[0];
  };

  const renderProgressChart = () => {
    const data = progressData;
    const ChartComponent = chartType === 'line' ? LineChart : BarChart;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          {chartType === 'line' ? (
            <>
              <Line
                type="monotone"
                dataKey="studyHours"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
              />
            </>
          ) : (
            <>
              <Bar dataKey="studyHours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tasksCompleted" fill="#10b981" radius={[4, 4, 0, 0]} />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  const renderHeatmap = () => {
    const weeks = [];
    for (let i = 0; i < 13; i++) {
      const week = heatmapData.slice(i * 7, (i + 1) * 7);
      weeks.push(week);
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          {['Mon', 'Wed', 'Fri'].map((day, index) => (
            <div key={day} className="w-3 h-3 text-xs text-gray-500 flex items-center justify-center">
              {index === 0 ? 'M' : index === 1 ? 'W' : 'F'}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={`${weekIndex}-${dayIndex}`}
                  className="w-3 h-3 rounded-sm cursor-pointer"
                  style={{ backgroundColor: getIntensityColor(day.level) }}
                  whileHover={{ scale: 1.2 }}
                  title={`${day.date}: ${day.count} hours studied`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getIntensityColor(level) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    );
  };

  if (sessionsLoading && !sessions.length) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Progress Tracking</h1>
          <p className="text-gray-600">Loading your study data...</p>
        </div>
      </div>
    );
  }

  if (!sessions.length && !books.length) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Progress Tracking</h1>
          <p className="text-gray-600 mb-8">Start your study journey to see detailed analytics here!</p>
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Study Data Yet</h3>
            <p className="text-gray-600 mb-4">
              Add some books and start study sessions to see your progress analytics.
            </p>
            <div className="text-sm text-gray-500">
              <p>• Add books in the Books section</p>
              <p>• Create study sessions in Study Sessions</p>
              <p>• Set daily goals to track your progress</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6 bg-gray-50 min-h-screen"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Progress Tracking</h1>
        <p className="text-gray-600">Comprehensive insights into your study performance and progress</p>
      </motion.div>

      {/* Progress Charts */}
      <motion.div variants={cardVariants}>
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Performance Trends
              </CardTitle>
              <div className="flex gap-2">
                <Select value={timeframe} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setTimeframe(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={chartType} onValueChange={(value: 'line' | 'bar') => setChartType(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <motion.div
              key={timeframe + chartType}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderProgressChart()}
            </motion.div>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Study Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{chartType === 'line' ? 'Productivity %' : 'Sessions Completed'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subject-wise Performance */}
      {subjectData.length > 0 && (
        <motion.div variants={cardVariants}>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Subject-wise Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {subjectData.map((subject, index) => (
                  <motion.div
                    key={subject.subject}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{subject.subject}</h3>
                      <div className="flex gap-2">
                        <Badge variant={subject.completion >= 70 ? 'default' : 'secondary'}>
                          {subject.completion}% Complete
                        </Badge>
                        <Badge variant={subject.accuracy >= 80 ? 'default' : 'destructive'}>
                          {subject.accuracy}% Productivity
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{subject.completion}%</span>
                      </div>
                      <Progress value={subject.completion} className="h-2" />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Time Spent: {subject.timeSpent}h</span>
                        <span>Avg Productivity: {subject.accuracy}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Study Consistency Heatmap */}
        <motion.div variants={cardVariants}>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Study Consistency
              </CardTitle>
              <p className="text-sm text-gray-600">Last 90 days activity</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                {renderHeatmap()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Target vs Actual */}
        <motion.div variants={cardVariants}>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Target vs Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {targetData.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-gray-600">
                        {item.actual} / {item.target}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={(item.actual / item.target) * 100} className="h-3" />
                      <span className="absolute right-2 top-0 text-xs text-white font-medium">
                        {Math.round((item.actual / item.target) * 100)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievements & Badges */}
      <motion.div variants={cardVariants}>
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Achievements & Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    achievement.earned
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-full ${
                        achievement.earned ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <achievement.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${achievement.earned ? 'text-yellow-900' : 'text-gray-500'}`}>
                        {achievement.title}
                      </h3>
                      {achievement.earned && achievement.date && (
                        <p className="text-xs text-yellow-600">Earned {achievement.date}</p>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm ${achievement.earned ? 'text-yellow-800' : 'text-gray-500'}`}>
                    {achievement.description}
                  </p>
                  {achievement.earned && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="mt-2"
                    >
                      <Badge className="bg-yellow-500 hover:bg-yellow-600">Unlocked!</Badge>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Smart Insights */}
      <motion.div variants={cardVariants}>
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {smartInsights.map((insight, index) => (
                <motion.div
                  key={insight.type + index}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <insight.icon className={`h-4 w-4 text-${insight.color}-600`} />
                    <span className={`font-medium text-${insight.color}-800`}>{insight.title}</span>
                  </div>
                  <p className="text-sm text-gray-700">{insight.message}</p>
                </motion.div>
              ))}
              {smartInsights.length === 0 && (
                <div className="col-span-2 text-center py-4">
                  <p className="text-gray-500">Continue studying to unlock personalized insights!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdvancedProgress;
