import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchMonthlyPlans, addMonthlyPlan, updateMonthlyPlan, deleteMonthlyPlan, updateMonthlyPlanProgress, MonthlyPlan as MonthlyPlanType } from '@/redux/slices/monthlyPlanSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, CheckCircle2, Minus, Target, Clock, AlertTriangle, TrendingUp, Grid3X3, Calendar, LayoutDashboard, Brain, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Import new components
import DashboardView from '@/components/MonthlyPlan/DashboardView';
import CalendarView from '@/components/MonthlyPlan/CalendarView';
import FilterAndSearch from '@/components/MonthlyPlan/FilterAndSearch';
import ProgressCharts from '@/components/MonthlyPlan/ProgressCharts';
import PerformanceAnalytics from '@/components/MonthlyPlan/PerformanceAnalytics';

const MonthlyPlan = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { plans, isLoading } = useAppSelector((state) => state.monthlyPlans);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [filteredPlans, setFilteredPlans] = useState<MonthlyPlanType[]>([]);
  const [formData, setFormData] = useState<{
    subject: string;
    target: string;
    deadline: string;
    targetType: 'pages' | 'chapters' | 'topics' | 'hours';
    targetAmount: number;
    priority: 'High' | 'Medium' | 'Low';
  }>({
    subject: '',
    target: '',
    deadline: '',
    targetType: 'chapters',
    targetAmount: 1,
    priority: 'Medium',
  });

  // Initialize filtered plans when plans change
  useEffect(() => {
    setFilteredPlans(plans);
  }, [plans]);

  const handleFilterChange = (filtered: MonthlyPlanType[]) => {
    setFilteredPlans(filtered);
  };

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

  const handleToggleComplete = async (plan: MonthlyPlanType) => {
    try {
      await dispatch(updateMonthlyPlan({ id: plan.id, data: { completed: !plan.completed } }));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update failed' });
    }
  };

  const handleProgressUpdate = async (plan: MonthlyPlanType, increment: number) => {
    const newAmount = Math.max(0, Math.min(plan.targetAmount, plan.completedAmount + increment));
    try {
      await dispatch(updateMonthlyPlanProgress({ id: plan.id, completedAmount: newAmount }));
      toast({ title: 'Progress updated successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update progress' });
    }
  };

  const handleEdit = (plan: MonthlyPlanType) => {
    setEditingPlan(plan.id);
    setFormData({
      subject: plan.subject,
      target: plan.target,
      deadline: plan.deadline,
      targetType: plan.targetType || 'chapters',
      targetAmount: plan.targetAmount || 1,
      priority: plan.priority || 'Medium',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ 
      subject: '', 
      target: '', 
      deadline: '',
      targetType: 'chapters',
      targetAmount: 1,
      priority: 'Medium',
    });
    setEditingPlan(null);
  };

  const handleCreatePlan = async (planData: Partial<MonthlyPlanType>) => {
    try {
      await dispatch(addMonthlyPlan(planData as any));
      toast({ title: 'Plan created successfully from template' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to create plan' });
    }
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'Medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'Low': return 'border-green-500 bg-green-50 dark:bg-green-950';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'In Progress': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'Paused': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Monthly Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Set and track your monthly study targets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:inline">Add Plan</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Mathematics, History, Physics"
                  className="text-sm"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target" className="text-sm font-medium">Description</Label>
                <Input
                  id="target"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  placeholder="e.g., Complete differential equations chapter"
                  className="text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetType" className="text-sm font-medium">Target Type</Label>
                  <Select
                    value={formData.targetType}
                    onValueChange={(value: 'pages' | 'chapters' | 'topics' | 'hours') =>
                      setFormData({ ...formData, targetType: value })
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chapters">Chapters</SelectItem>
                      <SelectItem value="pages">Pages</SelectItem>
                      <SelectItem value="topics">Topics</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAmount" className="text-sm font-medium">Target Amount</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    min="1"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: parseInt(e.target.value) || 1 })}
                    className="text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'High' | 'Medium' | 'Low') =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          High
                        </div>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="Low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Low
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-sm font-medium">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="text-sm"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-6">
                {editingPlan ? 'Update Plan' : 'Add Plan'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : (
        <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1 h-auto p-1">
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden xs:inline">Dashboard</span>
              <span className="xs:hidden">Dash</span>
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden xs:inline">Grid View</span>
              <span className="xs:hidden">Grid</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Calendar className="h-4 w-4" />
              <span className="hidden xs:inline">Calendar</span>
              <span className="xs:hidden">Cal</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden xs:inline">Charts</span>
              <span className="xs:hidden">Chart</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Target className="h-4 w-4" />
              <span className="hidden xs:inline">Analytics</span>
              <span className="xs:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardView plans={plans} />
            
              {/* Recent Plans Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Plans</h3>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {plans.slice(0, 6).map((plan) => (
                  <Card key={plan.id} className={`transition-all hover:shadow-lg ${getPriorityColor(plan.priority || 'Medium')} border-l-4`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <button onClick={() => handleToggleComplete(plan)}>
                          {plan.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground hover:border-primary transition-colors" />
                          )}
                        </button>
                        <span className={plan.completed ? 'line-through text-muted-foreground' : ''}>
                          {plan.subject}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">{plan.target}</p>
                      {plan.targetAmount && plan.targetAmount > 0 && (
                        <div className="space-y-1">
                          <Progress value={plan.progressPercentage || 0} className="h-1" />
                          <span className="text-xs text-muted-foreground">
                            {plan.progressPercentage || 0}% Complete
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="grid" className="space-y-6">
            <FilterAndSearch 
              plans={plans} 
              onFilterChange={handleFilterChange}
            />
            
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredPlans.map((plan) => (
                <Card key={plan.id} className={`transition-all hover:shadow-lg ${getPriorityColor(plan.priority || 'Medium')} border-l-4`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <button onClick={() => handleToggleComplete(plan)}>
                            {plan.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground hover:border-primary transition-colors" />
                            )}
                          </button>
                          <span className={plan.completed ? 'line-through text-muted-foreground' : ''}>
                            {plan.subject}
                          </span>
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(plan.status || 'Not Started')}
                          <span className="text-xs text-muted-foreground">
                            {plan.status || 'Not Started'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {plan.priority || 'Medium'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-foreground">{plan.target}</p>
                    
                    {/* Progress Section */}
                    {plan.targetAmount && plan.targetAmount > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {plan.completedAmount || 0} / {plan.targetAmount} {plan.targetType || 'items'}
                          </span>
                        </div>
                        <Progress 
                          value={plan.progressPercentage || 0} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-primary">
                            {plan.progressPercentage || 0}% Complete
                          </span>
                          {!plan.completed && (
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => handleProgressUpdate(plan, -1)}
                                disabled={!plan.completedAmount || plan.completedAmount <= 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => handleProgressUpdate(plan, 1)}
                                disabled={plan.completedAmount >= plan.targetAmount}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deadline and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(plan.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {isOverdue(plan.deadline) && !plan.completed && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                        {plan.completed && (
                          <Badge className="bg-green-600 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPlans.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground">
                  {plans.length === 0 ? 'No monthly plans yet. Start by adding your targets!' : 'No plans match your current filters.'}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarView plans={plans} />
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <ProgressCharts plans={plans} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PerformanceAnalytics plans={plans} />
          </TabsContent>

        </Tabs>
      )}
    </div>
  );
};

export default MonthlyPlan;
