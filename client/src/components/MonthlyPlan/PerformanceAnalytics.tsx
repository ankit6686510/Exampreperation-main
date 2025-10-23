import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MonthlyPlan } from '@/redux/slices/monthlyPlanSlice';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Lightbulb, 
  Award, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceAnalyticsProps {
  plans: MonthlyPlan[];
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  description: string;
  icon: React.ReactNode;
  actionable?: string;
}

interface WeeklyReport {
  week: string;
  completionRate: number;
  productivity: number;
  consistency: number;
  timeSpent: number;
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ plans }) => {
  // Show empty state when no plans exist
  if (plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
          <p className="text-muted-foreground">
            Add some monthly plans to see your performance analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  const analytics = useMemo(() => {
    const totalPlans = plans.length;
    const completedPlans = plans.filter(p => p.completed).length;
    const highPriorityPlans = plans.filter(p => p.priority === 'High').length;
    const completedHighPriority = plans.filter(p => p.priority === 'High' && p.completed).length;
    
    const overallProgress = totalPlans > 0 
      ? plans.reduce((acc, plan) => acc + (plan.progressPercentage || 0), 0) / totalPlans
      : 0;

    const overdueCount = plans.filter(plan => {
      const deadline = new Date(plan.deadline);
      return deadline < new Date() && !plan.completed;
    }).length;

    const avgProgressPerSubject = plans.reduce((acc, plan) => {
      if (!acc[plan.subject]) {
        acc[plan.subject] = { total: 0, count: 0 };
      }
      acc[plan.subject].total += plan.progressPercentage || 0;
      acc[plan.subject].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const subjectPerformance = Object.entries(avgProgressPerSubject).map(([subject, data]) => ({
      subject,
      avgProgress: data.total / data.count,
      planCount: data.count
    }));

    return {
      totalPlans,
      completedPlans,
      completionRate: totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0,
      overallProgress,
      highPriorityCompletion: highPriorityPlans > 0 ? (completedHighPriority / highPriorityPlans) * 100 : 0,
      overdueCount,
      subjectPerformance,
    };
  }, [plans]);

  const insights: Insight[] = useMemo(() => {
    const insights: Insight[] = [];

    // Completion rate insights - only real data
    if (analytics.completionRate >= 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Completion Rate!',
        description: `You've completed ${analytics.completionRate.toFixed(0)}% of your monthly plans.`,
        icon: <CheckCircle2 className="h-4 w-4" />,
        actionable: 'Keep up the great work! Consider setting more ambitious goals.'
      });
    } else if (analytics.completionRate < 50 && analytics.totalPlans > 0) {
      insights.push({
        type: 'warning',
        title: 'Completion Rate Needs Attention',
        description: `Only ${analytics.completionRate.toFixed(0)}% of plans completed this month.`,
        icon: <AlertCircle className="h-4 w-4" />,
        actionable: 'Consider breaking large tasks into smaller, manageable milestones.'
      });
    }

    // Overdue tasks - real data only
    if (analytics.overdueCount > 0) {
      insights.push({
        type: 'danger',
        title: 'Overdue Tasks Alert',
        description: `You have ${analytics.overdueCount} overdue task${analytics.overdueCount > 1 ? 's' : ''}.`,
        icon: <Clock className="h-4 w-4" />,
        actionable: 'Prioritize overdue tasks or adjust deadlines realistically.'
      });
    }

    // High priority performance - real data only
    if (analytics.highPriorityCompletion < 70 && analytics.highPriorityCompletion > 0) {
      insights.push({
        type: 'warning',
        title: 'High Priority Focus Needed',
        description: `${analytics.highPriorityCompletion.toFixed(0)}% of high priority tasks completed.`,
        icon: <Target className="h-4 w-4" />,
        actionable: 'Focus on high priority tasks first each day.'
      });
    }

    // Subject performance insights - real data only
    if (analytics.subjectPerformance.length > 1) {
      const bestSubject = analytics.subjectPerformance.reduce((best, current) => 
        current.avgProgress > best.avgProgress ? current : best
      );

      const worstSubject = analytics.subjectPerformance.reduce((worst, current) => 
        current.avgProgress < worst.avgProgress ? current : worst
      );

      if (bestSubject && worstSubject && bestSubject.subject !== worstSubject.subject) {
        insights.push({
          type: 'info',
          title: 'Subject Performance Variance',
          description: `${bestSubject.subject} (${bestSubject.avgProgress.toFixed(0)}%) vs ${worstSubject.subject} (${worstSubject.avgProgress.toFixed(0)}%)`,
          icon: <BarChart3 className="h-4 w-4" />,
          actionable: `Apply successful strategies from ${bestSubject.subject} to ${worstSubject.subject}.`
        });
      }
    }

    return insights;
  }, [analytics]);

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800';
      case 'danger': return 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800';
      case 'info': return 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  const getInsightTextColor = (type: Insight['type']) => {
    switch (type) {
      case 'success': return 'text-green-700 dark:text-green-300';
      case 'warning': return 'text-yellow-700 dark:text-yellow-300';
      case 'danger': return 'text-red-700 dark:text-red-300';
      case 'info': return 'text-blue-700 dark:text-blue-300';
      default: return 'text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators - Only Real Data */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.completionRate.toFixed(0)}%</p>
              </div>
              <div className={cn(
                "p-2 rounded-full",
                analytics.completionRate >= 70 ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
              )}>
                {analytics.completionRate >= 70 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
            </div>
            <Progress value={analytics.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Plans</p>
                <p className="text-2xl font-bold">{analytics.totalPlans}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {analytics.completedPlans} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Progress</p>
                <p className="text-2xl font-bold">{analytics.overallProgress.toFixed(0)}%</p>
              </div>
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
            <Progress value={analytics.overallProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Real Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Current Month Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plans Completed</span>
                <span className="font-medium">{analytics.completedPlans} / {analytics.totalPlans}</span>
              </div>
              <Progress value={analytics.completionRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">High Priority Completion</span>
                <span className="font-medium">{analytics.highPriorityCompletion.toFixed(0)}%</span>
              </div>
              <Progress value={analytics.highPriorityCompletion} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Powered Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={cn(
                  "p-4 rounded-lg border",
                  getInsightColor(insight.type)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5", getInsightTextColor(insight.type))}>
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={cn("font-medium text-sm", getInsightTextColor(insight.type))}>
                      {insight.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                    {insight.actionable && (
                      <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded text-xs">
                        <Lightbulb className="h-3 w-3 inline mr-1" />
                        {insight.actionable}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.subjectPerformance.map((subject) => (
              <div key={subject.subject} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{subject.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {subject.planCount} plan{subject.planCount !== 1 ? 's' : ''}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {subject.avgProgress.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={subject.avgProgress} className="h-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Removed hardcoded Smart Recommendations section */}
    </div>
  );
};

export default PerformanceAnalytics;
