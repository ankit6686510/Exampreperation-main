import { useState, useCallback, useMemo } from 'react';
import { Search, Filter, X, BookOpen, Clock, Target, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setFilters, clearFilters } from '@/redux/slices/bookSlice';
import { Book } from '@/redux/slices/bookSlice';

interface SearchAndFiltersProps {
  books: Book[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

const SearchAndFilters = ({
  books,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
}: SearchAndFiltersProps) => {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.books);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get unique values for filter options
  const uniqueSubjects = useMemo(() => {
    const subjects = books.map(book => book.subject).filter(Boolean);
    return [...new Set(subjects)].sort();
  }, [books]);

  const uniqueTags = useMemo(() => {
    const tags = books.flatMap(book => book.tags || []).filter(Boolean);
    return [...new Set(tags)].sort();
  }, [books]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    dispatch(setFilters({ [key]: value }));
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    onSearchChange('');
  }, [dispatch, onSearchChange]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.subject) count++;
    if (filters.priority) count++;
    if (filters.status) count++;
    if (searchTerm) count++;
    return count;
  }, [filters, searchTerm]);

  const sortOptions = [
    { value: 'title', label: 'Title' },
    { value: 'subject', label: 'Subject' },
    { value: 'progress', label: 'Progress' },
    { value: 'priority', label: 'Priority' },
    { value: 'timeSpent', label: 'Study Time' },
    { value: 'createdAt', label: 'Date Added' },
    { value: 'averageTestScore', label: 'Test Score' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'needs_revision', label: 'Needs Revision' },
  ];

  const smartFilters = [
    {
      id: 'high_priority',
      label: 'High Priority',
      icon: Target,
      filter: () => handleFilterChange('priority', 'high'),
      active: filters.priority === 'high',
    },
    {
      id: 'needs_attention',
      label: 'Needs Attention',
      icon: Clock,
      filter: () => {
        // This would filter books with low progress or overdue revisions
        // For now, we'll use priority as a proxy
        handleFilterChange('priority', 'high');
      },
      active: false,
    },
    {
      id: 'recently_active',
      label: 'Recently Active',
      icon: BookOpen,
      filter: () => onSortChange('createdAt'),
      active: sortBy === 'createdAt',
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books by title, author, or subject..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Priority Filter Buttons - Visible and Useful */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={filters.priority === '' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('priority', '')}
              className="text-xs"
            >
              All
            </Button>
            <Button
              variant={filters.priority === 'high' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('priority', 'high')}
              className="text-xs"
            >
              High
            </Button>
            <Button
              variant={filters.priority === 'medium' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('priority', 'medium')}
              className="text-xs"
            >
              Medium
            </Button>
            <Button
              variant={filters.priority === 'low' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleFilterChange('priority', 'low')}
              className="text-xs"
            >
              Low
            </Button>
          </div>

          {/* Subject Filter - Only if needed */}
          {uniqueSubjects.length > 1 && (
            <Select
              value={filters.subject || "all_subjects"}
              onValueChange={(value) => handleFilterChange('subject', value === "all_subjects" ? "" : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_subjects">All Subjects</SelectItem>
                {uniqueSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear Filters if any active */}
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Search: "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.subject && (
            <Badge variant="secondary" className="text-xs">
              Subject: {filters.subject}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleFilterChange('subject', '')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="secondary" className="text-xs">
              Priority: {filters.priority}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleFilterChange('priority', '')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="text-xs">
              Status: {filters.status}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleFilterChange('status', '')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Removed smart filters as they were not useful */}
    </div>
  );
};

export default SearchAndFilters;
