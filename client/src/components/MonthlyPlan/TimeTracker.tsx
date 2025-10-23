import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MonthlyPlan } from '@/redux/slices/monthlyPlanSlice';
import { 
  Play, 
  Pause, 
  Square, 
  Timer, 
  Target, 
  Trophy,
  Flame,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeTrackerProps {
  plan: MonthlyPlan;
  onTimeUpdate?: (planId: string, timeSpent: number) => void;
}

interface Milestone {
  id: string;
  title: string;
  target: number;
  achieved: boolean;
  reward: string;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ plan, onTimeUpdate }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [streak, setStreak] = useState(7); // Mock streak data
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  // Mock milestones based on target amount
  const milestones: Milestone[] = [
    {
      id: '1',
      title: '25% Complete',
      target: Math.ceil((plan.targetAmount || 0) * 0.25),
      achieved: (plan.completedAmount || 0) >= Math.ceil((plan.targetAmount || 0) * 0.25),
      reward: '🎯 First Quarter'
    },
    {
      id: '2', 
      title: '50% Complete',
      target: Math.ceil((plan.targetAmount || 0) * 0.5),
      achieved: (plan.completedAmount || 0) >= Math.ceil((plan.targetAmount || 0) * 0.5),
      reward: '🚀 Halfway Hero'
    },
    {
      id: '3',
      title: '75% Complete', 
      target: Math.ceil((plan.targetAmount || 0) * 0.75),
      achieved: (plan.completedAmount || 0) >= Math.ceil((plan.targetAmount || 0) * 0.75),
      reward: '💪 Final Push'
    },
    {
      id: '4',
      title: '100% Complete',
      target: plan.targetAmount || 0,
      achieved: (plan.completedAmount || 0) >= (plan.targetAmount || 0),
      reward: '🏆 Champion'
    }
  ];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        setSessionTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  // Check for milestone achievements
  useEffect(() => {
    const justAchieved = milestones.find(m => 
      m.achieved && 
      (plan.completedAmount || 0) === m.target
    );
    
    if (justAchieved) {
      setCelebrationVisible(true);
      setTimeout(() => setCelebrationVisible(false), 3000);
    }
  }, [plan.completedAmount, milestones]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsTracking(true);
  };

  const handlePause = () => {
    setIsTracking(false);
  };

  const handleStop = () => {
    setIsTracking(false);
    if (onTimeUpdate) {
      onTimeUpdate(plan.id, sessionTime);
    }
    setElapsedTime(0);
    setSessionTime(0);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
    if (streak >= 14) return 'text-orange-600 bg-orange-100 dark:bg-orange-900';
    if (streak >= 7) return 'text-green-600 bg-green-100 dark:bg-green-900';
    return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
  };

  const achievedMilestones = milestones.filter(m => m.achieved).length;
  const nextMilestone = milestones.find(m => !m.achieved);

  return (
    <div className="space-y-4">
      {/* Celebration Animation */}
      {celebrationVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-lg shadow-2xl text-xl font-bold">
            🎉 Milestone Achieved! 🎉
          </div>
        </div>
      )}

      {/* Time Tracker Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Time Tracker - {plan.subject}
            </div>
            <Badge className={cn('flex items-center gap-1', getStreakColor(streak))}>
              <Flame className="h-3 w-3" />
              {streak} day streak
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-primary">
              {formatTime(elapsedTime)}
            </div>
            <p className="text-sm text-muted-foreground">
              {isTracking ? 'Currently studying' : 'Study timer'}
            </p>
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center gap-2">
            {!isTracking ? (
              <Button onClick={handleStart} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start
              </Button>
            ) : (
              <Button onClick={handlePause} variant="outline" className="flex items-center gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}
            <Button onClick={handleStop} variant="outline" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">
                {formatTime(sessionTime)}
              </div>
              <p className="text-xs text-muted-foreground">This Session</p>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {Math.round(Math.random() * 10 + 15)}h
              </div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {Math.round(Math.random() * 30 + 45)}h
              </div>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Milestones ({achievedMilestones}/{milestones.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Next Milestone Progress */}
          {nextMilestone && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Next: {nextMilestone.title}</span>
                <span className="text-muted-foreground">
                  {plan.completedAmount || 0} / {nextMilestone.target}
                </span>
              </div>
              <Progress 
                value={((plan.completedAmount || 0) / nextMilestone.target) * 100} 
                className="h-3"
              />
            </div>
          )}

          {/* Milestone List */}
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div 
                key={milestone.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  milestone.achieved 
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                    : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                )}
              >
                <div className="flex items-center gap-3">
                  {milestone.achieved ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                  <div>
                    <div className="font-medium text-sm">{milestone.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {milestone.target} {plan.targetType || 'items'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{milestone.reward}</span>
                  {milestone.achieved && (
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Achievement Summary */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Achievement Rate</span>
              <span className="font-medium">
                {Math.round((achievedMilestones / milestones.length) * 100)}%
              </span>
            </div>
            <Progress 
              value={(achievedMilestones / milestones.length) * 100} 
              className="mt-2 h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Study Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Study Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Productivity Score</h4>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-orange-600">87%</div>
                <Badge variant="secondary">+5% vs last week</Badge>
              </div>
              <Progress value={87} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Focus Quality</h4>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-green-600">92%</div>
                <Badge variant="secondary">Excellent</Badge>
              </div>
              <Progress value={92} className="h-2" />
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h5 className="font-medium text-sm mb-1">💡 Tip of the Day</h5>
            <p className="text-xs text-muted-foreground">
              You're most productive between 9-11 AM. Consider scheduling difficult topics during this time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTracker;
