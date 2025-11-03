// Resource Management Configuration
// This file contains all configurable options for the resource management system

export const RESOURCE_CONFIG = {
  // Link Type Options
  linkTypes: [
    { value: 'external_url', label: 'External URL', icon: 'Globe' },
    { value: 'file_upload', label: 'File Upload', icon: 'Upload' },
    { value: 'notes', label: 'Notes', icon: 'StickyNote' },
    { value: 'document', label: 'Document', icon: 'FileCheck' }
  ] as const,

  // Priority Options
  priorities: [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'red' }
  ] as const,

  // Sort Options
  sortOptions: [
    { value: 'title', label: 'Title' },
    { value: 'category', label: 'Category' },
    { value: 'priority', label: 'Priority' },
    { value: 'accessCount', label: 'Access Count' },
    { value: 'createdAt', label: 'Date Created' },
    { value: 'updatedAt', label: 'Date Modified' },
    { value: 'lastAccessedAt', label: 'Last Accessed' }
  ] as const,

  // Default Values
  defaults: {
    linkType: 'external_url',
    priority: 'medium',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    pageSize: 50,
    maxTags: 10,
    maxTitleLength: 200,
    maxDescriptionLength: 500,
    maxCategoryLength: 50,
    maxLinkLength: 1000
  },

  // View Options
  viewModes: [
    { value: 'grid', label: 'Grid View', icon: 'Grid' },
    { value: 'list', label: 'List View', icon: 'List' }
  ] as const,

  // Filter Categories (can be extended)
  filterCategories: {
    general: 'General',
    academic: 'Academic',
    research: 'Research',
    reference: 'Reference'
  },

  // File Size Limits (in MB)
  fileLimits: {
    maxFileSize: 100,
    allowedFileTypes: [
      'pdf', 'doc', 'docx', 'txt', 'rtf',
      'xls', 'xlsx', 'ppt', 'pptx',
      'jpg', 'jpeg', 'png', 'gif',
      'zip', 'rar', '7z'
    ]
  },

  // UI Configuration
  ui: {
    cardsPerRow: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      wide: 4
    },
    animationDuration: 200,
    debounceDelay: 300
  },

  // Feature Flags
  features: {
    enableFileUpload: true,
    enableBulkOperations: true,
    enableAdvancedSearch: true,
    enableRelatedBooks: false,  // Hide related books by default
    enableResourceSharing: false,
    enableResourceComments: false,
    enableResourceRating: false
  }
};

// Type exports for better TypeScript support
export type LinkType = typeof RESOURCE_CONFIG.linkTypes[number]['value'];
export type Priority = typeof RESOURCE_CONFIG.priorities[number]['value'];
export type SortOption = typeof RESOURCE_CONFIG.sortOptions[number]['value'];
export type ViewMode = typeof RESOURCE_CONFIG.viewModes[number]['value'];

// Helper functions
export const getLinkTypeConfig = (linkType: LinkType) => 
  RESOURCE_CONFIG.linkTypes.find(lt => lt.value === linkType);

export const getPriorityConfig = (priority: Priority) => 
  RESOURCE_CONFIG.priorities.find(p => p.value === priority);

export const getSortOptionConfig = (sortBy: SortOption) => 
  RESOURCE_CONFIG.sortOptions.find(so => so.value === sortBy);

export const getViewModeConfig = (viewMode: ViewMode) => 
  RESOURCE_CONFIG.viewModes.find(vm => vm.value === viewMode);

// Validation helpers
export const isValidLinkType = (linkType: string): linkType is LinkType =>
  RESOURCE_CONFIG.linkTypes.some(lt => lt.value === linkType);

export const isValidPriority = (priority: string): priority is Priority =>
  RESOURCE_CONFIG.priorities.some(p => p.value === priority);

export const isValidSortOption = (sortBy: string): sortBy is SortOption =>
  RESOURCE_CONFIG.sortOptions.some(so => so.value === sortBy);
