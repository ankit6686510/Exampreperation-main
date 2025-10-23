import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchBooks } from '@/redux/slices/bookSlice';
import { fetchDailyGoals } from '@/redux/slices/dailyGoalSlice';
import { fetchStudySessions } from '@/redux/slices/studySessionSlice';
import StatCard from '@/components/StatCard';
import { 
  BookOpen, 
  Target, 
  CheckCircle2, 
  Calendar,
  Clock,
  TrendingUp,
  PlayCircle,
  Plus,
  AlertCircle,
  Award,
  BookMarked,
  Zap,
  BarChart3,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { differenceInDays } from 'date-fns';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { books } = useAppSelector((state) => state.books);
  const { goals } = useAppSelector((state) => state.dailyGoals);
  const { sessions, analytics } = useAppSelector((state) => state.studySessions);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    dispatch(fetchBooks({}));
    dispatch(fetchDailyGoals(new Date().toISOString().split('T')[0]));
    dispatch(fetchStudySessions({ limit: 50 }));
    
    // Update time every minute for countdown
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [dispatch]);

  // Ensure books and goals are arrays
  const booksArray = Array.isArray(books) ? books : [];
  const goalsArray = Array.isArray(goals) ? goals : [];
  
  const totalBooks = booksArray.length;
  const completedGoals = goalsArray.filter((g) => g.completed).length;
  const totalGoals = goalsArray.length;
  const totalChapters = booksArray.reduce((sum, book) => sum + (book.totalChapters || 0), 0);
  const completedChapters = booksArray.reduce((sum, book) => sum + (book.completedChapters || 0), 0);

  // Calculate exam countdown
  const examDate = user?.examDate ? new Date(user.examDate) : null;
  const daysUntilExam = examDate ? differenceInDays(examDate, currentTime) : null;


  // Generate subject data from user's books and subjects
  const generateSubjectData = () => {
    if (!booksArray.length) return [];
    
    const subjectCounts = booksArray.reduce((acc, book) => {
      const subject = book.subject || 'General';
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#696FC7', '#A7AAE1', '#F5D3C4', '#F2AEBB', '#B8E6B8', '#FFD93D'];
    
    return Object.entries(subjectCounts).map(([name, count], index) => ({
      name,
      value: Math.round((count / booksArray.length) * 100),
      color: colors[index % colors.length]
    }));
  };

  const subjectData = generateSubjectData();

  // Calculate syllabus coverage percentage
  const syllabusProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  // Get exam badge color based on days remaining
  const getExamBadgeVariant = () => {
    if (!daysUntilExam) return 'secondary';
    if (daysUntilExam <= 7) return 'destructive';
    if (daysUntilExam <= 30) return 'default';
    return 'secondary';
  };

  // Calculate enhanced study session analytics
  const enhancedAnalytics = useMemo(() => {
    if (!analytics || !sessions) return null;

    const sessionsArray = Array.isArray(sessions) ? sessions : [];
    
    // Calculate peak day based on total study hours per day
    const dailyStudyTime = sessionsArray.reduce((acc, session) => {
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
    const studyDates = [...new Set(sessionsArray.map(session => 
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
      peakDay: peakDayFormatted,
      streakDays: activeStreak
    };
  }, [analytics, sessions]);

  // Quick action handlers
  const handleStartStudySession = () => {
    navigate('/study-sessions');
  };

  const handleAddDailyGoal = () => {
    navigate('/daily-goals');
  };

  const handleMarkChapterDone = () => {
    navigate('/subjects');
  };

  const handleAccessResources = () => {
    navigate('/books');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header with Exam Countdown */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Your personal study dashboard
            </p>
          </div>
          {daysUntilExam !== null && (
            <div className="flex items-center gap-3">
              <Badge variant={getExamBadgeVariant()} className="text-sm sm:text-base px-3 sm:px-4 py-2 font-medium">
                <Clock className="mr-2 h-4 w-4" />
                {daysUntilExam > 0 ? `${daysUntilExam} days until exam` : 'Exam today!'}
              </Badge>
            </div>
          )}
        </div>

        {/* Quick Stats Row - Only Real Data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Subjects"
          value={totalBooks.toString()}
          icon={BookOpen}
          color="primary"
        />
        <StatCard
          title="Daily Goals"
          value={`${completedGoals}/${totalGoals}`}
          icon={Target}
          color="success"
        />
        <StatCard
          title="Syllabus Progress"
          value={`${syllabusProgress}%`}
          icon={BookMarked}
          color="accent"
        />
      </div>

      {/* Quick Actions Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button 
              className="flex items-center justify-center gap-2 h-11 sm:h-12 text-sm sm:text-base"
              onClick={handleStartStudySession}
            >
              <PlayCircle className="h-4 w-4" />
              <span className="hidden xs:inline">Start Study Session</span>
              <span className="xs:hidden">Start Session</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2 h-11 sm:h-12 text-sm sm:text-base"
              onClick={handleAddDailyGoal}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Add Daily Goal</span>
              <span className="xs:hidden">Add Goal</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2 h-11 sm:h-12 text-sm sm:text-base sm:col-span-2 lg:col-span-1"
              onClick={handleMarkChapterDone}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden xs:inline">Mark Chapter Done</span>
              <span className="xs:hidden">Mark Done</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subject Distribution Chart - Only if user has books */}
      {subjectData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Subject Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Books']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {subjectData.map((subject) => (
                  <div key={subject.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="text-sm">{subject.name}</span>
                    <Badge variant="outline">{subject.value}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Sessions Analytics Overview */}
      {enhancedAnalytics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Study Sessions Analytics
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/study-sessions')}>
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard
                title="Total Sessions"
                value={enhancedAnalytics.totalSessions?.toString() || '0'}
                icon={BookOpen}
                color="primary"
              />
              <StatCard
                title="Study Hours"
                value={`${enhancedAnalytics.totalHours || 0}h`}
                icon={Clock}
                color="success"
              />
              <StatCard
                title="Avg Productivity"
                value={`${enhancedAnalytics.averageProductivity || 0}/5`}
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
          </CardContent>
        </Card>
      )}

      {/* Progress and Goals Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Books Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Books Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booksArray.slice(0, 4).map((book) => (
              <div key={book.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.subject}</p>
                  </div>
                  <Badge variant="outline">
                    {book.completedChapters}/{book.totalChapters}
                  </Badge>
                </div>
                <Progress 
                  value={(book.completedChapters / book.totalChapters) * 100} 
                  className="h-2"
                />
              </div>
            ))}
            {booksArray.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No books added yet. Start by adding your study materials!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Goals and Upcoming */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Goals & Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Today's Goals */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Today's Tasks
              </h4>
              <div className="space-y-3">
                {goalsArray.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                        goal.completed
                          ? 'border-green-500 bg-green-500'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {goal.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <span
                      className={`text-sm ${
                        goal.completed
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground'
                      }`}
                    >
                      {goal.task}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Tasks */}
            {totalGoals > completedGoals && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Upcoming Tasks
                </h4>
                <div className="space-y-2">
                  {goalsArray.filter(goal => !goal.completed).slice(0, 3).map((goal, index) => (
                    <div key={goal.id} className="flex items-center justify-between p-2 rounded-lg border-l-4" style={{ 
                      backgroundColor: `hsl(${200 + index * 30}, 70%, 95%)`, 
                      borderLeftColor: `hsl(${200 + index * 30}, 70%, 60%)` 
                    }}>
                      <span className="text-sm">{goal.task}</span>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(goalsArray.length === 0) && (
              <div className="text-center py-4">
                <Target className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No goals set for today. Start planning your day!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Insights & Resources */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Study Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Study Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {syllabusProgress > 0 && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-800">🎯 Great Progress!</p>
                <p className="text-sm text-green-600">
                  {syllabusProgress}% of your syllabus completed
                </p>
              </div>
            )}
            
            {completedGoals > 0 && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm font-medium text-blue-800">✅ Goals Achieved</p>
                <p className="text-sm text-blue-600">
                  {completedGoals} out of {totalGoals} daily goals completed
                </p>
              </div>
            )}

            {totalBooks > 5 && (
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                <p className="text-sm font-medium text-purple-800">📚 Great Library</p>
                <p className="text-sm text-purple-600">
                  {totalBooks} books in your study collection
                </p>
              </div>
            )}

            {(!syllabusProgress && !completedGoals && totalBooks === 0) && (
              <div className="text-center py-4">
                <Award className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Start studying to see your insights here!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/subjects')}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Syllabus
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/monthly-plan')}
            >
              <Target className="mr-2 h-4 w-4" />
              Monthly Plans
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/study-sessions')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Study Sessions
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Show actual recent activities based on user data */}
            {completedGoals > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Completed {completedGoals} daily goal{completedGoals > 1 ? 's' : ''}</span>
                <span className="text-muted-foreground ml-auto">Today</span>
              </div>
            )}
            
            {booksArray.length > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Added {booksArray.length} book{booksArray.length > 1 ? 's' : ''} to library</span>
                <span className="text-muted-foreground ml-auto">Recent</span>
              </div>
            )}

            {syllabusProgress > 50 && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Great progress on syllabus completion</span>
                <span className="text-muted-foreground ml-auto">Active</span>
              </div>
            )}

            {(!completedGoals && !booksArray.length && syllabusProgress === 0) && (
              <div className="text-center py-4">
                <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Your recent activities will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
