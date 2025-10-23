import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Book,
  Award,
  RefreshCw,
  Plus,
  Edit,
  Save,
  X,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Circle,
  Trash2,
  PlusCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Book as BookType, Chapter } from '@/redux/slices/bookSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  updateChapter, 
  addTestToChapter, 
  addRevisionToChapter,
  addChapterToBook,
  removeChapterFromBook,
  selectBook,
  updateChapterStatusOptimistic
} from '@/redux/slices/bookSlice';
import { useToast } from '@/hooks/use-toast';

interface BookDetailModalProps {
  book: BookType | null;
  isOpen: boolean;
  onClose: () => void;
}

const BookDetailModal = ({ book, isOpen, onClose }: BookDetailModalProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Use selectedBook from Redux state for real-time updates
  const selectedBook = useAppSelector(state => state.books.selectedBook);
  
  // Use selectedBook if available, otherwise fall back to prop
  const currentBook = selectedBook && selectedBook.id === book?.id ? selectedBook : book;
  const [activeTab, setActiveTab] = useState('overview');
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [isLoadingAddChapter, setIsLoadingAddChapter] = useState(false);
  const [isLoadingUpdateChapter, setIsLoadingUpdateChapter] = useState(false);
  const [isLoadingDeleteChapter, setIsLoadingDeleteChapter] = useState<number | null>(null);
  const [chapterForm, setChapterForm] = useState({
    name: '',
    status: 'not_started' as Chapter['status'],
    priority: 'medium' as Chapter['priority'],
    notes: ''
  });
  const [newChapterForm, setNewChapterForm] = useState({
    name: '',
    priority: 'medium' as Chapter['priority'],
    notes: ''
  });

  useEffect(() => {
    if (book && isOpen) {
      dispatch(selectBook(book));
    }
  }, [book, isOpen, dispatch]);

  const handleUpdateChapter = async (chapterIndex: number) => {
    if (!currentBook) return;
    
    setIsLoadingUpdateChapter(true);
    try {
      await dispatch(updateChapter({
        bookId: currentBook.id,
        chapterIndex,
        data: chapterForm
      })).unwrap();
      
      setEditingChapter(null);
      toast({ 
        title: 'Chapter updated successfully',
        description: `"${chapterForm.name}" has been updated.`
      });
    } catch (error) {
      console.error('Update chapter error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again later.';
      toast({ 
        variant: 'destructive', 
        title: 'Failed to update chapter',
        description: errorMessage
      });
    } finally {
      setIsLoadingUpdateChapter(false);
    }
  };

  const handleAddChapter = async () => {
    if (!currentBook || !newChapterForm.name.trim()) {
      toast({ 
        variant: 'destructive', 
        title: 'Chapter name is required',
        description: 'Please enter a name for the chapter.'
      });
      return;
    }
    
    setIsLoadingAddChapter(true);
    try {
      await dispatch(addChapterToBook({
        bookId: currentBook.id,
        chapterData: {
          name: newChapterForm.name.trim(),
          status: 'not_started',
          priority: newChapterForm.priority,
          timeSpent: 0,
          estimatedTime: 0,
          notes: newChapterForm.notes || '',
          tests: [],
          revisions: [],
          linkedSyllabusItems: []
        }
      })).unwrap();
      
      setNewChapterForm({
        name: '',
        priority: 'medium',
        notes: ''
      });
      setIsAddingChapter(false);
      
      toast({ 
        title: 'Chapter added successfully',
        description: `"${newChapterForm.name}" has been added to your book.`
      });
    } catch (error) {
      console.error('Add chapter error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again later.';
      toast({ 
        variant: 'destructive', 
        title: 'Failed to add chapter',
        description: errorMessage
      });
    } finally {
      setIsLoadingAddChapter(false);
    }
  };

  const handleRemoveChapter = async (chapterIndex: number) => {
    if (!currentBook) return;
    
    const chapterName = currentBook.chapters[chapterIndex]?.name;
    setIsLoadingDeleteChapter(chapterIndex);
    
    try {
      await dispatch(removeChapterFromBook({
        bookId: currentBook.id,
        chapterIndex
      })).unwrap();
      
      toast({ 
        title: 'Chapter removed successfully',
        description: `"${chapterName}" has been removed from your book.`
      });
    } catch (error: unknown) {
      const typedError = error as { message?: string; response?: { data?: { message?: string } } };
      let errorMessage = 'Please try again later.';
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (typedError?.message) {
        errorMessage = typedError.message;
      } else if (typedError?.response?.data?.message) {
        errorMessage = typedError.response.data.message;
      }
      
      toast({ 
        variant: 'destructive', 
        title: 'Failed to remove chapter',
        description: `Error: ${errorMessage}`
      });
    } finally {
      setIsLoadingDeleteChapter(null);
    }
  };

  const getPriorityColor = (priority: Chapter['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const safeNumber = (value: number | undefined) => value || 0;

  const handleRemoveTest = async (chapterIndex: number, chapter: Chapter) => {
    if (!currentBook || !chapter.tests || chapter.tests.length === 0) return;

    try {
      // Optimistic update - immediately update the UI
      const updatedChapter = {
        ...chapter,
        tests: chapter.tests.slice(0, -1)
      };
      
      // Update Redux state immediately for instant UI feedback
      const updatedBook = {
        ...currentBook,
        chapters: currentBook.chapters.map((ch, idx) => 
          idx === chapterIndex ? updatedChapter : ch
        )
      };
      dispatch(selectBook(updatedBook));
      
      // Then sync with backend
      await dispatch(updateChapter({
        bookId: currentBook.id,
        chapterIndex,
        data: updatedChapter
      })).unwrap();
      
      toast({
        title: 'Test removed',
        description: `Test count updated for "${chapter.name}".`
      });
    } catch (error) {
      console.error('Remove test error:', error);
      // Revert optimistic update on error
      dispatch(selectBook(currentBook));
      toast({
        variant: 'destructive',
        title: 'Failed to remove test',
        description: 'Please try again later.'
      });
    }
  };

  const handleRemoveRevision = async (chapterIndex: number, chapter: Chapter) => {
    if (!currentBook || !chapter.revisions || chapter.revisions.length === 0) return;

    try {
      // Optimistic update - immediately update the UI
      const updatedChapter = {
        ...chapter,
        revisions: chapter.revisions.slice(0, -1)
      };
      
      // Update Redux state immediately for instant UI feedback
      const updatedBook = {
        ...currentBook,
        chapters: currentBook.chapters.map((ch, idx) => 
          idx === chapterIndex ? updatedChapter : ch
        )
      };
      dispatch(selectBook(updatedBook));
      
      // Then sync with backend
      await dispatch(updateChapter({
        bookId: currentBook.id,
        chapterIndex,
        data: updatedChapter
      })).unwrap();
      
      toast({
        title: 'Revision removed',
        description: `Revision count updated for "${chapter.name}".`
      });
    } catch (error) {
      console.error('Remove revision error:', error);
      // Revert optimistic update on error
      dispatch(selectBook(currentBook));
      toast({
        variant: 'destructive',
        title: 'Failed to remove revision',
        description: 'Please try again later.'
      });
    }
  };

  if (!currentBook) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            {currentBook.title}
          </DialogTitle>
          <DialogDescription>
            Manage your book chapters, track progress, and view analytics for {currentBook.title}.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-4">
              {/* Book Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Subject Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Subject</Label>
                      <p className="text-sm text-muted-foreground">{currentBook.subject}</p>
                    </div>
                    {currentBook.author && (
                      <div>
                        <Label className="text-sm font-medium">Author</Label>
                        <p className="text-sm text-muted-foreground">{currentBook.author}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium">Priority</Label>
                      <Badge className={`${getPriorityColor(currentBook.priority)} mt-1`}>
                        {currentBook.priority}
                      </Badge>
                    </div>
                  </div>
                  {currentBook.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm text-muted-foreground">{currentBook.notes}</p>
                    </div>
                  )}
                  {currentBook.tags && currentBook.tags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentBook.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span className="font-medium">
                        {safeNumber(currentBook.completedChapters)} / {safeNumber(currentBook.totalChapters)} chapters
                      </span>
                    </div>
                    <Progress value={safeNumber(currentBook.progressPercentage)} className="h-3" />
                    <p className="text-xs text-muted-foreground">
                      {safeNumber(currentBook.progressPercentage)}% completed
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                      <BookOpen className="h-4 w-4 mx-auto text-muted-foreground" />
                      <div className="text-lg font-semibold">
                        {safeNumber(currentBook.completedChapters)}
                      </div>
                      <div className="text-xs text-muted-foreground">Completed Topics</div>
                    </div>
                    <div className="space-y-1">
                      <AlertTriangle className="h-4 w-4 mx-auto text-red-500" />
                      <div className="text-lg font-semibold text-red-600">
                        {currentBook.chapters?.filter(c => c.status === 'needs_revision').length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Need Revision</div>
                    </div>
                    <div className="space-y-1">
                      <Award className="h-4 w-4 mx-auto text-blue-500" />
                      <div className="text-lg font-semibold text-blue-600">
                        {currentBook.chapters?.reduce((total, chapter) => total + (chapter.tests?.length || 0), 0) || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Tests</div>
                    </div>
                    <div className="space-y-1">
                      <RefreshCw className="h-4 w-4 mx-auto text-orange-500" />
                      <div className="text-lg font-semibold text-orange-600">
                        {currentBook.chapters?.reduce((total, chapter) => total + (chapter.revisions?.length || 0), 0) || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Revisions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chapters" className="space-y-4">
              {/* Add Chapter Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Topics ({currentBook.chapters?.length || 0})
                </h3>
                <Button 
                  onClick={() => setIsAddingChapter(true)}
                  className="gap-2"
                  disabled={isAddingChapter || isLoadingAddChapter}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Topic
                </Button>
              </div>

              {/* Add New Chapter Form */}
              {isAddingChapter && (
                <Card className="border-2 border-dashed border-primary/20">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Label>Topic Name *</Label>
                        <Input
                          value={newChapterForm.name}
                          onChange={(e) => setNewChapterForm({...newChapterForm, name: e.target.value})}
                          placeholder="Enter topic name..."
                          autoFocus
                          disabled={isLoadingAddChapter}
                        />
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Select
                          value={newChapterForm.priority}
                          onValueChange={(value) => setNewChapterForm({...newChapterForm, priority: value as Chapter['priority']})}
                          disabled={isLoadingAddChapter}
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
                      <div>
                        <Label>Notes (optional)</Label>
                        <Textarea
                          value={newChapterForm.notes}
                          onChange={(e) => setNewChapterForm({...newChapterForm, notes: e.target.value})}
                          placeholder="Add any notes about this topic..."
                          rows={2}
                          disabled={isLoadingAddChapter}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleAddChapter} 
                          className="gap-2"
                          disabled={isLoadingAddChapter || !newChapterForm.name.trim()}
                        >
                          {isLoadingAddChapter ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          {isLoadingAddChapter ? 'Adding...' : 'Add Topic'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingChapter(false);
                            setNewChapterForm({
                              name: '',
                              priority: 'medium',
                              notes: ''
                            });
                          }}
                          disabled={isLoadingAddChapter}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Existing Chapters */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {currentBook.chapters && currentBook.chapters.length > 0 ? (
                  currentBook.chapters.map((chapter, index) => (
                    <Card key={`${chapter.name}-${index}`} className="transition-all hover:shadow-sm">
                      <CardContent className="p-3">
                        {editingChapter === index ? (
                          <div className="space-y-3">
                            <Input
                              value={chapterForm.name}
                              onChange={(e) => setChapterForm({...chapterForm, name: e.target.value})}
                              placeholder="Chapter name"
                              disabled={isLoadingUpdateChapter}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Select
                                value={chapterForm.status}
                                onValueChange={(value) => setChapterForm({...chapterForm, status: value as Chapter['status']})}
                                disabled={isLoadingUpdateChapter}
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
                              <Select
                                value={chapterForm.priority}
                                onValueChange={(value) => setChapterForm({...chapterForm, priority: value as Chapter['priority']})}
                                disabled={isLoadingUpdateChapter}
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
                            <Textarea
                              value={chapterForm.notes}
                              onChange={(e) => setChapterForm({...chapterForm, notes: e.target.value})}
                              placeholder="Chapter notes..."
                              disabled={isLoadingUpdateChapter}
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleUpdateChapter(index)}
                                disabled={isLoadingUpdateChapter}
                              >
                                {isLoadingUpdateChapter ? (
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3 mr-1" />
                                )}
                                {isLoadingUpdateChapter ? 'Saving...' : 'Save'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingChapter(null)}
                                disabled={isLoadingUpdateChapter}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {/* Chapter Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={async () => {
                                    const newStatus = chapter.status === 'completed' ? 'not_started' : 'completed';
                                    
                                    // Optimistic update for immediate UI feedback
                                    dispatch(updateChapterStatusOptimistic({
                                      bookId: currentBook.id,
                                      chapterIndex: index,
                                      status: newStatus
                                    }));
                                    
                                    try {
                                      await dispatch(updateChapter({
                                        bookId: currentBook.id,
                                        chapterIndex: index,
                                        data: { 
                                          ...chapter,
                                          status: newStatus
                                        }
                                      })).unwrap();
                                      
                                      toast({
                                        title: newStatus === 'completed' ? 'Topic completed!' : 'Topic marked as not started',
                                        description: `"${chapter.name}" status updated.`
                                      });
                                    } catch (error) {
                                      // Revert optimistic update on error
                                      dispatch(updateChapterStatusOptimistic({
                                        bookId: currentBook.id,
                                        chapterIndex: index,
                                        status: chapter.status
                                      }));
                                      
                                      toast({
                                        variant: 'destructive',
                                        title: 'Failed to update topic',
                                        description: 'Please try again later.'
                                      });
                                    }
                                  }}
                                  title={chapter.status === 'completed' ? 'Mark as not completed' : 'Mark as completed'}
                                >
                                  {chapter.status === 'completed' ? 
                                    <CheckCircle className="h-5 w-5 text-green-600" /> : 
                                    <Circle className="h-5 w-5 text-gray-400" />
                                  }
                                </Button>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-medium text-sm truncate ${chapter.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                    {chapter.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      className={`${getPriorityColor(chapter.priority)} text-xs`}
                                      variant="outline"
                                    >
                                      {chapter.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className={`h-8 w-8 p-0 ${chapter.status === 'needs_revision' 
                                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                  }`}
                                  onClick={async () => {
                                    // Independent revision flag using notes field to store completion state
                                    let newStatus;
                                    let updatedNotes = chapter.notes || '';
                                    
                                    if (chapter.status === 'needs_revision') {
                                      // If currently needs revision, check if it was completed before
                                      if (updatedNotes.includes('[WAS_COMPLETED]')) {
                                        newStatus = 'completed';
                                        updatedNotes = updatedNotes.replace('[WAS_COMPLETED]', '').trim();
                                      } else {
                                        newStatus = 'not_started';
                                      }
                                    } else {
                                      // Mark for revision, preserve completion status
                                      newStatus = 'needs_revision';
                                      if (chapter.status === 'completed') {
                                        updatedNotes = (updatedNotes + ' [WAS_COMPLETED]').trim();
                                      }
                                    }
                                    
                                    const updatedChapter = {
                                      ...chapter,
                                      status: newStatus,
                                      notes: updatedNotes
                                    };
                                    
                                    try {
                                      await dispatch(updateChapter({
                                        bookId: currentBook.id,
                                        chapterIndex: index,
                                        data: updatedChapter
                                      })).unwrap();
                                      
                                      toast({
                                        title: newStatus === 'needs_revision' ? 'Topic flagged for revision!' : 'Revision flag removed',
                                        description: `"${chapter.name}" ${newStatus === 'needs_revision' ? 'needs review' : 'revision flag cleared'}.`
                                      });
                                    } catch (error) {
                                      toast({
                                        variant: 'destructive',
                                        title: 'Failed to update topic',
                                        description: 'Please try again later.'
                                      });
                                    }
                                  }}
                                  title={chapter.status === 'needs_revision' ? 'Remove revision flag' : 'Flag for revision'}
                                >
                                  <AlertTriangle className={`h-4 w-4 ${chapter.status === 'needs_revision' ? 'text-red-600 fill-current' : ''}`} />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setChapterForm({
                                      name: chapter.name,
                                      status: chapter.status,
                                      priority: chapter.priority,
                                      notes: chapter.notes || ''
                                    });
                                    setEditingChapter(index);
                                  }}
                                  title="Edit topic"
                                  disabled={isLoadingDeleteChapter === index}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${chapter.name}"? This action cannot be undone.`)) {
                                      handleRemoveChapter(index);
                                    }
                                  }}
                                  title="Delete topic"
                                  disabled={isLoadingDeleteChapter === index}
                                >
                                  {isLoadingDeleteChapter === index ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Test and Revision Tracking */}
                            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                              {/* Tests Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium text-muted-foreground">Tests Taken</Label>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0 rounded-full"
                                      onClick={async () => {
                                        try {
                                          await dispatch(addTestToChapter({
                                            bookId: currentBook.id,
                                            chapterIndex: index,
                                            testData: {
                                              testName: `Test ${(chapter.tests?.length || 0) + 1}`,
                                              score: 0,
                                              totalMarks: 100,
                                              notes: ''
                                            }
                                          })).unwrap();
                                          
                                          toast({
                                            title: 'Test added',
                                            description: `Test count updated for "${chapter.name}".`
                                          });
                                        } catch (error) {
                                          toast({
                                            variant: 'destructive',
                                            title: 'Failed to add test',
                                            description: 'Please try again later.'
                                          });
                                        }
                                      }}
                                      title="Add test"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    {chapter.tests && chapter.tests.length > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0 rounded-full"
                                        onClick={() => handleRemoveTest(index, chapter)}
                                        title="Remove test"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center justify-center py-2 bg-blue-50 rounded-md">
                                  <Award className="h-4 w-4 text-blue-600 mr-2" />
                                  <span className="text-sm font-semibold text-blue-700">
                                    {chapter.tests?.length || 0}
                                  </span>
                                </div>
                              </div>

                              {/* Revisions Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium text-muted-foreground">Revisions Done</Label>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0 rounded-full"
                                      onClick={async () => {
                                        try {
                                          await dispatch(addRevisionToChapter({
                                            bookId: currentBook.id,
                                            chapterIndex: index,
                                            revisionData: {
                                              timeSpent: 0,
                                              notes: '',
                                              understanding: 'good'
                                            }
                                          })).unwrap();
                                          
                                          toast({
                                            title: 'Revision added',
                                            description: `Revision count updated for "${chapter.name}".`
                                          });
                                        } catch (error) {
                                          toast({
                                            variant: 'destructive',
                                            title: 'Failed to add revision',
                                            description: 'Please try again later.'
                                          });
                                        }
                                      }}
                                      title="Add revision"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    {chapter.revisions && chapter.revisions.length > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0 rounded-full"
                                        onClick={() => handleRemoveRevision(index, chapter)}
                                        title="Remove revision"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center justify-center py-2 bg-orange-50 rounded-md">
                                  <RefreshCw className="h-4 w-4 text-orange-600 mr-2" />
                                  <span className="text-sm font-semibold text-orange-700">
                                    {chapter.revisions?.length || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : !isAddingChapter ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No chapters yet</h3>
                      <p className="text-muted-foreground mb-4">Start organizing your study material by adding your first chapter.</p>
                      <Button onClick={() => setIsAddingChapter(true)} className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Add Your First Chapter
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Basic Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Total Topics</span>
                        <span className="font-semibold">{currentBook.totalChapters || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed Topics</span>
                        <span className="font-semibold">{currentBook.completedChapters || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Progress</span>
                        <span className="font-semibold">{currentBook.progressPercentage || 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Subject Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Subject</span>
                        <span className="font-semibold">{currentBook.subject}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Priority</span>
                        <Badge className={`${getPriorityColor(currentBook.priority)} text-xs`}>
                          {currentBook.priority}
                        </Badge>
                      </div>
                      {currentBook.author && (
                        <div className="flex justify-between">
                          <span>Author</span>
                          <span className="font-semibold">{currentBook.author}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Created</span>
                        <span className="font-semibold">
                          {new Date(currentBook.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BookDetailModal;
