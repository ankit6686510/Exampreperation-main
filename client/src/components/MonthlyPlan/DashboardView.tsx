import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MonthlyPlan } from '@/redux/slices/monthlyPlanSlice';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Target,
  TrendingUp,
  Calendar,
  Award,
  BarChart3
} from 'lucide-react';

interface DashboardViewProps {
  plans: MonthlyPlan[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ plans }) => {
  const stats = useMemo(() => {
    const total = plans.length;
    const completed = plans.filter(plan => plan.completed).length;
    const inProgress = plans.filter(plan => plan.status === 'In Progress').length;
    const overdue = plans.filter(plan => {
      const deadline = new Date(plan.deadline);
      const today = new Date();
      return deadline < today && !plan.completed;
    }).length;

    const upcomingDeadlines = plans.filter(plan => {
      const deadline = new Date(plan.deadline);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return deadline >= today && deadline <= nextWeek && !plan.completed;
    }).length;

    const overallProgress = total > 0 
      ? Math.round(plans.reduce((acc, plan) => acc + (plan.progressPercentage || 0), 0) / total)
      : 0;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      overdue,
      upcomingDeadlines,
      overallProgress,
      completionRate
    };
  }, [plans]);

  const priorityBreakdown = useMemo(() => {
    const high = plans.filter(plan => plan.priority === 'High').length;
    const medium = plans.filter(plan => plan.priority === 'Medium').length;
    const low = plans.filter(plan => plan.priority === 'Low').length;
    return { high, medium, low };
  }, [plans]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Total Plans */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Total Plans
          </CardTitle>
          <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
          <div className="grid grid-cols-3 gap-1 mt-2 text-xs">
            <div className="text-center">
              <div className="text-red-600 font-medium">{priorityBreakdown.high}</div>
              <div className="text-red-500">High</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-600 font-medium">{priorityBreakdown.medium}</div>
              <div className="text-yellow-500">Med</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-medium">{priorityBreakdown.low}</div>
              <div className="text-green-500">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
            Completion Rate
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {stats.completionRate}%
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={stats.completionRate} className="flex-1 h-2" />
            <span className="text-xs text-green-600">{stats.completed}/{stats.total}</span>
          </div>
        </CardContent>
      </Card>

      {/* In Progress */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
            In Progress
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {stats.inProgress}
          </div>
          <div className="text-xs text-orange-600 mt-1">
            Overall: {stats.overallProgress}% complete
          </div>
          <Progress value={stats.overallProgress} className="mt-2 h-2" />
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
            Needs Attention
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700 dark:text-red-300">Overdue</span>
              <Badge variant="destructive" className="text-xs">
                {stats.overdue}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700 dark:text-red-300">Due Soon</span>
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                {stats.upcomingDeadlines}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardView;
