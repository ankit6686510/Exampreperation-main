import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchDailyGoals, addDailyGoal, toggleDailyGoal, deleteDailyGoal } from '@/redux/slices/dailyGoalSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

const DailyGoals = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { goals, isLoading } = useAppSelector((state) => state.dailyGoals);
  const [newTask, setNewTask] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    dispatch(fetchDailyGoals(selectedDate));
  }, [dispatch, selectedDate]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      await dispatch(addDailyGoal({ task: newTask, date: selectedDate }));
      setNewTask('');
      toast({ title: 'Goal added successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to add goal' });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await dispatch(toggleDailyGoal(id));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update goal' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteDailyGoal(id));
      toast({ title: 'Goal deleted successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const completedCount = goals.filter((g) => g.completed).length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Daily Goals</h1>
        <p className="mt-1 text-muted-foreground">Plan and track your daily study tasks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Goals for {new Date(selectedDate).toLocaleDateString()}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {completedCount} / {goals.length} completed
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddGoal} className="flex gap-2">
            <Input
              placeholder="Add a new goal..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <Button type="submit">
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-2">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-[var(--shadow-card)]"
                >
                  <button
                    onClick={() => handleToggle(goal.id)}
                    className="flex-shrink-0"
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <span
                    className={`flex-1 ${
                      goal.completed
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    }`}
                  >
                    {goal.task}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {goals.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  No goals for this date. Start adding tasks!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyGoals;
