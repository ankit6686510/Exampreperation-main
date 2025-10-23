import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchMonthlyPlans, addMonthlyPlan, updateMonthlyPlan, deleteMonthlyPlan } from '@/redux/slices/monthlyPlanSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MonthlyPlan = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { plans, isLoading } = useAppSelector((state) => state.monthlyPlans);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    target: '',
    deadline: '',
  });

  useEffect(() => {
    dispatch(fetchMonthlyPlans());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await dispatch(updateMonthlyPlan({ id: editingPlan, data: formData }));
        toast({ title: 'Plan updated successfully' });
      } else {
        await dispatch(addMonthlyPlan(formData));
        toast({ title: 'Plan added successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Operation failed' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteMonthlyPlan(id));
      toast({ title: 'Plan deleted successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const handleToggleComplete = async (plan: any) => {
    try {
      await dispatch(updateMonthlyPlan({ id: plan.id, data: { completed: !plan.completed } }));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update failed' });
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan.id);
    setFormData({
      subject: plan.subject,
      target: plan.target,
      deadline: plan.deadline,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ subject: '', target: '', deadline: '' });
    setEditingPlan(null);
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monthly Plan</h1>
          <p className="mt-1 text-muted-foreground">Set and track your monthly study targets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target (e.g., "Complete 5 chapters")</Label>
                <Input
                  id="target"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingPlan ? 'Update Plan' : 'Add Plan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="transition-all hover:shadow-[var(--shadow-card)]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <button onClick={() => handleToggleComplete(plan)}>
                        {plan.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                        )}
                      </button>
                      {plan.subject}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{plan.target}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Due: {new Date(plan.deadline).toLocaleDateString()}
                  </span>
                  {isOverdue(plan.deadline) && !plan.completed && (
                    <Badge variant="destructive">Overdue</Badge>
                  )}
                  {plan.completed && <Badge className="bg-success">Completed</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">
              No monthly plans yet. Start by adding your targets!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthlyPlan;
