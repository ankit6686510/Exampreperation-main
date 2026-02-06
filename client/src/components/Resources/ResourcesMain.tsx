import { useState, useEffect, useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchResources,
  createResource,
  updateResource,
  deleteResource,
  recordAccess,
  toggleBookmark,
  fetchCategories,
  fetchStats,
  bulkOperations,
  setFilters,
  clearFilters,
  setSorting,
  setSelectedResources,
  toggleResourceSelection,
  clearSelection,
  Resource,
  ResourceFilters,
} from '@/redux/slices/resourceSlice';
import { fetchBooks } from '@/redux/slices/bookSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Search, 
  Filter, 
  X, 
  Grid, 
  List,
  Trash2,
  Bookmark,
  BookmarkX,
  SortAsc,
  SortDesc
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import ResourceCard from './ResourceCard';
import ResourceForm from './ResourceForm';
import ResourceStats from './ResourceStats';
import { RESOURCE_CONFIG } from '@/config/resourceConfig';

type ViewMode = 'grid' | 'list';

const ResourcesMain = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // Use shallowEqual for filters to avoid dependency churn if filters object identity changes
  const filters = useAppSelector((state) => state.resources.filters, shallowEqual);
  const {
    resources,
    categories,
    stats,
    pagination,
    sortBy,
    sortOrder,
    isLoading,
    error,
    selectedResources
  } = useAppSelector((state) => state.resources);

  const { books } = useAppSelector((state) => state.books);

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedLinkType, setSelectedLinkType] = useState('');
  const [isBookmarkedFilter, setIsBookmarkedFilter] = useState<boolean | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search -> set filters in redux
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters: ResourceFilters = {
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        priority: selectedPriority || undefined,
        linkType: selectedLinkType || undefined,
        isBookmarked: isBookmarkedFilter,
      };
      dispatch(setFilters(newFilters));
    }, 300);

    return () => clearTimeout(timer);
  }, [
    searchTerm,
    selectedCategory,
    selectedPriority,
    selectedLinkType,
    isBookmarkedFilter,
    dispatch,
  ]);

  // Fetch resources when filters/sorting/page change
  useEffect(() => {
    dispatch(fetchResources({ filters, sortBy, sortOrder }));
  }, [filters, sortBy, sortOrder, dispatch]); // filters is selected with shallowEqual

  // Fetch categories, stats, books on mount
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchStats());
    dispatch(fetchBooks({}));
  }, [dispatch]);

  // Helper to refresh both resources & stats after mutations
  const refreshResourcesAndStats = useCallback(async () => {
    await dispatch(fetchResources({ filters, sortBy, sortOrder }));
    dispatch(fetchStats());
  }, [dispatch, filters, sortBy, sortOrder]);

  const handleCreateResource = useCallback(async (data: any) => {
    try {
      await dispatch(createResource(data)).unwrap();
      // refresh both
      await refreshResourcesAndStats();
      dispatch(fetchCategories());
      toast({ title: 'Resource created' });
    } catch (err) {
      console.error('Failed to create resource:', err);
      toast({ variant: 'destructive', title: 'Create failed', description: String(err) });
      throw err;
    }
  }, [dispatch, refreshResourcesAndStats, toast]);

  const handleUpdateResource = useCallback(async (data: any) => {
    if (!editingResource) return;
    try {
      await dispatch(updateResource({ id: editingResource._id, data })).unwrap();
      await refreshResourcesAndStats();
      toast({ title: 'Resource updated' });
    } catch (err) {
      console.error('Failed to update resource:', err);
      toast({ variant: 'destructive', title: 'Update failed', description: String(err) });
      throw err;
    }
  }, [dispatch, editingResource, refreshResourcesAndStats, toast]);

  const handleDeleteResource = useCallback(async (id: string) => {
    try {
      await dispatch(deleteResource(id)).unwrap();
      await refreshResourcesAndStats();
      setDeleteConfirmId(null);
      toast({ title: 'Resource deleted' });
    } catch (err) {
      console.error('Failed to delete resource:', err);
      toast({ variant: 'destructive', title: 'Delete failed', description: String(err) });
    }
  }, [dispatch, refreshResourcesAndStats, toast]);

  const handleAccessResource = useCallback(async (id: string, link: string) => {
    try {
      await dispatch(recordAccess(id)).unwrap();
      dispatch(fetchStats());
    } catch (err) {
      console.error('Failed to record access:', err);
    }
  }, [dispatch]);

  const handleBookmarkToggle = useCallback(async (id: string) => {
    try {
      await dispatch(toggleBookmark(id)).unwrap();
      await refreshResourcesAndStats();
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      toast({ variant: 'destructive', title: 'Bookmark failed' });
    }
  }, [dispatch, refreshResourcesAndStats, toast]);

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingResource) {
        await handleUpdateResource(data);
      } else {
        await handleCreateResource(data);
      }
      setShowForm(false);
      setEditingResource(null);
    } catch (err) {
      // individual handlers already show toasts; keep form open so user can retry
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleAddNew = () => {
    setEditingResource(null);
    setShowForm(true);
  };

  const handleSortChange = (newSortBy: string) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch(setSorting({ sortBy: newSortBy, sortOrder: newSortOrder }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedPriority('');
    setSelectedLinkType('');
    setIsBookmarkedFilter(undefined);
    dispatch(clearFilters());
  };

  const handleSelectAll = () => {
    if (selectedResources.length === resources.length) {
      dispatch(clearSelection());
    } else {
      // normalize ids to strings to avoid includes() mismatch
      dispatch(setSelectedResources(resources.map(r => String(r._id))));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedResources.length === 0) return;
    try {
      await dispatch(bulkOperations({
        operation: 'delete',
        resourceIds: selectedResources
      })).unwrap();
      await refreshResourcesAndStats();
      toast({
        title: 'Resources deleted',
        description: `${selectedResources.length} resources have been deleted`
      });
      dispatch(clearSelection());
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete resources'
      });
    }
  };

  const handleBulkBookmark = async (bookmark: boolean) => {
    if (selectedResources.length === 0) return;
    try {
      await dispatch(bulkOperations({
        operation: bookmark ? 'bookmark' : 'unbookmark',
        resourceIds: selectedResources
      })).unwrap();
      await refreshResourcesAndStats();
      toast({
        title: bookmark ? 'Resources bookmarked' : 'Bookmarks removed',
        description: `${selectedResources.length} resources updated`
      });
      dispatch(clearSelection());
    } catch (err) {
      console.error('Bulk bookmark failed:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update bookmarks'
      });
    }
  };

  const hasActiveFilters = !!(
    searchTerm ||
    selectedCategory ||
    selectedPriority ||
    selectedLinkType ||
    isBookmarkedFilter !== undefined
  );

  if (isLoading && resources.length === 0) {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Resources</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Manage your study resources and reference materials
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
            Add Resource
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ResourceStats stats={stats} isLoading={isLoading} />

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-muted' : ''}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Sort: {sortBy}
                  {sortOrder === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {RESOURCE_CONFIG.sortOptions.map((option) => (
                  <DropdownMenuItem key={option.value} onClick={() => handleSortChange(option.value)}>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                {RESOURCE_CONFIG.priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLinkType} onValueChange={setSelectedLinkType}>
              <SelectTrigger>
                <SelectValue placeholder="Link Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {RESOURCE_CONFIG.linkTypes.map((linkType) => (
                  <SelectItem key={linkType.value} value={linkType.value}>
                    {linkType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={isBookmarkedFilter === undefined ? "" : isBookmarkedFilter.toString()} 
              onValueChange={(value) => setIsBookmarkedFilter(value === "" ? undefined : value === "true")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bookmarks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Resources</SelectItem>
                <SelectItem value="true">Bookmarked Only</SelectItem>
                <SelectItem value="false">Not Bookmarked</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedPriority && (
              <Badge variant="secondary">
                Priority: {selectedPriority}
                <button onClick={() => setSelectedPriority('')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedLinkType && (
              <Badge variant="secondary">
                Type: {selectedLinkType}
                <button onClick={() => setSelectedLinkType('')} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {isBookmarkedFilter !== undefined && (
              <Badge variant="secondary">
                {isBookmarkedFilter ? 'Bookmarked' : 'Not Bookmarked'}
                <button onClick={() => setIsBookmarkedFilter(undefined)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedResources.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedResources.length} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkBookmark(true)}>
              <Bookmark className="mr-2 h-4 w-4" />
              Bookmark
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkBookmark(false)}>
              <BookmarkX className="mr-2 h-4 w-4" />
              Remove Bookmark
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => dispatch(clearSelection())}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Resources Grid/List */}
      <div className="space-y-4">
        {/* Select All Checkbox */}
        {resources.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedResources.length === resources.length && resources.length > 0}
              onCheckedChange={() => handleSelectAll()} // ensure correct handler signature
            />
            <span className="text-sm text-muted-foreground">
              Select all {resources.length} resources
            </span>
          </div>
        )}

        {resources.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          }>
            {resources.map((resource) => (
              <ResourceCard
                key={String(resource._id)}
                resource={resource}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBookmark={handleBookmarkToggle}
                onAccess={handleAccessResource}
                isSelected={selectedResources.includes(String(resource._id))}
                onToggleSelect={(id) => dispatch(toggleResourceSelection(String(id)))}
                showCheckbox={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {hasActiveFilters ? (
              <>
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No resources found</h3>
                <p className="text-muted-foreground mb-4">
                  No resources match your current search and filters
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No resources yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your resource library by adding your first resource
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Resource
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalResources)} of{' '}
            {pagination.totalResources} resources
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => dispatch(fetchResources({
                filters, sortBy, sortOrder, page: pagination.currentPage - 1
              }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => dispatch(fetchResources({
                filters, sortBy, sortOrder, page: pagination.currentPage + 1
              }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Resource Form Modal */}
      <ResourceForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingResource(null);
        }}
        onSubmit={handleFormSubmit}
        resource={editingResource}
        categories={categories}
        availableBooks={books.map(book => ({
          _id: book.id,
          title: book.title,
          subject: book.subject
        }))}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          // only close when open becomes false; avoid resetting to null on re-open
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteResource(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResourcesMain;
