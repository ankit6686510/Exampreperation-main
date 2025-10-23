import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MonthlyPlan } from '@/redux/slices/monthlyPlanSlice';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  plans: MonthlyPlan[];
  onDateSelect?: (date: Date, plansForDate: MonthlyPlan[]) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ plans, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { calendarDays, monthPlans } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Create calendar grid
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    // Group plans by date
    const plansByDate = plans.reduce((acc, plan) => {
      const planDate = new Date(plan.deadline);
      if (planDate.getMonth() === month && planDate.getFullYear() === year) {
        const dateKey = planDate.getDate();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(plan);
      }
      return acc;
    }, {} as Record<number, MonthlyPlan[]>);

    return {
      calendarDays: days,
      monthPlans: plansByDate
    };
  }, [currentDate, plans]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDateStatus = (day: number) => {
    const plansForDay = monthPlans[day] || [];
    if (plansForDay.length === 0) return null;

    const completed = plansForDay.filter(p => p.completed).length;
    const overdue = plansForDay.filter(p => {
      const deadline = new Date(p.deadline);
      return deadline < new Date() && !p.completed;
    }).length;
    const total = plansForDay.length;

    if (overdue > 0) return 'overdue';
    if (completed === total) return 'completed';
    if (completed > 0) return 'partial';
    return 'pending';
  };

  const getDateIndicatorColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'pending': return 'bg-blue-500';
      default: return 'bg-gray-200';
    }
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  const handleDateClick = (day: number) => {
    const plansForDate = monthPlans[day] || [];
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onDateSelect?.(selectedDate, plansForDate);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold min-w-[180px] text-center">
              {formatMonth(currentDate)}
            </h3>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Overdue</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-square" />;
            }

            const status = getDateStatus(day);
            const plansCount = monthPlans[day]?.length || 0;
            const isCurrentDay = isToday(day);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "aspect-square p-1 text-sm border rounded-md hover:bg-accent transition-colors relative",
                  isCurrentDay && "ring-2 ring-primary",
                  plansCount > 0 && "cursor-pointer hover:shadow-md"
                )}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={cn(
                    "font-medium",
                    isCurrentDay && "text-primary font-bold"
                  )}>
                    {day}
                  </span>
                  
                  {plansCount > 0 && (
                    <>
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1",
                        getDateIndicatorColor(status)
                      )} />
                      <span className="text-xs text-muted-foreground">
                        {plansCount}
                      </span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Selected Date Details */}
        <div className="mt-4 space-y-2">
          {Object.entries(monthPlans).length > 0 && (
            <div className="text-sm">
              <h4 className="font-medium mb-2">This Month's Deadlines:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Object.entries(monthPlans)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([day, plansForDay]) => (
                    <div key={day} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                      <span className="font-medium">{currentDate.toLocaleDateString('en-US', { month: 'short' })} {day}</span>
                      <div className="flex items-center gap-2">
                        <span>{plansForDay.length} plan{plansForDay.length !== 1 ? 's' : ''}</span>
                        {plansForDay.some(p => p.completed) && (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        )}
                        {plansForDay.some(p => new Date(p.deadline) < new Date() && !p.completed) && (
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
