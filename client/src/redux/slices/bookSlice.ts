import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';

export interface Test {
  _id?: string;
  testName: string;
  score: number;
  totalMarks: number;
  testDate: string;
  notes?: string;
}

export interface Revision {
  _id?: string;
  revisionDate: string;
  timeSpent: number;
  notes?: string;
  understanding: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface Chapter {
  _id?: string;
  name: string;
  chapterNumber: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision';
  priority: 'low' | 'medium' | 'high';
  timeSpent: number;
  estimatedTime: number;
  tests: Test[];
  revisions: Revision[];
  notes?: string;
  lastStudiedDate?: string;
  completedAt?: string;
  linkedSyllabusItems: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  subject: string;
  isbn?: string;
  edition?: string;
  publishedYear?: number;
  chapters: Chapter[];
  totalChapters: number;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  isActive: boolean;
  createdAt: string;
  // Virtual fields
  completedChapters: number;
  progressPercentage: number;
  totalTimeSpent: number;
  totalTests: number;
  averageTestScore: number;
  totalRevisions: number;
  chaptersNeedingRevision: number;
  studyRecommendations: number;
}

export interface BookStats {
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
  totalTimeSpent: number;
  totalTests: number;
  averageTestScore: number;
  totalRevisions: number;
  chaptersNeedingRevision: number;
  chapterStatusDistribution: {
    not_started: number;
    in_progress: number;
    completed: number;
    needs_revision: number;
  };
  priorityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface StudyRecommendations {
  nextChaptersToStudy: Chapter[];
  chaptersNeedingRevision: Chapter[];
  weakPerformanceChapters: Chapter[];
}

interface BookState {
  books: Book[];
  selectedBook: Book | null;
  bookStats: BookStats | null;
  studyRecommendations: StudyRecommendations | null;
  isLoading: boolean;
  statsLoading: boolean;
  recommendationsLoading: boolean;
  error: string | null;
  filters: {
    subject: string;
    priority: string;
    status: string;
  };
}

const initialState: BookState = {
  books: [],
  selectedBook: null,
  bookStats: null,
  studyRecommendations: null,
  isLoading: false,
  statsLoading: false,
  recommendationsLoading: false,
  error: null,
  filters: {
    subject: '',
    priority: '',
    status: ''
  }
};

// Async thunks
export const fetchBooks = createAsyncThunk(
  'books/fetchBooks', 
  async (filters: { subject?: string; priority?: string; status?: string } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.status) params.append('status', filters.status);
      
      const response = await axiosInstance.get(`/books?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch books';
      return rejectWithValue((error as { response?: { data?: { message?: string } } })?.response?.data?.message || errorMessage);
    }
  }
);

export const fetchBook = createAsyncThunk(
  'books/fetchBook',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/books/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch book');
    }
  }
);

export const addBook = createAsyncThunk(
  'books/addBook',
  async (bookData: {
    title: string;
    author?: string;
    subject: string;
    isbn?: string;
    edition?: string;
    publishedYear?: number;
    totalChapters: number;
    notes?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    chapters?: Partial<Chapter>[];
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/books', bookData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add book');
    }
  }
);

export const updateBook = createAsyncThunk(
  'books/updateBook',
  async ({ id, data }: { id: string; data: Partial<Book> }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/books/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update book');
    }
  }
);

export const deleteBook = createAsyncThunk(
  'books/deleteBook', 
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/books/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete book');
    }
  }
);

export const updateChapter = createAsyncThunk(
  'books/updateChapter',
  async ({ 
    bookId, 
    chapterIndex, 
    data 
  }: { 
    bookId: string; 
    chapterIndex: number; 
    data: Partial<Chapter> 
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/books/${bookId}/chapters/${chapterIndex}`, data);
      return { bookId, chapterIndex, chapter: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update chapter');
    }
  }
);

export const addTestToChapter = createAsyncThunk(
  'books/addTestToChapter',
  async ({
    bookId,
    chapterIndex,
    testData
  }: {
    bookId: string;
    chapterIndex: number;
    testData: Omit<Test, '_id' | 'testDate'>;
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/books/${bookId}/chapters/${chapterIndex}/tests`, testData);
      return { bookId, chapterIndex, test: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add test');
    }
  }
);

export const addRevisionToChapter = createAsyncThunk(
  'books/addRevisionToChapter',
  async ({
    bookId,
    chapterIndex,
    revisionData
  }: {
    bookId: string;
    chapterIndex: number;
    revisionData: Omit<Revision, '_id' | 'revisionDate'>;
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/books/${bookId}/chapters/${chapterIndex}/revisions`, revisionData);
      return { bookId, chapterIndex, revision: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add revision');
    }
  }
);

export const bulkUpdateChapters = createAsyncThunk(
  'books/bulkUpdateChapters',
  async ({
    bookId,
    chapterIndices,
    action,
    actionData
  }: {
    bookId: string;
    chapterIndices: number[];
    action: 'mark_completed' | 'mark_in_progress' | 'set_priority' | 'add_time';
    actionData?: any;
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/books/${bookId}/chapters/bulk`, {
        chapterIndices,
        action,
        actionData
      });
      return { bookId, updatedCount: response.data.updatedCount };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk update chapters');
    }
  }
);

export const fetchBookStats = createAsyncThunk(
  'books/fetchBookStats',
  async (bookId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/books/${bookId}/stats`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch book stats');
    }
  }
);

export const fetchStudyRecommendations = createAsyncThunk(
  'books/fetchStudyRecommendations',
  async (bookId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/books/${bookId}/recommendations`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch study recommendations');
    }
  }
);

export const addChapterToBook = createAsyncThunk(
  'books/addChapterToBook',
  async ({
    bookId,
    chapterData
  }: {
    bookId: string;
    chapterData: Omit<Chapter, '_id' | 'chapterNumber' | 'createdAt' | 'updatedAt'>;
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/books/${bookId}/chapters`, chapterData);
      return { bookId, chapter: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add chapter');
    }
  }
);

