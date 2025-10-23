import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MonthlyPlan } from '@/redux/slices/monthlyPlanSlice';
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  SortAsc,
  SortDesc,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface FilterState {
  search: string;
  priority: string[];
  status: string[];
  targetType: string[];
  dateRange: DateRange | undefined;
  overdue: boolean;
  completed: boolean;
}

interface SortState {
  field: 'deadline' | 'priority' | 'progress' | 'subject' | 'createdAt';
  direction: 'asc' | 'desc';
}

interface FilterAndSearchProps {
  plans: MonthlyPlan[];
  onFilterChange: (filteredPlans: MonthlyPlan[]) => void;
  onSortChange?: (sortedPlans: MonthlyPlan[]) => void;
}

const FilterAndSearch: React.FC<FilterAndSearchProps> = ({ 
  plans, 
  onFilterChange, 
  onSortChange 
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: [],
    status: [],
    targetType: [],
    dateRange: { from: undefined, to: undefined },
    overdue: false,
    completed: false
  });

  const [sort, setSort] = useState<SortState>({
    field: 'deadline',
    direction: 'asc'
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...plans];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(plan => 
        plan.subject.toLowerCase().includes(searchLower) ||
        plan.target.toLowerCase().includes(searchLower) ||
        (plan.description && plan.description.toLowerCase().includes(searchLower))
      );
    }

    // Priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(plan => 
        filters.priority.includes(plan.priority || 'Medium')
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(plan => 
        filters.status.includes(plan.status || 'Not Started')
      );
    }

    // Target type filter
    if (filters.targetType.length > 0) {
      filtered = filtered.filter(plan => 
        filters.targetType.includes(plan.targetType || 'chapters')
      );
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(plan => {
        const planDate = new Date(plan.deadline);
        const from = filters.dateRange.from;
        const to = filters.dateRange.to;
        
        if (from && to) {
          return planDate >= from && planDate <= to;
        } else if (from) {
          return planDate >= from;
        } else if (to) {
          return planDate <= to;
        }
        return true;
      });
    }

    // Overdue filter
    if (filters.overdue) {
      filtered = filtered.filter(plan => {
        const deadline = new Date(plan.deadline);
        return deadline < new Date() && !plan.completed;
      });
    }

    // Completed filter
    if (filters.completed) {
      filtered = filtered.filter(plan => plan.completed);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sort.field) {
        case 'deadline': {
          aValue = new Date(a.deadline);
          bValue = new Date(b.deadline);
          break;
        }
        case 'priority': {
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
          break;
        }
        case 'progress': {
          aValue = a.progressPercentage || 0;
          bValue = b.progressPercentage || 0;
          break;
        }
        case 'subject': {
          aValue = a.subject.toLowerCase();
          bValue = b.subject.toLowerCase();
          break;
        }
        case 'createdAt': {
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        }
        default:
          return 0;
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    onFilterChange(filtered);
    if (onSortChange) onSortChange(filtered);
  }, [filters, sort, plans, onFilterChange, onSortChange]);

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayFilterToggle = (key: 'priority' | 'status' | 'targetType', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      priority: [],
      status: [],
      targetType: [],
      dateRange: { from: undefined, to: undefined },
      overdue: false,
      completed: false
    });
  };

  const hasActiveFilters = () => {
    return filters.search !== '' ||
           filters.priority.length > 0 ||
           filters.status.length > 0 ||
           filters.targetType.length > 0 ||
           filters.dateRange.from ||
           filters.dateRange.to ||
           filters.overdue ||
           filters.completed;
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.priority.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.targetType.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.overdue) count++;
    if (filters.completed) count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search plans by subject, description, or target..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Sort Options */}
          <Select
            value={`${sort.field}-${sort.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-') as [SortState['field'], SortState['direction']];
              setSort({ field, direction });
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline-asc">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Deadline (Early)
                </div>
              </SelectItem>
              <SelectItem value="deadline-desc">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  Deadline (Late)
                </div>
              </SelectItem>
              <SelectItem value="priority-desc">Priority (High-Low)</SelectItem>
              <SelectItem value="priority-asc">Priority (Low-High)</SelectItem>
              <SelectItem value="progress-desc">Progress (High-Low)</SelectItem>
              <SelectItem value="progress-asc">Progress (Low-High)</SelectItem>
              <SelectItem value="subject-asc">Subject (A-Z)</SelectItem>
              <SelectItem value="subject-desc">Subject (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "relative",
              hasActiveFilters() && "border-primary bg-primary/5"
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {activeFilterCount()}
              </Badge>
            )}
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters() && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {isFilterOpen && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Priority Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <div className="space-y-2">
                {['High', 'Medium', 'Low'].map((priority) => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={filters.priority.includes(priority)}
                      onCheckedChange={() => handleArrayFilterToggle('priority', priority)}
                    />
                    <Label htmlFor={`priority-${priority}`} className="text-sm">
                      {priority}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="space-y-2">
                {['Not Started', 'In Progress', 'Completed', 'Paused'].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => handleArrayFilterToggle('status', status)}
                    />
                    <Label htmlFor={`status-${status}`} className="text-sm">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Target Type</Label>
              <div className="space-y-2">
                {['chapters', 'pages', 'topics', 'hours'].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.targetType.includes(type)}
                      onCheckedChange={() => handleArrayFilterToggle('targetType', type)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm capitalize">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Date Range and Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Deadline Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                          {format(filters.dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={(range) => handleFilterChange('dateRange', range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick Filters */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Filters</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overdue"
                    checked={filters.overdue}
                    onCheckedChange={(checked) => handleFilterChange('overdue', !!checked)}
                  />
                  <Label htmlFor="overdue" className="text-sm">
                    Show only overdue
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={filters.completed}
                    onCheckedChange={(checked) => handleFilterChange('completed', !!checked)}
                  />
                  <Label htmlFor="completed" className="text-sm">
                    Show only completed
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.search}"
              <button onClick={() => handleFilterChange('search', '')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.priority.map(priority => (
            <Badge key={priority} variant="secondary" className="gap-1">
              Priority: {priority}
              <button onClick={() => handleArrayFilterToggle('priority', priority)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.status.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              Status: {status}
              <button onClick={() => handleArrayFilterToggle('status', status)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.overdue && (
            <Badge variant="destructive" className="gap-1">
              Overdue
              <button onClick={() => handleFilterChange('overdue', false)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.completed && (
            <Badge variant="secondary" className="gap-1">
              Completed
              <button onClick={() => handleFilterChange('completed', false)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterAndSearch;
