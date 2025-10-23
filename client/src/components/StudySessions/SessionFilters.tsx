import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Clock,
  BookOpen,
  Star,
  X,
  ChevronDown,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface FilterOptions {
  search: string;
  sessionTypes: string[];
  subjects: string[];
  moods: string[];
  productivityRange: [number, number];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  sortBy: 'date' | 'duration' | 'productivity' | 'subject';
  sortOrder: 'asc' | 'desc';
}

interface SessionFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableSubjects: string[];
  totalSessions: number;
  filteredSessions: number;
  className?: string;
}

const SessionFilters: React.FC<SessionFiltersProps> = ({
  filters,
  onFiltersChange,
  availableSubjects,
  totalSessions,
  filteredSessions,
  className
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const sessionTypes = ['Reading', 'Practice', 'Revision', 'Test', 'Notes'];
  const moods = ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'];

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      search: '',
      sessionTypes: [],
      subjects: [],
      moods: [],
      productivityRange: [1, 5],
      dateRange: {},
      sortBy: 'date',
      sortOrder: 'desc'
    };
    onFiltersChange(clearedFilters);
    setLocalFilters(clearedFilters);
  };

  const activeFiltersCount = 
    (filters.search ? 1 : 0) +
    filters.sessionTypes.length +
    filters.subjects.length +
    filters.moods.length +
    (filters.productivityRange[0] > 1 || filters.productivityRange[1] < 5 ? 1 : 0) +
    (filters.dateRange.from || filters.dateRange.to ? 1 : 0);

  const getSessionTypeIcon = (type: string) => {
    const icons = {
      Reading: BookOpen,
      Practice: TrendingUp,
      Revision: BarChart3,
      Test: Star,
      Notes: BookOpen
    };
    return icons[type as keyof typeof icons] || BookOpen;
  };

  const getMoodEmoji = (mood: string) => {
    const emojis = {
      Excellent: '😊',
      Good: '🙂',
      Average: '😐',
      Poor: '😞',
      'Very Poor': '😓'
    };
    return emojis[mood as keyof typeof emojis] || '😐';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sessions by subject, topic, or notes..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10 pr-4 py-2 h-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateFilters({ search: '' })}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => updateFilters({ sortBy: value as FilterOptions['sortBy'] })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </div>
              </SelectItem>
              <SelectItem value="duration">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </div>
              </SelectItem>
              <SelectItem value="productivity">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Productivity
                </div>
              </SelectItem>
              <SelectItem value="subject">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Subject
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => 
              updateFilters({ 
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
              })
            }
            className="px-3"
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Advanced Filters Toggle */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-6" align="end">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Advanced Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Session Types */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Session Types</label>
                <div className="grid grid-cols-2 gap-2">
                  {sessionTypes.map((type) => {
                    const Icon = getSessionTypeIcon(type);
                    const isSelected = filters.sessionTypes.includes(type);
                    return (
                      <label
                        key={type}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                          isSelected 
                            ? "bg-blue-50 border-blue-200 text-blue-900" 
                            : "hover:bg-gray-50"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const newTypes = checked
                              ? [...filters.sessionTypes, type]
                              : filters.sessionTypes.filter(t => t !== type);
                            updateFilters({ sessionTypes: newTypes });
                          }}
                        />
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Subjects */}
              {availableSubjects.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Subjects</label>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {availableSubjects.map((subject) => {
                      const isSelected = filters.subjects.includes(subject);
                      return (
                        <label
                          key={subject}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                            isSelected 
                              ? "bg-green-50 border-green-200 text-green-900" 
                              : "hover:bg-gray-50"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newSubjects = checked
                                ? [...filters.subjects, subject]
                                : filters.subjects.filter(s => s !== subject);
                              updateFilters({ subjects: newSubjects });
                            }}
                          />
                          <span className="text-sm">{subject}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Moods */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Moods</label>
                <div className="grid grid-cols-2 gap-2">
                  {moods.map((mood) => {
                    const isSelected = filters.moods.includes(mood);
                    return (
                      <label
                        key={mood}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                          isSelected 
                            ? "bg-purple-50 border-purple-200 text-purple-900" 
                            : "hover:bg-gray-50"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const newMoods = checked
                              ? [...filters.moods, mood]
                              : filters.moods.filter(m => m !== mood);
                            updateFilters({ moods: newMoods });
                          }}
                        />
                        <span className="text-sm">{getMoodEmoji(mood)} {mood}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Productivity Range */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Productivity Range: {filters.productivityRange[0]} - {filters.productivityRange[1]}
                </label>
                <Slider
                  value={filters.productivityRange}
                  onValueChange={(value) => 
                    updateFilters({ productivityRange: value as [number, number] })
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Poor (1)</span>
                  <span>Excellent (5)</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-2 items-center"
          >
            <span className="text-sm text-gray-600">Active filters:</span>
            
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: "{filters.search}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ search: '' })}
                />
              </Badge>
            )}

            {filters.sessionTypes.map((type) => (
              <Badge key={type} variant="secondary" className="gap-1">
                {type}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => 
                    updateFilters({ 
                      sessionTypes: filters.sessionTypes.filter(t => t !== type) 
                    })
                  }
                />
              </Badge>
            ))}

            {filters.subjects.map((subject) => (
              <Badge key={subject} variant="secondary" className="gap-1">
                {subject}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => 
                    updateFilters({ 
                      subjects: filters.subjects.filter(s => s !== subject) 
                    })
                  }
                />
              </Badge>
            ))}

            {filters.moods.map((mood) => (
              <Badge key={mood} variant="secondary" className="gap-1">
                {getMoodEmoji(mood)} {mood}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => 
                    updateFilters({ 
                      moods: filters.moods.filter(m => m !== mood) 
                    })
                  }
                />
              </Badge>
            ))}

            {(filters.productivityRange[0] > 1 || filters.productivityRange[1] < 5) && (
              <Badge variant="secondary" className="gap-1">
                Productivity: {filters.productivityRange[0]}-{filters.productivityRange[1]}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ productivityRange: [1, 5] })}
                />
              </Badge>
            )}

            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearAllFilters}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              Clear All
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredSessions} of {totalSessions} sessions
        </span>
        {activeFiltersCount > 0 && (
          <span>
            {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied
          </span>
        )}
      </div>
    </div>
  );
};

export default SessionFilters;