export const removeChapterFromBook = createAsyncThunk(
  'books/removeChapterFromBook',
  async ({
    bookId,
    chapterIndex
  }: {
    bookId: string;
    chapterIndex: number;
  }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/books/${bookId}/chapters/${chapterIndex}`);
      return { bookId, chapterIndex };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove chapter');
    }
  }
);

export const linkChapterToSyllabus = createAsyncThunk(
  'books/linkChapterToSyllabus',
  async ({
    bookId,
    chapterIndex,
    syllabusItemId
  }: {
    bookId: string;
    chapterIndex: number;
    syllabusItemId: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/books/${bookId}/chapters/${chapterIndex}/link-syllabus`, {
        syllabusItemId
      });
      return { bookId, chapterIndex, syllabusItemId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to link chapter to syllabus');
    }
  }
);

const bookSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { subject: '', priority: '', status: '' };
    },
    selectBook: (state, action: PayloadAction<Book | null>) => {
      state.selectedBook = action.payload;
    },
    clearSelectedBook: (state) => {
      state.selectedBook = null;
      state.bookStats = null;
      state.studyRecommendations = null;
    },
    // Optimistic update for chapter status
    updateChapterStatusOptimistic: (state, action: PayloadAction<{
      bookId: string;
      chapterIndex: number;
      status: Chapter['status'];
    }>) => {
      const { bookId, chapterIndex, status } = action.payload;
      const book = state.books.find(b => b.id === bookId);
      if (book && book.chapters[chapterIndex]) {
        book.chapters[chapterIndex].status = status;
        if (status === 'completed') {
          book.chapters[chapterIndex].completedAt = new Date().toISOString();
        } else if (book.chapters[chapterIndex].completedAt) {
          book.chapters[chapterIndex].completedAt = undefined;
        }
        // Recalculate completed chapters
        book.completedChapters = book.chapters.filter(c => c.status === 'completed').length;
        book.progressPercentage = Math.round((book.completedChapters / book.totalChapters) * 100);
      }
      
      // Update selected book if it matches
      if (state.selectedBook && state.selectedBook.id === bookId) {
        if (state.selectedBook.chapters[chapterIndex]) {
          state.selectedBook.chapters[chapterIndex].status = status;
          if (status === 'completed') {
            state.selectedBook.chapters[chapterIndex].completedAt = new Date().toISOString();
          } else if (state.selectedBook.chapters[chapterIndex].completedAt) {
            state.selectedBook.chapters[chapterIndex].completedAt = undefined;
          }
          state.selectedBook.completedChapters = state.selectedBook.chapters.filter(c => c.status === 'completed').length;
          state.selectedBook.progressPercentage = Math.round((state.selectedBook.completedChapters / state.selectedBook.totalChapters) * 100);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch books
      .addCase(fetchBooks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.isLoading = false;
        const booksData = action.payload?.data || action.payload || [];
        state.books = booksData.map((book: any) => ({
          ...book,
          id: book._id || book.id
        }));
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch single book
      .addCase(fetchBook.fulfilled, (state, action) => {
        const bookData = action.payload?.data || action.payload;
        state.selectedBook = {
          ...bookData,
          id: bookData._id || bookData.id
        };
      })
      
      // Add book
      .addCase(addBook.fulfilled, (state, action) => {
        const newBook = action.payload?.data || action.payload;
        state.books.push({
          ...newBook,
          id: newBook._id || newBook.id
        });
      })
      
      // Update book
      .addCase(updateBook.fulfilled, (state, action) => {
        const updatedBook = action.payload?.data || action.payload;
        const book = {
          ...updatedBook,
          id: updatedBook._id || updatedBook.id
        };
        const index = state.books.findIndex((b) => b.id === book.id);
        if (index !== -1) {
          state.books[index] = book;
        }
        if (state.selectedBook && state.selectedBook.id === book.id) {
          state.selectedBook = book;
        }
      })
      
      // Delete book
      .addCase(deleteBook.fulfilled, (state, action) => {
        state.books = state.books.filter((book) => book.id !== action.payload);
        if (state.selectedBook && state.selectedBook.id === action.payload) {
          state.selectedBook = null;
        }
      })
      
      // Update chapter
      .addCase(updateChapter.fulfilled, (state, action) => {
        const { bookId, chapterIndex, chapter } = action.payload;
        const book = state.books.find(b => b.id === bookId);
        if (book && book.chapters[chapterIndex]) {
          book.chapters[chapterIndex] = { ...book.chapters[chapterIndex], ...chapter };
        }
        if (state.selectedBook && state.selectedBook.id === bookId) {
          if (state.selectedBook.chapters[chapterIndex]) {
            state.selectedBook.chapters[chapterIndex] = { ...state.selectedBook.chapters[chapterIndex], ...chapter };
          }
        }
      })
      
      // Add test to chapter
      .addCase(addTestToChapter.fulfilled, (state, action) => {
        const { bookId, chapterIndex, test } = action.payload;
        const book = state.books.find(b => b.id === bookId);
        if (book && book.chapters[chapterIndex]) {
          book.chapters[chapterIndex].tests.push(test);
          book.chapters[chapterIndex].lastStudiedDate = new Date().toISOString();
        }
        if (state.selectedBook && state.selectedBook.id === bookId) {
          if (state.selectedBook.chapters[chapterIndex]) {
            state.selectedBook.chapters[chapterIndex].tests.push(test);
            state.selectedBook.chapters[chapterIndex].lastStudiedDate = new Date().toISOString();
          }
        }
      })
      
      // Add revision to chapter
      .addCase(addRevisionToChapter.fulfilled, (state, action) => {
        const { bookId, chapterIndex, revision } = action.payload;
        const book = state.books.find(b => b.id === bookId);
        if (book && book.chapters[chapterIndex]) {
          book.chapters[chapterIndex].revisions.push(revision);
          book.chapters[chapterIndex].lastStudiedDate = new Date().toISOString();
        }
        if (state.selectedBook && state.selectedBook.id === bookId) {
          if (state.selectedBook.chapters[chapterIndex]) {
            state.selectedBook.chapters[chapterIndex].revisions.push(revision);
            state.selectedBook.chapters[chapterIndex].lastStudiedDate = new Date().toISOString();
          }
        }
      })
      
      // Bulk update chapters
      .addCase(bulkUpdateChapters.fulfilled, (state) => {
        // Trigger a refresh of the book data after bulk update
        // The actual changes will be reflected when fetchBook is called again
      })
      
      // Fetch book stats
      .addCase(fetchBookStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchBookStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.bookStats = action.payload?.data || action.payload;
      })
      .addCase(fetchBookStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch study recommendations
      .addCase(fetchStudyRecommendations.pending, (state) => {
        state.recommendationsLoading = true;
      })
      .addCase(fetchStudyRecommendations.fulfilled, (state, action) => {
        state.recommendationsLoading = false;
        state.studyRecommendations = action.payload?.data || action.payload;
      })
      .addCase(fetchStudyRecommendations.rejected, (state, action) => {
        state.recommendationsLoading = false;
        state.error = action.payload as string;
      })
      
      // Add chapter to book
      .addCase(addChapterToBook.fulfilled, (state, action) => {
        const { bookId, chapter } = action.payload;
        const book = state.books.find(b => b.id === bookId);
        if (book) {
          book.chapters.push(chapter);
          book.totalChapters = book.chapters.length;
          book.progressPercentage = Math.round((book.completedChapters / book.totalChapters) * 100);
        }
        if (state.selectedBook && state.selectedBook.id === bookId) {
          state.selectedBook.chapters.push(chapter);
          state.selectedBook.totalChapters = state.selectedBook.chapters.length;
          state.selectedBook.progressPercentage = Math.round((state.selectedBook.completedChapters / state.selectedBook.totalChapters) * 100);
        }
      })
      
      // Remove chapter from book
      .addCase(removeChapterFromBook.fulfilled, (state, action) => {
        const { bookId, chapterIndex } = action.payload;
        const book = state.books.find(b => b.id === bookId);
        if (book) {
          book.chapters.splice(chapterIndex, 1);
          book.totalChapters = book.chapters.length;
          book.completedChapters = book.chapters.filter(c => c.status === 'completed').length;
          book.progressPercentage = book.totalChapters > 0 ? Math.round((book.completedChapters / book.totalChapters) * 100) : 0;
        }
        if (state.selectedBook && state.selectedBook.id === bookId) {
          state.selectedBook.chapters.splice(chapterIndex, 1);
          state.selectedBook.totalChapters = state.selectedBook.chapters.length;
          state.selectedBook.completedChapters = state.selectedBook.chapters.filter(c => c.status === 'completed').length;
          state.selectedBook.progressPercentage = state.selectedBook.totalChapters > 0 ? Math.round((state.selectedBook.completedChapters / state.selectedBook.totalChapters) * 100) : 0;
        }
      })
      
      // Link chapter to syllabus
      .addCase(linkChapterToSyllabus.fulfilled, (state, action) => {
        const { bookId, chapterIndex, syllabusItemId } = action.payload;
        const book = state.books.find(b => b.id === bookId);
        if (book && book.chapters[chapterIndex]) {
          if (!book.chapters[chapterIndex].linkedSyllabusItems.includes(syllabusItemId)) {
            book.chapters[chapterIndex].linkedSyllabusItems.push(syllabusItemId);
          }
        }
        if (state.selectedBook && state.selectedBook.id === bookId) {
          if (state.selectedBook.chapters[chapterIndex]) {
            if (!state.selectedBook.chapters[chapterIndex].linkedSyllabusItems.includes(syllabusItemId)) {
              state.selectedBook.chapters[chapterIndex].linkedSyllabusItems.push(syllabusItemId);
            }
          }
        }
      });
  },
});

export const { 
  clearError, 
  setFilters, 
  clearFilters, 
  selectBook, 
  clearSelectedBook,
  updateChapterStatusOptimistic 
} = bookSlice.actions;

export default bookSlice.reducer;
