import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Trash2,
  Edit,
  Link
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  fetchSyllabus, 
  fetchSyllabusStats,
  fetchRecommendations,
  createSyllabusItem,
  updateSyllabusItem,
  deleteSyllabusItem,
  bulkUpdateSyllabus,
  toggleItemExpansion,
  toggleItemSelection,
  clearSelection,
  setFilters,
  clearFilters,
  updateItemStatusOptimistic
} from '@/redux/slices/syllabusSlice';
import { SyllabusItem } from '@/api/syllabusApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const SyllabusTracker: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const { 
    items, 
    stats, 
    recommendations,
    selectedItems,
    isLoading, 
    statsLoading,
    recommendationsLoading,
    error,
    filters,
    expandedItems 
  } = useAppSelector((state) => state.syllabus);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<SyllabusItem | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    title: '',
    description: '',
    subject: '',
    unit: '',
    topic: '',
    subtopic: '',
    level: 1,
    parentId: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedHours: 0,
  });

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchSyllabus(filters));
    dispatch(fetchSyllabusStats({}));
    dispatch(fetchRecommendations(5));
  }, [dispatch, filters]);

  // Status color mapping
  const getStatusColor = (status: SyllabusItem['status']) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_revision': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: SyllabusItem['status']) => {
    switch (status) {
      case 'not_started': return AlertCircle;
      case 'in_progress': return Clock;
      case 'completed': return CheckCircle2;
      case 'needs_revision': return RotateCcw;
      default: return AlertCircle;
    }
  };

  const getPriorityColor = (priority: SyllabusItem['priority']) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-600';
      case 'medium': return 'bg-blue-100 text-blue-600';
      case 'high': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Calculate completion percentage for an item and its children
  const calculateCompletion = (item: SyllabusItem): number => {
    if (!item.children || item.children.length === 0) {
      return item.status === 'completed' ? 100 : 0;
    }
    
    const completedChildren = item.children.filter(child => 
      calculateCompletion(child) === 100
    ).length;
    
    return Math.round((completedChildren / item.children.length) * 100);
  };

  // Handle status update
  const handleStatusUpdate = async (item: SyllabusItem, newStatus: SyllabusItem['status']) => {
    try {
      // Optimistic update
      dispatch(updateItemStatusOptimistic({ id: item._id, status: newStatus }));
      
      await dispatch(updateSyllabusItem({ 
        id: item._id, 
        data: { status: newStatus } 
      })).unwrap();
      
      toast({ title: 'Status updated successfully' });
      
      // Refresh data to get updated parent statuses
      dispatch(fetchSyllabus(filters));
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to update status',
        description: error as string
      });
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) {
      toast({ 
        variant: 'destructive', 
        title: 'No items selected',
        description: 'Please select items to perform bulk actions.'
      });
      return;
    }

    try {
      let actionData = {};
      
      if (action === 'set_priority_high') {
        actionData = { priority: 'high' };
        action = 'set_priority';
      } else if (action === 'add_hours_1') {
        actionData = { hours: 1 };
        action = 'add_hours';
      }

      await dispatch(bulkUpdateSyllabus({
        items: selectedItems,
        action: action as 'mark_completed' | 'mark_in_progress' | 'set_priority' | 'add_hours',
        actionData
      })).unwrap();

      toast({ title: `Updated ${selectedItems.length} items successfully` });
      dispatch(clearSelection());
      dispatch(fetchSyllabus(filters));
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Bulk action failed',
        description: error as string
      });
    }
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await dispatch(updateSyllabusItem({
          id: editingItem._id,
          data: newItemForm
        })).unwrap();
        toast({ title: 'Item updated successfully' });
        setEditingItem(null);
      } else {
        await dispatch(createSyllabusItem(newItemForm)).unwrap();
        toast({ title: 'Item created successfully' });
      }
      
      setShowAddDialog(false);
      resetForm();
      dispatch(fetchSyllabus(filters));
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: editingItem ? 'Failed to update item' : 'Failed to create item',
        description: error as string
      });
    }
  };

  const resetForm = () => {
    setNewItemForm({
      title: '',
      description: '',
      subject: '',
      unit: '',
      topic: '',
      subtopic: '',
      level: 1,
      parentId: '',
      priority: 'medium',
      estimatedHours: 0,
    });
  };

  // Render syllabus item
  const renderSyllabusItem = (item: SyllabusItem, depth: number = 0) => {
    const isExpanded = expandedItems.has(item._id);
    const isSelected = selectedItems.includes(item._id);
    const hasChildren = item.children && item.children.length > 0;
    const completion = calculateCompletion(item);
    const StatusIcon = getStatusIcon(item.status);

    return (
      <motion.div
        key={item._id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-1"
      >
        <div
          className={`group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
            isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Expansion toggle */}
          <button
            onClick={() => dispatch(toggleItemExpansion(item._id))}
            className={`p-1 rounded-md hover:bg-gray-100 transition-colors ${
              hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {hasChildren && (
              isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {/* Selection checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => dispatch(toggleItemSelection(item._id))}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
              
              {/* Level indicator */}
              <Badge variant="outline" className="text-xs">
                Level {item.level}
              </Badge>
              
              {/* Priority badge */}
              <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                {item.priority}
              </Badge>
            </div>
            
            {item.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{item.subject}</span>
              {item.unit && <span>• {item.unit}</span>}
              {item.topic && <span>• {item.topic}</span>}
              {item.estimatedHours > 0 && (
                <span>• Est: {item.estimatedHours}h</span>
              )}
              {item.actualHours > 0 && (
                <span>• Actual: {item.actualHours}h</span>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="w-20">
              <Progress value={completion} className="h-2" />
            </div>
            <span className="text-xs font-medium text-gray-600 w-10">
              {completion}%
            </span>
          </div>

          {/* Status selector */}
          <Select
            value={item.status}
            onValueChange={(value) => handleStatusUpdate(item, value as SyllabusItem['status'])}
          >
            <SelectTrigger className={`w-32 h-8 text-xs ${getStatusColor(item.status)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="needs_revision">Needs Revision</SelectItem>
            </SelectContent>
          </Select>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setEditingItem(item);
                setNewItemForm({
                  title: item.title,
                  description: item.description || '',
                  subject: item.subject,
                  unit: item.unit || '',
                  topic: item.topic || '',
                  subtopic: item.subtopic || '',
                  level: item.level,
                  parentId: item.parentId || '',
                  priority: item.priority,
                  estimatedHours: item.estimatedHours,
                });
                setShowAddDialog(true);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setNewItemForm({
                  ...newItemForm,
                  parentId: item._id,
                  subject: item.subject,
                  unit: item.unit || '',
                  topic: item.topic || '',
                  level: Math.min(item.level + 1, 4),
                });
                setShowAddDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Child
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => dispatch(deleteSyllabusItem(item._id))}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1"
            >
              {item.children!.map(child => renderSyllabusItem(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Filter and search functionality
  const filteredItems = useMemo(() => {
    return items; // Filtering is handled on the backend
  }, [items]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Syllabus Tracker</h1>
          <p className="text-gray-600 mt-1">
            Organize and track your exam syllabus progress
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Actions ({selectedItems.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('mark_completed')}>
                  Mark as Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('mark_in_progress')}>
                  Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('set_priority_high')}>
                  Set High Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('add_hours_1')}>
                  Add 1 Hour
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Syllabus Item' : 'Add New Syllabus Item'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newItemForm.title}
                    onChange={(e) => setNewItemForm({ ...newItemForm, title: e.target.value })}
                    placeholder="Enter item title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newItemForm.description}
                    onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={newItemForm.subject}
                      onChange={(e) => setNewItemForm({ ...newItemForm, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={newItemForm.level.toString()}
                      onValueChange={(value) => setNewItemForm({ ...newItemForm, level: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Subject</SelectItem>
                        <SelectItem value="2">Unit</SelectItem>
                        <SelectItem value="3">Topic</SelectItem>
                        <SelectItem value="4">Subtopic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newItemForm.priority}
                      onValueChange={(value) => setNewItemForm({ ...newItemForm, priority: value as 'low' | 'medium' | 'high' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="0"
                      value={newItemForm.estimatedHours}
                      onChange={(e) => setNewItemForm({ ...newItemForm, estimatedHours: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {editingItem ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{stats.overall.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{stats.overall.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion %</p>
                  <p className="text-2xl font-bold">{stats.overall.completionPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Hours Studied</p>
                  <p className="text-2xl font-bold">{stats.overall.totalActualHours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search syllabus items..."
                value={filters.search}
                onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.subject}
              onValueChange={(value) => dispatch(setFilters({ subject: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {stats?.subjects.map(subject => (
                  <SelectItem key={subject._id} value={subject._id}>
                    {subject._id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => dispatch(setFilters({ status: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="needs_revision">Needs Revision</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => dispatch(setFilters({ priority: value }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => dispatch(clearFilters())}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Syllabus Tree */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading syllabus...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Syllabus Items</h3>
              <p className="text-gray-600 mb-4">
                Start building your syllabus by adding subjects and topics.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => renderSyllabusItem(item))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Study Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map(item => (
                <div key={item._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(item, 'in_progress')}
                    >
                      Start Studying
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SyllabusTracker;
