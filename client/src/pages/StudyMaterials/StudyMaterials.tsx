import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Search, 
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Edit,
  Trash2,
  TestTube,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Filter,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Link,
  Library,
  FileText
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  fetchBooks, 
  addBook, 
  updateBook, 
  deleteBook,
  updateChapter,
  addTestToChapter,
  addRevisionToChapter,
  updateChapterStatusOptimistic,
  setFilters as setBooksFilters,
  clearFilters as clearBooksFilters
} from '@/redux/slices/bookSlice';

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
  setFilters as setSyllabusFilters,
  clearFilters as clearSyllabusFilters,
  updateItemStatusOptimistic
} from '@/redux/slices/syllabusSlice';

import { SyllabusItem } from '@/api/syllabusApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import ProgressBar from '@/components/ProgressBar';

import type { Book, Chapter, Test, Revision } from '@/redux/slices/bookSlice';

const StudyMaterials: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Redux state
  const { 
    books, 
    isLoading: booksLoading, 
    filters: booksFilters 
  } = useAppSelector((state) => state.books);

  const { 
    items: syllabusItems, 
    stats: syllabusStats, 
    recommendations,
    selectedItems,
    isLoading: syllabusLoading, 
    filters: syllabusFilters,
    expandedItems 
  } = useAppSelector((state) => state.syllabus);

  // Local state
  const [activeTab, setActiveTab] = useState('books');
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showAddSyllabusDialog, setShowAddSyllabusDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingSyllabusItem, setEditingSyllabusItem] = useState<SyllabusItem | null>(null);
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<{ bookId: string; chapterIndex: number } | null>(null);

  // Form states
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    subject: '',
    isbn: '',
    edition: '',
    publishedYear: '',
    totalChapters: 1,
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[]
  });

  const [chapterForm, setChapterForm] = useState({
    name: '',
    status: 'not_started' as Chapter['status'],
    priority: 'medium' as Chapter['priority'],
    timeSpent: 0,
    estimatedTime: 0,
    notes: ''
  });

  const [testForm, setTestForm] = useState({
    testName: '',
    score: 0,
    totalMarks: 100,
    notes: ''
  });

  const [revisionForm, setRevisionForm] = useState({
    timeSpent: 0,
    notes: '',
    understanding: 'fair' as Revision['understanding']
  });

  // Syllabus form state
  const [syllabusForm, setSyllabusForm] = useState({
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
    dispatch(fetchBooks(booksFilters));
    dispatch(fetchSyllabus(syllabusFilters));
    dispatch(fetchSyllabusStats({}));
    dispatch(fetchRecommendations(5));
  }, [dispatch, booksFilters, syllabusFilters]);

  // Helper functions
  const getStatusColor = (status: Chapter['status']) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_revision': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Chapter['status']) => {
    switch (status) {
      case 'not_started': return AlertCircle;
      case 'in_progress': return Clock;
      case 'completed': return CheckCircle2;
      case 'needs_revision': return RotateCcw;
      default: return AlertCircle;
    }
  };

  const getPriorityColor = (priority: Chapter['priority'] | Book['priority']) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-600';
      case 'medium': return 'bg-blue-100 text-blue-600';
      case 'high': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Event handlers
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookData = {
        ...bookForm,
        publishedYear: bookForm.publishedYear ? parseInt(bookForm.publishedYear) : undefined
      };

      if (editingBook) {
        await dispatch(updateBook({ id: editingBook.id, data: bookData }));
        toast({ title: 'Book updated successfully' });
      } else {
        await dispatch(addBook(bookData));
        toast({ title: 'Book added successfully' });
      }
      
      setShowAddBookDialog(false);
      resetBookForm();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Operation failed' });
    }
  };

  const handleChapterUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChapter) return;

    try {
      await dispatch(updateChapter({
        bookId: currentChapter.bookId,
        chapterIndex: currentChapter.chapterIndex,
        data: chapterForm
      }));
      
      toast({ title: 'Chapter updated successfully' });
      setShowChapterDialog(false);
      setCurrentChapter(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update chapter' });
    }
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChapter) return;

    try {
      await dispatch(addTestToChapter({
        bookId: currentChapter.bookId,
        chapterIndex: currentChapter.chapterIndex,
        testData: testForm
      }));
      
      toast({ title: 'Test added successfully' });
      setShowTestDialog(false);
      resetTestForm();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to add test' });
    }
  };

  const handleAddRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChapter) return;

    try {
      await dispatch(addRevisionToChapter({
        bookId: currentChapter.bookId,
        chapterIndex: currentChapter.chapterIndex,
        revisionData: revisionForm
      }));
      
      toast({ title: 'Revision recorded successfully' });
      setShowRevisionDialog(false);
      resetRevisionForm();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to record revision' });
    }
  };

  const handleChapterStatusChange = async (bookId: string, chapterIndex: number, status: Chapter['status']) => {
    try {
      // Optimistic update
      dispatch(updateChapterStatusOptimistic({ bookId, chapterIndex, status }));
      
      await dispatch(updateChapter({
        bookId,
        chapterIndex,
        data: { status }
      }));
      
      toast({ title: 'Chapter status updated' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update status' });
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      await dispatch(deleteBook(id));
      toast({ title: 'Book deleted successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete book' });
    }
  };

  // Reset form functions
  const resetBookForm = () => {
    setBookForm({
      title: '',
      author: '',
      subject: '',
      isbn: '',
      edition: '',
      publishedYear: '',
      totalChapters: 1,
      notes: '',
      priority: 'medium',
      tags: []
    });
    setEditingBook(null);
  };

  const resetTestForm = () => {
    setTestForm({
      testName: '',
      score: 0,
      totalMarks: 100,
      notes: ''
    });
  };

  const resetRevisionForm = () => {
    setRevisionForm({
      timeSpent: 0,
      notes: '',
      understanding: 'fair'
    });
  };

  const toggleBookExpansion = (bookId: string) => {
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
    }
    setExpandedBooks(newExpanded);
  };

  const openChapterEdit = (book: Book, chapterIndex: number) => {
    const chapter = book.chapters[chapterIndex];
    setCurrentChapter({ bookId: book.id, chapterIndex });
    setChapterForm({
      name: chapter.name,
      status: chapter.status,
      priority: chapter.priority,
      timeSpent: chapter.timeSpent,
      estimatedTime: chapter.estimatedTime,
      notes: chapter.notes || ''
    });
    setShowChapterDialog(true);
  };

  const openTestDialog = (bookId: string, chapterIndex: number) => {
    setCurrentChapter({ bookId, chapterIndex });
    resetTestForm();
    setShowTestDialog(true);
  };

  const openRevisionDialog = (bookId: string, chapterIndex: number) => {
    setCurrentChapter({ bookId, chapterIndex });
    resetRevisionForm();
    setShowRevisionDialog(true);
  };

  const renderChapter = (book: Book, chapter: Chapter, chapterIndex: number) => {
    const StatusIcon = getStatusIcon(chapter.status);
    const averageScore = chapter.tests.length > 0 
      ? Math.round(chapter.tests.reduce((sum, test) => sum + (test.score / test.totalMarks * 100), 0) / chapter.tests.length)
      : 0;

    return (
      <motion.div
        key={chapter._id || chapterIndex}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="ml-6 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <StatusIcon className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{chapter.name}</h4>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span>Tests: {chapter.tests.length}</span>
                <span>Revisions: {chapter.revisions.length}</span>
                {chapter.tests.length > 0 && (
                  <span>Avg Score: {averageScore}%</span>
                )}
                <span>Time: {chapter.timeSpent}h</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${getPriorityColor(chapter.priority)}`}>
              {chapter.priority}
            </Badge>

            <Select
              value={chapter.status}
              onValueChange={(value) => handleChapterStatusChange(book.id, chapterIndex, value as Chapter['status'])}
            >
              <SelectTrigger className={`w-32 h-8 text-xs ${getStatusColor(chapter.status)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="needs_revision">Needs Revision</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openChapterEdit(book, chapterIndex)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Chapter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openTestDialog(book.id, chapterIndex)}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Add Test
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openRevisionDialog(book.id, chapterIndex)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Add Revision
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderBookCard = (book: Book) => {
    const isExpanded = expandedBooks.has(book.id);
    
    return (
      <Card key={book.id} className="transition-all hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleBookExpansion(book.id)}
                  className="p-1 h-6 w-6"
                >
                  {isExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
                <CardTitle className="text-lg">{book.title}</CardTitle>
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{book.subject}</p>
                {book.author && <p>By {book.author}</p>}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={`text-xs ${getPriorityColor(book.priority)}`}>
                  {book.priority}
                </Badge>
                {book.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingBook(book);
                  setBookForm({
                    title: book.title,
                    author: book.author || '',
                    subject: book.subject,
                    isbn: book.isbn || '',
                    edition: book.edition || '',
                    publishedYear: book.publishedYear?.toString() || '',
                    totalChapters: book.totalChapters,
                    notes: book.notes || '',
                    priority: book.priority,
                    tags: book.tags
                  });
                  setShowAddBookDialog(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteBook(book.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Progress Overview */}
            <div className="space-y-2">
              <ProgressBar
                current={book.completedChapters}
                total={book.totalChapters}
                color="primary"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {book.completedChapters} of {book.totalChapters} chapters
                </span>
                <span className="font-medium">{book.progressPercentage}%</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{book.totalTests || 0}</div>
                <div className="text-xs text-muted-foreground">Tests</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{book.totalRevisions || 0}</div>
                <div className="text-xs text-muted-foreground">Revisions</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{book.totalTimeSpent || 0}h</div>
                <div className="text-xs text-muted-foreground">Time Spent</div>
              </div>
            </div>

            {/* Expanded Chapter View */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-4 border-t"
                >
                  <h4 className="font-medium text-sm text-gray-700 mb-3">Chapters</h4>
                  {book.chapters.map((chapter, index) => 
                    renderChapter(book, chapter, index)
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Syllabus helper functions
  const getSyllabusStatusColor = (status: SyllabusItem['status']) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_revision': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSyllabusStatusIcon = (status: SyllabusItem['status']) => {
    switch (status) {
      case 'not_started': return AlertCircle;
      case 'in_progress': return Clock;
      case 'completed': return CheckCircle2;
      case 'needs_revision': return RotateCcw;
      default: return AlertCircle;
    }
  };

  // Syllabus handlers
  const handleSyllabusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSyllabusItem) {
        await dispatch(updateSyllabusItem({
          id: editingSyllabusItem._id,
          data: syllabusForm
        })).unwrap();
        toast({ title: 'Syllabus item updated successfully' });
        setEditingSyllabusItem(null);
      } else {
        await dispatch(createSyllabusItem(syllabusForm)).unwrap();
        toast({ title: 'Syllabus item created successfully' });
      }
      
      setShowAddSyllabusDialog(false);
      resetSyllabusForm();
      dispatch(fetchSyllabus(syllabusFilters));
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: editingSyllabusItem ? 'Failed to update item' : 'Failed to create item',
        description: error as string
      });
    }
  };

  const resetSyllabusForm = () => {
    setSyllabusForm({
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

  const handleSyllabusStatusUpdate = async (item: SyllabusItem, newStatus: SyllabusItem['status']) => {
    try {
      dispatch(updateItemStatusOptimistic({ id: item._id, status: newStatus }));
      
      await dispatch(updateSyllabusItem({ 
        id: item._id, 
        data: { status: newStatus } 
      })).unwrap();
      
      toast({ title: 'Status updated successfully' });
      dispatch(fetchSyllabus(syllabusFilters));
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to update status',
        description: error as string
      });
    }
  };

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
      dispatch(fetchSyllabus(syllabusFilters));
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Bulk action failed',
        description: error as string
      });
    }
  };

  // Calculate completion percentage for syllabus items
  const calculateCompletion = (item: SyllabusItem): number => {
    if (!item.children || item.children.length === 0) {
      return item.status === 'completed' ? 100 : 0;
    }
    
    const completedChildren = item.children.filter(child => 
      calculateCompletion(child) === 100
    ).length;
    
    return Math.round((completedChildren / item.children.length) * 100);
  };

  // Render syllabus item
  const renderSyllabusItem = (item: SyllabusItem, depth: number = 0) => {
    const isExpanded = expandedItems.includes(item._id);
    const isSelected = selectedItems.includes(item._id);
    const hasChildren = item.children && item.children.length > 0;
    const completion = calculateCompletion(item);
    const StatusIcon = getSyllabusStatusIcon(item.status);

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

          <Checkbox
            checked={isSelected}
            onCheckedChange={() => dispatch(toggleItemSelection(item._id))}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
              
              <Badge variant="outline" className="text-xs">
                Level {item.level}
              </Badge>
              
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

          <div className="flex items-center gap-2">
            <div className="w-20">
              <Progress value={completion} className="h-2" />
            </div>
            <span className="text-xs font-medium text-gray-600 w-10">
              {completion}%
            </span>
          </div>

          <Select
            value={item.status}
            onValueChange={(value) => handleSyllabusStatusUpdate(item, value as SyllabusItem['status'])}
          >
            <SelectTrigger className={`w-32 h-8 text-xs ${getSyllabusStatusColor(item.status)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="needs_revision">Needs Revision</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setEditingSyllabusItem(item);
                setSyllabusForm({
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
                setShowAddSyllabusDialog(true);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSyllabusForm({
                  ...syllabusForm,
                  parentId: item._id,
                  subject: item.subject,
                  unit: item.unit || '',
                  topic: item.topic || '',
                  level: Math.min(item.level + 1, 4),
                });
                setShowAddSyllabusDialog(true);
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Materials & Progress</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your books and syllabus, track progress, tests, and revisions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="books" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Books & Materials
          </TabsTrigger>
          <TabsTrigger value="syllabus" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Syllabus Structure
          </TabsTrigger>
        </TabsList>

        {/* Books Tab */}
        <TabsContent value="books" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Books & Materials</h2>
            <Dialog open={showAddBookDialog} onOpenChange={setShowAddBookDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetBookForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBookSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={bookForm.title}
                        onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        value={bookForm.author}
                        onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={bookForm.subject}
                        onChange={(e) => setBookForm({ ...bookForm, subject: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalChapters">Total Chapters *</Label>
                      <Input
                        id="totalChapters"
                        type="number"
                        min="1"
                        value={bookForm.totalChapters}
                        onChange={(e) => setBookForm({ ...bookForm, totalChapters: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        value={bookForm.isbn}
                        onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edition">Edition</Label>
                      <Input
                        id="edition"
                        value={bookForm.edition}
                        onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publishedYear">Published Year</Label>
                      <Input
                        id="publishedYear"
                        type="number"
                        min="1000"
                        max={new Date().getFullYear()}
                        value={bookForm.publishedYear}
                        onChange={(e) => setBookForm({ ...bookForm, publishedYear: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={bookForm.priority}
                      onValueChange={(value) => setBookForm({ ...bookForm, priority: value as 'low' | 'medium' | 'high' })}
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
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={bookForm.notes}
                      onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddBookDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={booksLoading}>
                      {editingBook ? 'Update Book' : 'Add Book'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search books..."
                    value={booksFilters.subject}
                    onChange={(e) => dispatch(setBooksFilters({ subject: e.target.value }))}
                    className="pl-10"
                  />
                </div>

                <Select
                  value={booksFilters.priority || "all_priority"}
                  onValueChange={(value) => dispatch(setBooksFilters({ priority: value === "all_priority" ? "" : value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_priority">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => dispatch(clearBooksFilters())}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Books Grid */}
          {booksLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading books...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Books Added</h3>
              <p className="text-gray-600 mb-4">
                Start building your study library by adding your first book.
              </p>
              <Button onClick={() => setShowAddBookDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Book
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {books.map(renderBookCard)}
            </div>
          )}
        </TabsContent>

        {/* Syllabus Tab */}
        <TabsContent value="syllabus" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Syllabus Structure</h2>
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

              <Dialog open={showAddSyllabusDialog} onOpenChange={setShowAddSyllabusDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetSyllabusForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSyllabusItem ? 'Edit Syllabus Item' : 'Add New Syllabus Item'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSyllabusSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="syllabusTitle">Title *</Label>
                      <Input
                        id="syllabusTitle"
                        value={syllabusForm.title}
                        onChange={(e) => setSyllabusForm({ ...syllabusForm, title: e.target.value })}
                        placeholder="Enter item title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="syllabusDescription">Description</Label>
                      <Textarea
                        id="syllabusDescription"
                        value={syllabusForm.description}
                        onChange={(e) => setSyllabusForm({ ...syllabusForm, description: e.target.value })}
                        placeholder="Enter description (optional)"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="syllabusSubject">Subject *</Label>
                        <Input
                          id="syllabusSubject"
                          value={syllabusForm.subject}
                          onChange={(e) => setSyllabusForm({ ...syllabusForm, subject: e.target.value })}
                          placeholder="e.g., Mathematics"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="syllabusLevel">Level</Label>
                        <Select
                          value={syllabusForm.level.toString()}
                          onValueChange={(value) => setSyllabusForm({ ...syllabusForm, level: parseInt(value) })}
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
                        <Label htmlFor="syllabusPriority">Priority</Label>
                        <Select
                          value={syllabusForm.priority}
                          onValueChange={(value) => setSyllabusForm({ ...syllabusForm, priority: value as 'low' | 'medium' | 'high' })}
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
                        <Label htmlFor="syllabusEstimatedHours">Estimated Hours</Label>
                        <Input
                          id="syllabusEstimatedHours"
                          type="number"
                          min="0"
                          value={syllabusForm.estimatedHours}
                          onChange={(e) => setSyllabusForm({ ...syllabusForm, estimatedHours: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowAddSyllabusDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={syllabusLoading}>
                        {editingSyllabusItem ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Syllabus Stats */}
          {syllabusStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Items</p>
                      <p className="text-2xl font-bold">{syllabusStats.overall.total}</p>
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
                      <p className="text-2xl font-bold">{syllabusStats.overall.completed}</p>
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
                      <p className="text-2xl font-bold">{syllabusStats.overall.completionPercentage}%</p>
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
                      <p className="text-2xl font-bold">{syllabusStats.overall.totalActualHours}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Syllabus Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search syllabus items..."
                    value={syllabusFilters.search}
                    onChange={(e) => dispatch(setSyllabusFilters({ search: e.target.value }))}
                    className="pl-10"
                  />
                </div>

                <Select
                  value={syllabusFilters.subject || "all_subjects"}
                  onValueChange={(value) => dispatch(setSyllabusFilters({ subject: value === "all_subjects" ? "" : value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_subjects">All Subjects</SelectItem>
                    {syllabusStats?.subjects.map(subject => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject._id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={syllabusFilters.status || "all_status"}
                  onValueChange={(value) => dispatch(setSyllabusFilters({ status: value === "all_status" ? "" : value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_status">All Status</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="needs_revision">Needs Revision</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => dispatch(clearSyllabusFilters())}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Syllabus Tree */}
          <Card>
            <CardContent className="p-6">
              {syllabusLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading syllabus...</p>
                </div>
              ) : syllabusItems.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Syllabus Items</h3>
                  <p className="text-gray-600 mb-4">
                    Start building your syllabus by adding subjects and topics.
                  </p>
                  <Button onClick={() => setShowAddSyllabusDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {syllabusItems.map(item => renderSyllabusItem(item))}
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
                          onClick={() => handleSyllabusStatusUpdate(item, 'in_progress')}
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
        </TabsContent>

      </Tabs>

      {/* Chapter Edit Dialog */}
      <Dialog open={showChapterDialog} onOpenChange={setShowChapterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChapterUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chapterName">Chapter Name</Label>
              <Input
                id="chapterName"
                value={chapterForm.name}
                onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chapterStatus">Status</Label>
                <Select
                  value={chapterForm.status}
                  onValueChange={(value) => setChapterForm({ ...chapterForm, status: value as Chapter['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="needs_revision">Needs Revision</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapterPriority">Priority</Label>
                <Select
                  value={chapterForm.priority}
                  onValueChange={(value) => setChapterForm({ ...chapterForm, priority: value as Chapter['priority'] })}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeSpent">Time Spent (hours)</Label>
                <Input
                  id="timeSpent"
                  type="number"
                  min="0"
                  step="0.5"
                  value={chapterForm.timeSpent}
                  onChange={(e) => setChapterForm({ ...chapterForm, timeSpent: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Estimated Time (hours)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  min="0"
                  step="0.5"
                  value={chapterForm.estimatedTime}
                  onChange={(e) => setChapterForm({ ...chapterForm, estimatedTime: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapterNotes">Notes</Label>
              <Textarea
                id="chapterNotes"
                value={chapterForm.notes}
                onChange={(e) => setChapterForm({ ...chapterForm, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowChapterDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Chapter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Test</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testName">Test Name</Label>
              <Input
                id="testName"
                value={testForm.testName}
                onChange={(e) => setTestForm({ ...testForm, testName: e.target.value })}
                placeholder="e.g., Quiz 1, Mock Test"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  value={testForm.score}
                  onChange={(e) => setTestForm({ ...testForm, score: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  min="1"
                  value={testForm.totalMarks}
                  onChange={(e) => setTestForm({ ...testForm, totalMarks: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testNotes">Notes</Label>
              <Textarea
                id="testNotes"
                value={testForm.notes}
                onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
                rows={3}
                placeholder="Optional notes about the test..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowTestDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Test
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Revision</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRevision} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revisionTime">Time Spent (hours)</Label>
              <Input
                id="revisionTime"
                type="number"
                min="0"
                step="0.5"
                value={revisionForm.timeSpent}
                onChange={(e) => setRevisionForm({ ...revisionForm, timeSpent: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="understanding">Understanding Level</Label>
              <Select
                value={revisionForm.understanding}
                onValueChange={(value) => setRevisionForm({ ...revisionForm, understanding: value as Revision['understanding'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revisionNotes">Revision Notes</Label>
              <Textarea
                id="revisionNotes"
                value={revisionForm.notes}
                onChange={(e) => setRevisionForm({ ...revisionForm, notes: e.target.value })}
                rows={3}
                placeholder="What did you focus on during this revision?"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowRevisionDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Revision
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyMaterials;
