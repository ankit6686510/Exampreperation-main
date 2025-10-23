import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Star,
  BookMarked,
  TrendingUp,
  Target,
  BarChart3,
  FileText,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { 
  fetchUpscResources, 
  fetchSubjectStats,
  fetchTemplates,
  importTemplate,
  setFilters,
  clearFilters,
  toggleResourceSelection,
  clearSelection,
  updateChapterStatus,
  updateUpscResource
} from '@/redux/slices/upscResourceSlice';
import { UpscResource } from '@/api/upscResourceApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

const ExamResources: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const { user } = useAppSelector((state) => state.auth);
  const { 
    resources, 
    selectedResources,
    subjectStats, 
    templates,
    filters,
    isLoading,
    statsLoading,
    templatesLoading,
    error 
  } = useAppSelector((state) => state.upscResources);

  // Get exam-specific configuration
  const getExamConfig = () => {
    const examType = user?.examTypes?.[0] || 'UPSC';
    
    switch (examType) {
      case 'UPSC':
        return {
          title: 'UPSC Resources',
          description: 'Your comprehensive library of UPSC Civil Services study materials',
          templates: templates,
          color: 'blue'
        };
      case 'SSC':
        return {
          title: 'SSC Resources',
          description: 'Essential study materials for SSC CGL, CHSL, and other examinations',
          templates: {}, // Will be populated with SSC-specific templates
          color: 'green'
        };
      case 'Banking':
        return {
          title: 'Banking Resources',
          description: 'Comprehensive materials for IBPS, SBI, and other banking examinations',
          templates: {}, // Will be populated with Banking-specific templates
          color: 'purple'
        };
      case 'Railway':
        return {
          title: 'Railway Resources',
          description: 'Study materials for RRB, Railway Group D, and other railway examinations',
          templates: {}, // Will be populated with Railway-specific templates
          color: 'orange'
        };
      default:
        return {
          title: `${examType} Resources`,
          description: `Study materials for ${examType} examination preparation`,
          templates: {},
          color: 'blue'
        };
    }
  };

  const examConfig = getExamConfig();

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState<UpscResource | null>(null);
  const [showResourceDetails, setShowResourceDetails] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchUpscResources(filters));
    dispatch(fetchSubjectStats());
    dispatch(fetchTemplates(undefined));
  }, [dispatch, filters]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
    }
  }, [error, toast]);

  // Helper functions
  const getStatusColor = (status: UpscResource['status']) => {
    switch (status) {
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'On Hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: UpscResource['priority']) => {
    switch (priority) {
      case 'Must Read': return 'bg-red-100 text-red-800 border-red-200';
      case 'Recommended': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Optional': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Reference': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: UpscResource['category']) => {
    switch (category) {
      case 'Book': return BookOpen;
      case 'NCERT': return BookMarked;
      case 'Magazine': return FileText;
      case 'Document': return FileText;
      default: return BookOpen;
    }
  };

  const handleImportTemplate = async (templateCategory: string) => {
    try {
      await dispatch(importTemplate(templateCategory)).unwrap();
      toast({
        title: 'Success',
        description: 'UPSC templates imported successfully!',
      });
      setShowTemplateDialog(false);
      dispatch(fetchUpscResources(filters));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to import templates',
      });
    }
  };

  const handleChapterToggle = async (resourceId: string, chapterId: string, completed: boolean) => {
    try {
      await dispatch(updateChapterStatus({
        resourceId,
        chapterId,
        data: { completed }
      })).unwrap();
      
      toast({
        title: 'Success',
        description: `Chapter ${completed ? 'completed' : 'unmarked'}!`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update chapter status',
      });
    }
  };

  const handleStatusChange = async (resourceId: string, newStatus: UpscResource['status']) => {
    try {
      await dispatch(updateUpscResource({
        id: resourceId,
        data: { status: newStatus }
      })).unwrap();
      
      toast({
        title: 'Success',
        description: 'Status updated successfully!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update status',
      });
    }
  };

  const ResourceCard: React.FC<{ resource: UpscResource }> = ({ resource }) => {
    const CategoryIcon = getCategoryIcon(resource.category);
    const completedChapters = resource.chapters?.filter(ch => ch.completed).length || 0;
    const totalChapters = resource.chapters?.length || 0;
    const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="group"
      >
        <Card className="h-full hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CategoryIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{resource.author}</p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setSelectedResource(resource);
                    setShowResourceDetails(true);
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs">
                {resource.category}
              </Badge>
              <Badge className={`text-xs ${getPriorityColor(resource.priority)}`}>
                {resource.priority}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(resource.status)}`}>
                {resource.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Subject and exam relevance */}
              <div>
                <p className="text-sm font-medium text-gray-700">{resource.subject}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {resource.examRelevance.map((exam, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {exam}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{completedChapters}/{totalChapters} chapters</span>
                  {resource.actualHours > 0 && (
                    <span>{resource.actualHours}h studied</span>
                  )}
                </div>
              </div>

              {/* Status selector */}
              <Select
                value={resource.status}
                onValueChange={(value) => handleStatusChange(resource._id, value as UpscResource['status'])}
              >
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{examConfig.title}</h1>
          <p className="text-gray-600 mt-1">
            {examConfig.description}
          </p>
          {user?.examTypes && user.examTypes.length > 0 && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-sm">
                Target Exam: {user.examTypes[0]}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedResources.length > 0 && (
            <Button variant="outline" onClick={() => dispatch(clearSelection())}>
              Clear Selection ({selectedResources.length})
            </Button>
          )}

          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Import Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import {user?.examTypes?.[0] || 'Exam'} Resource Templates</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Choose from our pre-compiled collection of essential {user?.examTypes?.[0] || 'exam'} resources:
                </p>
                
                {templatesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading templates...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(examConfig.templates).map(([category, templateList]) => (
                      <Card key={category} className="border-2 hover:border-blue-200 transition-colors">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-lg">{category}</span>
                            <Button 
                              onClick={() => handleImportTemplate(category)}
                              size="sm"
                            >
                              Import ({templateList.length} resources)
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {templateList.slice(0, 3).map(template => (
                              <div key={template.title} className="flex items-center justify-between text-sm">
                                <span className="font-medium">{template.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {template.priority}
                                </Badge>
                              </div>
                            ))}
                            {templateList.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{templateList.length - 3} more resources
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && subjectStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Resources</p>
                  <p className="text-2xl font-bold">{subjectStats.reduce((acc, stat) => acc + stat.total, 0)}</p>
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
                  <p className="text-2xl font-bold">{subjectStats.reduce((acc, stat) => acc + stat.completed, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
                  <p className="text-2xl font-bold">
                    {Math.round(subjectStats.reduce((acc, stat) => acc + stat.completionPercentage, 0) / subjectStats.length || 0)}%
                  </p>
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
                  <p className="text-2xl font-bold">{Math.round(subjectStats.reduce((acc, stat) => acc + stat.totalHours, 0))}</p>
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
                placeholder="Search resources..."
                value={filters.search}
                onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.category || "all_categories"}
              onValueChange={(value) => dispatch(setFilters({ category: value === "all_categories" ? "" : value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_categories">All Categories</SelectItem>
                <SelectItem value="Book">Books</SelectItem>
                <SelectItem value="NCERT">NCERT</SelectItem>
                <SelectItem value="Magazine">Magazines</SelectItem>
                <SelectItem value="Document">Documents</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || "all_status"}
              onValueChange={(value) => dispatch(setFilters({ status: value === "all_status" ? "" : value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_status">All Status</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority || "all_priority"}
              onValueChange={(value) => dispatch(setFilters({ priority: value === "all_priority" ? "" : value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_priority">All Priority</SelectItem>
                <SelectItem value="Must Read">Must Read</SelectItem>
                <SelectItem value="Recommended">Recommended</SelectItem>
                <SelectItem value="Optional">Optional</SelectItem>
                <SelectItem value="Reference">Reference</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => dispatch(clearFilters())}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No {user?.examTypes?.[0] || 'Exam'} Resources</h3>
              <p className="text-gray-600 mb-4">
                Start by importing our comprehensive {user?.examTypes?.[0] || 'exam'} resource templates or add your own resources.
              </p>
              <Button onClick={() => setShowTemplateDialog(true)}>
                <Download className="h-4 w-4 mr-2" />
                Import Templates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {resources.map(resource => (
                <ResourceCard key={resource._id} resource={resource} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Resource Details Dialog */}
      <Dialog open={showResourceDetails} onOpenChange={setShowResourceDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedResource && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {React.createElement(getCategoryIcon(selectedResource.category), {
                      className: "h-5 w-5 text-blue-600"
                    })}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedResource.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedResource.author}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Resource Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Subject</p>
                    <p className="text-lg">{selectedResource.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Publisher</p>
                    <p className="text-lg">{selectedResource.publisher || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge className={getStatusColor(selectedResource.status)}>
                      {selectedResource.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Priority</p>
                    <Badge className={getPriorityColor(selectedResource.priority)}>
                      {selectedResource.priority}
                    </Badge>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Progress</p>
                  <Progress value={selectedResource.completionPercentage || 0} className="h-3" />
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedResource.completionPercentage || 0}% complete • 
                    {selectedResource.chapters?.filter(ch => ch.completed).length || 0}/{selectedResource.chapters?.length || 0} chapters
                  </p>
                </div>

                {/* Chapters */}
                {selectedResource.chapters && selectedResource.chapters.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-3">Chapters</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedResource.chapters.map((chapter, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Checkbox
                            checked={chapter.completed}
                            onCheckedChange={(checked) => 
                              handleChapterToggle(selectedResource._id, chapter._id!, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <p className="font-medium">{chapter.name}</p>
                            {chapter.pageRange && (
                              <p className="text-sm text-gray-600">Pages: {chapter.pageRange}</p>
                            )}
                          </div>
                          {chapter.timeSpent > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(chapter.timeSpent / 60)}h
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedResource.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                    <p className="text-gray-700">{selectedResource.description}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamResources;
