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
import { Calendar, Clock, Target, TrendingUp, Award, Star, Zap, Trophy, CheckCircle2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchStudySessions, fetchStudyAnalytics } from '@/redux/slices/studySessionSlice';
import { fetchDailyGoals } from '@/redux/slices/dailyGoalSlice';
import { StudySession } from '@/api/studySessionApi';

const AdvancedProgress: React.FC = () => {
  const dispatch = useAppDispatch();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [activeAchievementTab, setActiveAchievementTab] = useState<'earned' | 'progress' | 'consistency' | 'productivity' | 'volume'>('earned');
  
  // Get data from Redux stores
  const { sessions, analytics, isLoading: sessionsLoading } = useAppSelector((state) => state.studySessions);
  const { goals } = useAppSelector((state) => state.dailyGoals);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchStudySessions({ limit: 100 }));
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

  // Process subject data from sessions
  const subjectData = useMemo(() => {
    if (!sessions.length) return [];

    const subjectMap = new Map();

    // Process sessions data
    sessions.forEach(session => {
      if (!subjectMap.has(session.subject)) {
        subjectMap.set(session.subject, {
          subject: session.subject,
          completion: 0,
          accuracy: 0,
          timeSpent: 0,
          sessionCount: 0,
          totalProductivity: 0,
        });
      }
      
      const subjectInfo = subjectMap.get(session.subject);
      subjectInfo.timeSpent += session.duration / 60;
      subjectInfo.sessionCount += 1;
      subjectInfo.totalProductivity += session.productivity;
    });

    // Calculate completion percentage and format data
    return Array.from(subjectMap.values()).map((subject, index) => {
      // Estimate completion based on time spent (rough heuristic)
      const completion = Math.min(Math.round(subject.timeSpent * 2), 100);
      const averageProductivity = Math.round(subject.totalProductivity / subject.sessionCount);

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      
      return {
        ...subject,
        completion,
        accuracy: averageProductivity,
        timeSpent: Math.round(subject.timeSpent * 10) / 10,
        color: colors[index % colors.length],
      };
    });
  }, [sessions]);


  // Calculate comprehensive achievements based on real data
  const achievements = useMemo(() => {
    const streak = calculateStudyStreak(sessions);
    const totalHours = sessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const morningSessionsCount = sessions.filter(session => {
      const hour = parseISO(session.startTime).getHours();
      return hour >= 5 && hour <= 10;
    }).length;
    const nightSessionsCount = sessions.filter(session => {
      const hour = parseISO(session.startTime).getHours();
      return hour >= 20 && hour <= 23;
    }).length;
    const perfectScores = sessions.filter(session => session.productivity >= 5).length;
    const highProductivity = sessions.filter(session => session.productivity >= 4).length;
    const marathonDays = calculateMarathonDays(sessions);
    const completedSubjects = subjectData.filter(subject => subject.completion >= 90).length;
    const weekendSessions = calculateWeekendSessions(sessions);
    const excellentMoodSessions = sessions.filter(session => session.mood === 'Excellent').length;
    const consistentWeeks = calculateConsistentWeeks(sessions);
    const flowStateSessions = sessions.filter(session => 
      session.duration >= 180 && session.productivity >= 4
    ).length;
    const averageProductivity = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + s.productivity, 0) / sessions.length 
      : 0;

    const achievementsList = [
      // Study Consistency Achievements
      { 
        id: 1, 
        title: 'Study Streak - Beginner', 
        description: 'Study for 3 consecutive days', 
        icon: Zap, 
        category: 'consistency',
        earned: streak >= 3,
        progress: Math.min(streak, 3),
        target: 3,
        date: streak >= 3 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 2, 
        title: 'Study Streak - Intermediate', 
        description: 'Study for 7 consecutive days', 
        icon: Zap, 
        category: 'consistency',
        earned: streak >= 7,
        progress: Math.min(streak, 7),
        target: 7,
        date: streak >= 7 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 3, 
        title: 'Study Streak - Advanced', 
        description: 'Study for 30 consecutive days', 
        icon: Zap, 
        category: 'consistency',
        earned: streak >= 30,
        progress: Math.min(streak, 30),
        target: 30,
        date: streak >= 30 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 4, 
        title: 'Study Streak - Master', 
        description: 'Study for 100 consecutive days', 
        icon: Zap, 
        category: 'consistency',
        earned: streak >= 100,
        progress: Math.min(streak, 100),
        target: 100,
        date: streak >= 100 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 5, 
        title: 'Early Bird - Starter', 
        description: 'Complete 5 morning study sessions (5-10 AM)', 
        icon: Star, 
        category: 'consistency',
        earned: morningSessionsCount >= 5,
        progress: Math.min(morningSessionsCount, 5),
        target: 5,
        date: morningSessionsCount >= 5 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 6, 
        title: 'Early Bird - Expert', 
        description: 'Complete 25 morning study sessions (5-10 AM)', 
        icon: Star, 
        category: 'consistency',
        earned: morningSessionsCount >= 25,
        progress: Math.min(morningSessionsCount, 25),
        target: 25,
        date: morningSessionsCount >= 25 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 7, 
        title: 'Night Owl - Starter', 
        description: 'Complete 5 evening study sessions (8-11 PM)', 
        icon: Clock, 
        category: 'consistency',
        earned: nightSessionsCount >= 5,
        progress: Math.min(nightSessionsCount, 5),
        target: 5,
        date: nightSessionsCount >= 5 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 8, 
        title: 'Weekend Warrior', 
        description: 'Study on 10 weekends', 
        icon: Calendar, 
        category: 'consistency',
        earned: weekendSessions >= 10,
        progress: Math.min(weekendSessions, 10),
        target: 10,
        date: weekendSessions >= 10 ? format(new Date(), 'yyyy-MM-dd') : null 
      },

      // Productivity Achievements
      { 
        id: 9, 
        title: 'Productivity Champion - Bronze', 
        description: 'Complete 10 sessions with 4+ productivity rating', 
        icon: Award, 
        category: 'productivity',
        earned: highProductivity >= 10,
        progress: Math.min(highProductivity, 10),
        target: 10,
        date: highProductivity >= 10 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 10, 
        title: 'Productivity Champion - Silver', 
        description: 'Complete 25 sessions with 4+ productivity rating', 
        icon: Award, 
        category: 'productivity',
        earned: highProductivity >= 25,
        progress: Math.min(highProductivity, 25),
        target: 25,
        date: highProductivity >= 25 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 11, 
        title: 'Perfect Sessions - Starter', 
        description: 'Achieve 5 sessions with perfect productivity (5/5)', 
        icon: CheckCircle2, 
        category: 'productivity',
        earned: perfectScores >= 5,
        progress: Math.min(perfectScores, 5),
        target: 5,
        date: perfectScores >= 5 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 12, 
        title: 'Perfect Sessions - Expert', 
        description: 'Achieve 30 sessions with perfect productivity (5/5)', 
        icon: CheckCircle2, 
        category: 'productivity',
        earned: perfectScores >= 30,
        progress: Math.min(perfectScores, 30),
        target: 30,
        date: perfectScores >= 30 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 13, 
        title: 'Flow State Master', 
        description: 'Complete 5 sessions of 3+ hours with high productivity', 
        icon: Zap, 
        category: 'productivity',
        earned: flowStateSessions >= 5,
        progress: Math.min(flowStateSessions, 5),
        target: 5,
        date: flowStateSessions >= 5 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 14, 
        title: 'Mood Booster', 
        description: 'Complete 15 sessions with excellent mood', 
        icon: Star, 
        category: 'productivity',
        earned: excellentMoodSessions >= 15,
        progress: Math.min(excellentMoodSessions, 15),
        target: 15,
        date: excellentMoodSessions >= 15 ? format(new Date(), 'yyyy-MM-dd') : null 
      },

      // Volume Achievements
      { 
        id: 15, 
        title: 'Session Starter', 
        description: 'Complete 10 study sessions', 
        icon: Target, 
        category: 'volume',
        earned: sessions.length >= 10,
        progress: Math.min(sessions.length, 10),
        target: 10,
        date: sessions.length >= 10 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 16, 
        title: 'Century Club', 
        description: 'Complete 100 study sessions', 
        icon: Trophy, 
        category: 'volume',
        earned: sessions.length >= 100,
        progress: Math.min(sessions.length, 100),
        target: 100,
        date: sessions.length >= 100 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 17, 
        title: 'Time Tracker - Bronze', 
        description: 'Log 50 total study hours', 
        icon: Clock, 
        category: 'volume',
        earned: totalHours >= 50,
        progress: Math.min(totalHours, 50),
        target: 50,
        date: totalHours >= 50 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 18, 
        title: 'Time Tracker - Silver', 
        description: 'Log 100 total study hours', 
        icon: Clock, 
        category: 'volume',
        earned: totalHours >= 100,
        progress: Math.min(totalHours, 100),
        target: 100,
        date: totalHours >= 100 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 19, 
        title: 'Time Tracker - Gold', 
        description: 'Log 500 total study hours', 
        icon: Clock, 
        category: 'volume',
        earned: totalHours >= 500,
        progress: Math.min(totalHours, 500),
        target: 500,
        date: totalHours >= 500 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 20, 
        title: 'Marathon Student', 
        description: 'Study for 8+ hours in a single day', 
        icon: Target, 
        category: 'volume',
        earned: marathonDays > 0,
        progress: Math.min(marathonDays, 1),
        target: 1,
        date: marathonDays > 0 ? format(new Date(), 'yyyy-MM-dd') : null 
      },

      // Subject Mastery Achievements
      { 
        id: 21, 
        title: 'Subject Explorer', 
        description: 'Study 3 different subjects', 
        icon: BookOpen, 
        category: 'mastery',
        earned: subjectData.length >= 3,
        progress: Math.min(subjectData.length, 3),
        target: 3,
        date: subjectData.length >= 3 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
      { 
        id: 22, 
        title: 'Subject Master', 
        description: 'Achieve 90%+ completion in any subject', 
        icon: CheckCircle2, 
        category: 'mastery',
        earned: completedSubjects > 0,
        progress: completedSubjects,
        target: 1,
        date: completedSubjects > 0 ? format(new Date(), 'yyyy-MM-dd') : null 
      },

      // Consistency Achievements
      { 
        id: 23, 
        title: 'Consistency Keeper', 
        description: 'Maintain 3+ average productivity for 2 weeks', 
        icon: TrendingUp, 
        category: 'consistency',
        earned: consistentWeeks >= 2 && averageProductivity >= 3,
        progress: Math.min(consistentWeeks, 2),
        target: 2,
        date: consistentWeeks >= 2 && averageProductivity >= 3 ? format(new Date(), 'yyyy-MM-dd') : null 
      },
    ];

    // Sort achievements: earned first, then by progress percentage
    return achievementsList.sort((a, b) => {
      if (a.earned && !b.earned) return -1;
      if (!a.earned && b.earned) return 1;
      
      const aProgress = (a.progress / a.target) * 100;
      const bProgress = (b.progress / b.target) * 100;
      
      return bProgress - aProgress;
    });
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

  function calculateWeekendSessions(sessions: StudySession[]) {
    const weekendDates = new Set();
    
    sessions.forEach(session => {
      const sessionDate = parseISO(session.startTime);
      const dayOfWeek = sessionDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const weekendKey = format(sessionDate, 'yyyy-ww'); // Week identifier
        weekendDates.add(weekendKey);
      }
    });
    
    return weekendDates.size;
  }

  function calculateConsistentWeeks(sessions: StudySession[]) {
    if (!sessions.length) return 0;
    
    const today = new Date();
    let consistentWeeks = 0;
    
    for (let week = 0; week < 12; week++) {
      const weekStart = subDays(today, (week + 1) * 7);
      const weekEnd = subDays(today, week * 7);
      
      const weekSessions = sessions.filter(session => {
        const sessionDate = parseISO(session.startTime);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
      
      if (weekSessions.length === 0) break;
      
      const avgProductivity = weekSessions.reduce((sum, s) => sum + s.productivity, 0) / weekSessions.length;
      
      if (avgProductivity >= 3) {
        consistentWeeks++;
      } else {
        break; // Break streak if productivity drops
      }
    }
    
    return consistentWeeks;
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
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl mb-2">Advanced Progress Tracking</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Loading your study data...</p>
        </div>
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl mb-2">Advanced Progress Tracking</h1>
          <p className="text-sm text-muted-foreground sm:text-base mb-6 sm:mb-8">Start your study journey to see detailed analytics here!</p>
          <Card className="p-6 sm:p-8">
            <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No Study Data Yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Add some books and start study sessions to see your progress analytics.
            </p>
            <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
              <p>• Add books in the Books section</p>
              <p>• Create study sessions in Study Sessions</p>
              <p>• Set daily goals to track your progress</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 p-4 sm:space-y-6 sm:p-6"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl mb-2">Advanced Progress Tracking</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Comprehensive insights into your study performance and progress</p>
      </motion.div>

      {/* Progress Charts */}
      <motion.div variants={cardVariants}>
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Performance Trends
              </CardTitle>
              <div className="flex gap-2">
                <Select value={timeframe} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setTimeframe(value)}>
                  <SelectTrigger className="w-28 sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={chartType} onValueChange={(value: 'line' | 'bar') => setChartType(value)}>
                  <SelectTrigger className="w-20 sm:w-24">
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
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-xs sm:text-sm">
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

      {/* Subject-wise Performance and Study Consistency - Horizontal Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subject-wise Performance */}
        <motion.div variants={cardVariants}>
          <Card className="shadow-lg border-0 h-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Subject-wise Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subjectData.length > 0 ? (
                <div className="grid gap-4">
                  {subjectData.map((subject, index) => (
                    <motion.div
                      key={subject.subject}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-foreground">{subject.subject}</h3>
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
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Time Spent: {subject.timeSpent}h</span>
                          <span>Avg Productivity: {subject.accuracy}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Subject Data Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start study sessions to see subject-wise analytics.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Study Consistency Heatmap */}
        <motion.div variants={cardVariants}>
          <Card className="shadow-lg border-0 h-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Study Consistency
              </CardTitle>
              <p className="text-sm text-muted-foreground">Last 90 days activity</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                {renderHeatmap()}
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
            <div className="mt-4">
              <Tabs value={activeAchievementTab} onValueChange={(value) => setActiveAchievementTab(value as 'earned' | 'progress' | 'consistency' | 'productivity' | 'volume')} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="earned" className="text-xs sm:text-sm">
                    🏆 Earned ({achievements.filter(a => a.earned).length})
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="text-xs sm:text-sm">
                    ⚡ In Progress ({achievements.filter(a => !a.earned && (a.progress / a.target) >= 0.2).length})
                  </TabsTrigger>
                  <TabsTrigger value="consistency" className="text-xs sm:text-sm">
                    📅 Consistency
                  </TabsTrigger>
                  <TabsTrigger value="productivity" className="text-xs sm:text-sm">
                    🎯 Productivity
                  </TabsTrigger>
                  <TabsTrigger value="volume" className="text-xs sm:text-sm">
                    📊 Volume
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeAchievementTab} onValueChange={(value) => setActiveAchievementTab(value as 'earned' | 'progress' | 'consistency' | 'productivity' | 'volume')}>
              {/* Earned Achievements */}
              <TabsContent value="earned" className="mt-0">
                <div className="space-y-4">
                  {achievements.filter(a => a.earned).length > 0 ? (
                    <>
                      <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                          {achievements.filter(a => a.earned).length} Achievements Unlocked!
                        </h3>
                        <p className="text-sm text-yellow-700">
                          You're making excellent progress. Keep up the great work!
                        </p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {achievements.filter(a => a.earned).map((achievement, index) => (
                          <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                                <achievement.icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-yellow-900">{achievement.title}</h3>
                                {achievement.date && (
                                  <p className="text-xs text-yellow-600">Earned {achievement.date}</p>
                                )}
                              </div>
                              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                ✓ Unlocked
                              </Badge>
                            </div>
                            <p className="text-sm text-yellow-800">{achievement.description}</p>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Achievements Yet</h3>
                      <p className="text-gray-500">Keep studying to unlock your first achievement!</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* In Progress Achievements */}
              <TabsContent value="progress" className="mt-0">
                <div className="space-y-4">
                  {achievements.filter(a => !a.earned && (a.progress / a.target) >= 0.2).length > 0 ? (
                    <>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-blue-900 mb-1">Almost There!</h3>
                        <p className="text-sm text-blue-700">
                          You're making great progress on these achievements
                        </p>
                      </div>
                      <div className="space-y-3">
                        {achievements
                          .filter(a => !a.earned && (a.progress / a.target) >= 0.2)
                          .slice(0, 6)
                          .map((achievement, index) => {
                            const progressPercent = (achievement.progress / achievement.target) * 100;
                            return (
                              <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 rounded-lg bg-white border border-gray-200 hover:border-blue-300 transition-colors"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                                    <achievement.icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                                    <p className="text-sm text-gray-600">{achievement.description}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-blue-600">
                                      {Math.round(progressPercent)}%
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {achievement.progress}/{achievement.target}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Progress value={progressPercent} className="h-2" />
                                  {progressPercent >= 80 && (
                                    <p className="text-xs text-green-600 font-medium">🔥 Almost unlocked!</p>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Progress</h3>
                      <p className="text-gray-500">Continue studying to work towards new achievements!</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Category-based tabs */}
              {['consistency', 'productivity', 'volume'].map((category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <div className="grid md:grid-cols-2 gap-4">
                    {achievements
                      .filter(a => a.category === category)
                      .map((achievement, index) => {
                        const progressPercent = (achievement.progress / achievement.target) * 100;
                        return (
                          <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              achievement.earned
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`p-2 rounded-full ${
                                  achievement.earned 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                <achievement.icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <h3 className={`font-medium ${
                                  achievement.earned ? 'text-green-900' : 'text-gray-700'
                                }`}>
                                  {achievement.title}
                                </h3>
                                {achievement.earned && achievement.date && (
                                  <p className="text-xs text-green-600">Earned {achievement.date}</p>
                                )}
                              </div>
                              {achievement.earned ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white">
                                  ✓ Unlocked
                                </Badge>
                              ) : (
                                <div className="text-xs text-gray-500 text-right">
                                  <div>{Math.round(progressPercent)}%</div>
                                  <div>{achievement.progress}/{achievement.target}</div>
                                </div>
                              )}
                            </div>
                            <p className={`text-sm mb-3 ${
                              achievement.earned ? 'text-green-800' : 'text-gray-600'
                            }`}>
                              {achievement.description}
                            </p>
                            {!achievement.earned && (
                              <Progress value={progressPercent} className="h-2" />
                            )}
                          </motion.div>
                        );
                      })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
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
