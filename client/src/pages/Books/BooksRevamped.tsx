import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchBooks, updateBook, clearFilters } from '@/redux/slices/bookSlice';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Grid, 
  List, 
  BarChart3, 
  BookOpen,
  Search as SearchIcon,
  Filter,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Book } from '@/redux/slices/bookSlice';

// Import our new components
import BooksOverview from '@/components/Books/BooksOverview';
import SearchAndFilters from '@/components/Books/SearchAndFilters';
import EnhancedBookCard from '@/components/Books/EnhancedBookCard';
import BookDetailModal from '@/components/Books/BookDetailModal';
import BookFormModal from '@/components/Books/BookFormModal';

type ViewMode = 'grid' | 'list' | 'analytics';

const BooksRevamped = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { books, isLoading, filters } = useAppSelector((state) => state.books);

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Fetch books on component mount and when filters change
  useEffect(() => {
    // Only debounce if there's a search term, otherwise fetch immediately
    if (searchTerm) {
      const timer = setTimeout(() => {
        dispatch(fetchBooks(filters));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Immediate fetch for filter changes or initial load
      dispatch(fetchBooks(filters));
    }
  }, [searchTerm, filters, dispatch]);

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = [...books];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchLower) ||
        book.subject.toLowerCase().includes(searchLower) ||
        (book.author && book.author.toLowerCase().includes(searchLower)) ||
        (book.notes && book.notes.toLowerCase().includes(searchLower)) ||
        (book.tags && book.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Apply filters
    if (filters.subject) {
      filtered = filtered.filter(book => 
        book.subject.toLowerCase().includes(filters.subject.toLowerCase())
      );
    }

    if (filters.priority) {
      filtered = filtered.filter(book => book.priority === filters.priority);
    }

    if (filters.status) {
      // Status filtering based on progress
      filtered = filtered.filter(book => {
        switch (filters.status) {
          case 'not_started':
            return book.completedChapters === 0;
          case 'in_progress':
            return book.completedChapters > 0 && book.completedChapters < book.totalChapters;
          case 'completed':
            return book.completedChapters === book.totalChapters;
          case 'needs_revision':
            // Use chapters with needs_revision status if available
            return book.chapters && book.chapters.some(chapter => chapter.status === 'needs_revision');
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (sortBy) {
        case 'title': {
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        }
        case 'subject': {
          aValue = a.subject.toLowerCase();
          bValue = b.subject.toLowerCase();
          break;
        }
        case 'progress': {
          aValue = a.progressPercentage;
          bValue = b.progressPercentage;
          break;
        }
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        }
        case 'timeSpent': {
          aValue = a.totalTimeSpent;
          bValue = b.totalTimeSpent;
          break;
        }
        case 'createdAt': {
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        }
        case 'averageTestScore': {
          aValue = a.averageTestScore;
          bValue = b.averageTestScore;
          break;
        }
        default: {
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
        }
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [books, searchTerm, filters, sortBy, sortOrder]);

  // Handlers
  const handleQuickChapterUpdate = useCallback(async (bookId: string, increment: number) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const newCompletedChapters = Math.max(
      0, 
      Math.min(book.totalChapters, book.completedChapters + increment)
    );

    try {
      await dispatch(updateBook({
        id: bookId,
        data: { 
          ...book,
          completedChapters: newCompletedChapters
        }
      }));
      
      toast({
        title: 'Progress updated!',
        description: `${newCompletedChapters} chapters completed`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update progress'
      });
    }
  }, [books, dispatch, toast]);

  const handleViewDetails = useCallback((book: Book) => {
    setSelectedBook(book);
    setIsDetailModalOpen(true);
  }, []);

  const handleEdit = useCallback((book: Book) => {
    setEditingBook(book);
    setIsFormModalOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingBook(null);
    setIsFormModalOpen(true);
  }, []);

  const handleCloseModals = useCallback(() => {
    setIsDetailModalOpen(false);
    setIsFormModalOpen(false);
    setSelectedBook(null);
    setEditingBook(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    dispatch(clearFilters());
  }, [dispatch]);

  // Loading state
  if (isLoading && books.length === 0) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Subjects</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Manage your subjects and track your learning progress
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <BooksOverview books={books} isLoading={isLoading} />

      {/* Search and Filters */}
      <SearchAndFilters
        books={books}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Content Area */}
      <div className="space-y-4">
          {/* Results Info */}
          {(searchTerm || Object.values(filters).some(f => f)) && (
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <SearchIcon className="h-4 w-4" />
                <span>
                  Showing {filteredAndSortedBooks.length} of {books.length} subjects
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}

          {/* Books Grid/List */}
          {filteredAndSortedBooks.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-4"
            }>
              {filteredAndSortedBooks.map((book) => (
                <EnhancedBookCard
                  key={book.id}
                  book={book}
                  onEdit={handleEdit}
                  onViewDetails={handleViewDetails}
                  onQuickChapterUpdate={handleQuickChapterUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {searchTerm || Object.values(filters).some(f => f) ? (
                <>
                  <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No subjects found</h3>
                  <p className="text-muted-foreground mb-4">
                    No subjects match your current search and filters
                  </p>
                  <Button variant="outline" onClick={handleClearAll}>
                    <X className="h-4 w-4 mr-2" />
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No subjects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your study library by adding your first subject
                  </p>
                  <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Subject
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

      {/* Modals */}
      <BookDetailModal
        book={selectedBook}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModals}
      />

      <BookFormModal
        book={editingBook}
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
      />
    </div>
  );
};

export default BooksRevamped;
