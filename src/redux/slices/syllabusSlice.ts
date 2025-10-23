import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  syllabusApi, 
  SyllabusItem, 
  SyllabusStats, 
  CreateSyllabusItemRequest, 
  UpdateSyllabusItemRequest,
  BulkUpdateRequest 
} from '../../api/syllabusApi';

interface SyllabusState {
  items: SyllabusItem[];
  currentItem: SyllabusItem | null;
  stats: SyllabusStats | null;
  recommendations: SyllabusItem[];
  selectedItems: string[];
  isLoading: boolean;
  statsLoading: boolean;
  recommendationsLoading: boolean;
  error: string | null;
  filters: {
    subject: string;
    status: string;
    priority: string;
    search: string;
  };
  expandedItems: Set<string>;
}

const initialState: SyllabusState = {
  items: [],
  currentItem: null,
  stats: null,
  recommendations: [],
  selectedItems: [],
  isLoading: false,
  statsLoading: false,
  recommendationsLoading: false,
  error: null,
  filters: {
    subject: '',
    status: '',
    priority: '',
    search: '',
  },
  expandedItems: new Set(),
};

// Async thunks
export const fetchSyllabus = createAsyncThunk(
  'syllabus/fetchAll',
  async (params: {
    subject?: string;
    status?: string;
    priority?: string;
    search?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const data = await syllabusApi.getSyllabus(params);
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch syllabus';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchSyllabusStats = createAsyncThunk(
  'syllabus/fetchStats',
  async (params: { subject?: string } = {}, { rejectWithValue }) => {
    try {
      const data = await syllabusApi.getStats(params);
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch syllabus statistics';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchSyllabusItem = createAsyncThunk(
  'syllabus/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await syllabusApi.getSyllabusItem(id);
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch syllabus item';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createSyllabusItem = createAsyncThunk(
  'syllabus/create',
  async (itemData: CreateSyllabusItemRequest, { rejectWithValue }) => {
    try {
      const data = await syllabusApi.createSyllabusItem(itemData);
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create syllabus item';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateSyllabusItem = createAsyncThunk(
  'syllabus/update',
  async ({ id, data }: { id: string; data: UpdateSyllabusItemRequest }, { rejectWithValue }) => {
    try {
      const result = await syllabusApi.updateSyllabusItem(id, data);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update syllabus item';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteSyllabusItem = createAsyncThunk(
  'syllabus/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await syllabusApi.deleteSyllabusItem(id);
      return id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete syllabus item';
      return rejectWithValue(errorMessage);
    }
  }
);

export const bulkUpdateSyllabus = createAsyncThunk(
  'syllabus/bulkUpdate',
  async (updateData: BulkUpdateRequest, { rejectWithValue }) => {
    try {
      const result = await syllabusApi.bulkUpdateSyllabus(updateData);
      return { ...result, items: updateData.items, action: updateData.action, actionData: updateData.actionData };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update syllabus items';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchRecommendations = createAsyncThunk(
  'syllabus/fetchRecommendations',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const data = await syllabusApi.getRecommendations(limit);
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recommendations';
      return rejectWithValue(errorMessage);
    }
  }
);

export const linkBooksToSyllabus = createAsyncThunk(
  'syllabus/linkBooks',
  async ({ id, bookIds }: { id: string; bookIds: string[] }, { rejectWithValue }) => {
    try {
      const result = await syllabusApi.linkBooks(id, bookIds);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to link books';
      return rejectWithValue(errorMessage);
    }
  }
);

const syllabusSlice = createSlice({
  name: 'syllabus',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentItem: (state) => {
      state.currentItem = null;
    },
    setFilters: (state, action: PayloadAction<Partial<SyllabusState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        subject: '',
        status: '',
        priority: '',
        search: '',
      };
    },
    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      if (state.selectedItems.includes(itemId)) {
        state.selectedItems = state.selectedItems.filter(id => id !== itemId);
      } else {
        state.selectedItems.push(itemId);
      }
    },
    selectAllItems: (state, action: PayloadAction<string[]>) => {
      state.selectedItems = action.payload;
    },
    clearSelection: (state) => {
      state.selectedItems = [];
    },
    toggleItemExpansion: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const newExpanded = new Set(state.expandedItems);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      state.expandedItems = newExpanded;
    },
    expandAllItems: (state) => {
      const allItemIds = getAllItemIds(state.items);
      state.expandedItems = new Set(allItemIds);
    },
    collapseAllItems: (state) => {
      state.expandedItems = new Set();
    },
    updateItemStatusOptimistic: (state, action: PayloadAction<{ id: string; status: SyllabusItem['status'] }>) => {
      // Optimistically update the item status for better UX
      const updateItemInTree = (items: SyllabusItem[]): SyllabusItem[] => {
        return items.map(item => {
          if (item._id === action.payload.id) {
            return { ...item, status: action.payload.status };
          }
          if (item.children) {
            return { ...item, children: updateItemInTree(item.children) };
          }
          return item;
        });
      };
      state.items = updateItemInTree(state.items);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch syllabus
      .addCase(fetchSyllabus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSyllabus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchSyllabus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch syllabus stats
      .addCase(fetchSyllabusStats.pending, (state) => {
        state.statsLoading = true;
        state.error = null;
      })
      .addCase(fetchSyllabusStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchSyllabusStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload as string;
      })

      // Fetch single syllabus item
      .addCase(fetchSyllabusItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSyllabusItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentItem = action.payload;
      })
      .addCase(fetchSyllabusItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create syllabus item
      .addCase(createSyllabusItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSyllabusItem.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new item to the appropriate place in the tree
        if (action.payload.parentId) {
          const addToParent = (items: SyllabusItem[]): SyllabusItem[] => {
            return items.map(item => {
              if (item._id === action.payload.parentId) {
                return {
                  ...item,
                  children: [...(item.children || []), action.payload]
                };
              }
              if (item.children) {
                return { ...item, children: addToParent(item.children) };
              }
              return item;
            });
          };
          state.items = addToParent(state.items);
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(createSyllabusItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update syllabus item
      .addCase(updateSyllabusItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSyllabusItem.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update item in the tree
        const updateItemInTree = (items: SyllabusItem[]): SyllabusItem[] => {
          return items.map(item => {
            if (item._id === action.payload._id) {
              return action.payload;
            }
            if (item.children) {
              return { ...item, children: updateItemInTree(item.children) };
            }
            return item;
          });
        };
        state.items = updateItemInTree(state.items);
        if (state.currentItem?._id === action.payload._id) {
          state.currentItem = action.payload;
        }
      })
      .addCase(updateSyllabusItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete syllabus item
      .addCase(deleteSyllabusItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSyllabusItem.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove item from tree
        const removeFromTree = (items: SyllabusItem[]): SyllabusItem[] => {
          return items
            .filter(item => item._id !== action.payload)
            .map(item => ({
              ...item,
              children: item.children ? removeFromTree(item.children) : undefined
            }));
        };
        state.items = removeFromTree(state.items);
        state.selectedItems = state.selectedItems.filter(id => id !== action.payload);
        if (state.currentItem?._id === action.payload) {
          state.currentItem = null;
        }
      })
      .addCase(deleteSyllabusItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Bulk update
      .addCase(bulkUpdateSyllabus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkUpdateSyllabus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Clear selection after successful bulk update
        state.selectedItems = [];
        // Note: We could optimistically update the items here based on the action
        // For now, we'll rely on refetching the data
      })
      .addCase(bulkUpdateSyllabus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch recommendations
      .addCase(fetchRecommendations.pending, (state) => {
        state.recommendationsLoading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendationsLoading = false;
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.recommendationsLoading = false;
        state.error = action.payload as string;
      })

      // Link books
      .addCase(linkBooksToSyllabus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(linkBooksToSyllabus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the item with linked books
        const updateItemInTree = (items: SyllabusItem[]): SyllabusItem[] => {
          return items.map(item => {
            if (item._id === action.payload._id) {
              return action.payload;
            }
            if (item.children) {
              return { ...item, children: updateItemInTree(item.children) };
            }
            return item;
          });
        };
        state.items = updateItemInTree(state.items);
        if (state.currentItem?._id === action.payload._id) {
          state.currentItem = action.payload;
        }
      })
      .addCase(linkBooksToSyllabus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Helper function to get all item IDs from the tree
function getAllItemIds(items: SyllabusItem[]): string[] {
  const ids: string[] = [];
  
  function traverse(items: SyllabusItem[]) {
    for (const item of items) {
      ids.push(item._id);
      if (item.children) {
        traverse(item.children);
      }
    }
  }
  
  traverse(items);
  return ids;
}

export const {
  clearError,
  clearCurrentItem,
  setFilters,
  clearFilters,
  toggleItemSelection,
  selectAllItems,
  clearSelection,
  toggleItemExpansion,
  expandAllItems,
  collapseAllItems,
  updateItemStatusOptimistic,
} = syllabusSlice.actions;

export default syllabusSlice.reducer;
