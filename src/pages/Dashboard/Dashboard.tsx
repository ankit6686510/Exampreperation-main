import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchBooks } from '@/redux/slices/bookSlice';
import { fetchDailyGoals } from '@/redux/slices/dailyGoalSlice';
import StatCard from '@/components/StatCard';
import { BookOpen, Target, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProgressBar from '@/components/ProgressBar';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { books } = useAppSelector((state) => state.books);
  const { goals } = useAppSelector((state) => state.dailyGoals);

  useEffect(() => {
    dispatch(fetchBooks());
    dispatch(fetchDailyGoals(new Date().toISOString().split('T')[0]));
  }, [dispatch]);

  // Ensure books and goals are arrays to prevent errors
  const booksArray = Array.isArray(books) ? books : [];
  const goalsArray = Array.isArray(goals) ? goals : [];
  
  const totalBooks = booksArray.length;
  const completedGoals = goalsArray.filter((g) => g.completed).length;
  const totalGoals = goalsArray.length;
  const totalChapters = booksArray.reduce((sum, book) => sum + (book.totalChapters || 0), 0);
  const completedChapters = booksArray.reduce((sum, book) => sum + (book.completedChapters || 0), 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name || 'Student'}!
        </h1>
        <p className="mt-1 text-muted-foreground">Here's your study progress overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Books" value={totalBooks} icon={BookOpen} color="primary" />
        <StatCard
          title="Today's Goals"
          value={`${completedGoals}/${totalGoals}`}
          icon={Target}
          color="accent"
        />
        <StatCard
          title="Completed Chapters"
          value={completedChapters}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Total Chapters"
          value={totalChapters}
          icon={Calendar}
          color="warning"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Books</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booksArray.slice(0, 3).map((book) => (
              <div key={book.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.subject}</p>
                  </div>
                </div>
                <ProgressBar
                  current={book.completedChapters}
                  total={book.totalChapters}
                  color="primary"
                />
              </div>
            ))}
            {booksArray.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No books added yet. Start by adding your study materials!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goalsArray.slice(0, 5).map((goal) => (
              <div key={goal.id} className="flex items-center gap-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                    goal.completed
                      ? 'border-success bg-success'
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
            {goalsArray.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No goals set for today. Start planning your day!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
