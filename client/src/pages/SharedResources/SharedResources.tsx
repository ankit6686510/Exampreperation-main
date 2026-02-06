import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Plus, FileText, Link, BookOpen, Video, Download, Star, Bookmark, Search, Filter, Upload, Eye, MoreVertical } from 'lucide-react';
import { sharedResourceApi, type SharedResource, type CreateSharedResourceRequest } from '@/api/sharedResourceApi';
import { studyGroupApi, type StudyGroup } from '@/api/studyGroupApi';
import { format } from 'date-fns';

const SharedResources = () => {
  const [activeTab, setActiveTab] = useState('group-resources');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch user's groups
  const { data: userGroups } = useQuery({
    queryKey: ['study-groups', 'user'],
    queryFn: studyGroupApi.getUserGroups,
  });

  // Fetch group resources
  const { data: groupResources, isLoading: isLoadingResources } = useQuery({
    queryKey: ['shared-resources', selectedGroupId, searchQuery, selectedResourceType],
    queryFn: () => sharedResourceApi.getGroupResources(selectedGroupId, {
      search: searchQuery,
      resourceType: selectedResourceType,
      limit: 20,
    }),
    enabled: !!selectedGroupId && activeTab === 'group-resources',
  });

  // Fetch user's bookmarks
  const { data: userBookmarks, isLoading: isLoadingBookmarks } = useQuery({
    queryKey: ['shared-resources', 'bookmarks'],
    queryFn: () => sharedResourceApi.getUserBookmarks(),
    enabled: activeTab === 'bookmarks',
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: sharedResourceApi.createSharedResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-resources'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Resource shared successfully!',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to share resource';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: sharedResourceApi.toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-resources'] });
      toast({
        title: 'Success',
        description: 'Bookmark updated!',
      });
    },
  });

  const CreateResourceForm = () => {
    const [formData, setFormData] = useState<CreateSharedResourceRequest>({
      title: '',
      description: '',
      groupId: selectedGroupId,
      resourceType: 'link',
      contentData: {},
      subject: '',
      topics: [],
      examTypes: [],
      difficulty: 'intermediate',
      visibility: 'group',
      tags: [],
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createResourceMutation.mutate(formData);
    };

    const resourceTypeOptions = [
      { value: 'file', label: 'File', icon: FileText },
      { value: 'link', label: 'Link', icon: Link },
      { value: 'note', label: 'Note', icon: FileText },
      { value: 'book', label: 'Book', icon: BookOpen },
      { value: 'video', label: 'Video', icon: Video },
      { value: 'article', label: 'Article', icon: FileText },
      { value: 'practice-test', label: 'Practice Test', icon: FileText },
      { value: 'other', label: 'Other', icon: FileText },
    ];

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter resource title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the resource"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resourceType">Resource Type *</Label>
          <Select
            value={formData.resourceType}
            onValueChange={(value) => setFormData({ ...formData, resourceType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select resource type" />
            </SelectTrigger>
            <SelectContent>
              {resourceTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.resourceType === 'link' && (
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.contentData.url || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                contentData: { ...formData.contentData, url: e.target.value } 
              })}
              placeholder="https://example.com"
              required
            />
          </div>
        )}

        {formData.resourceType === 'note' && (
          <div className="space-y-2">
            <Label htmlFor="textContent">Content *</Label>
            <Textarea
              id="textContent"
              value={formData.contentData.textContent || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                contentData: { ...formData.contentData, textContent: e.target.value } 
              })}
              placeholder="Enter your notes here..."
              rows={6}
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Enter subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <Select
            value={formData.visibility}
            onValueChange={(value) => setFormData({ ...formData, visibility: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="group">Group Members</SelectItem>
              <SelectItem value="partners">Study Partners Only</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createResourceMutation.isPending}>
            {createResourceMutation.isPending ? 'Sharing...' : 'Share Resource'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const ResourceCard = ({ resource }: { resource: SharedResource }) => {
    const getResourceIcon = (type: string) => {
      switch (type) {
        case 'file': return FileText;
        case 'link': return Link;
        case 'book': return BookOpen;
        case 'video': return Video;
        default: return FileText;
      }
    };

    const ResourceIcon = getResourceIcon(resource.resourceType);

    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <ResourceIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg line-clamp-1">{resource.title}</CardTitle>
              </div>
              <CardDescription className="line-clamp-2">
                {resource.description || 'No description provided'}
              </CardDescription>
            </div>
            <Badge variant="outline">
              {resource.difficulty}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">{resource.subject}</Badge>
              <Badge variant="outline" className="text-xs">
                {resource.resourceType}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{resource.stats.totalViews}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>{resource.stats.averageRating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bookmark className="h-4 w-4" />
                  <span>{resource.stats.totalBookmarks}</span>
                </div>
              </div>
              <span className="text-xs">
                {format(new Date(resource.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {resource.sharedBy.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">{resource.sharedBy.name}</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleBookmarkMutation.mutate(resource._id)}
                  disabled={toggleBookmarkMutation.isPending}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                
                {resource.resourceType === 'link' && resource.contentData.url && (
                  <Button
                    size="sm"
                    onClick={() => window.open(resource.contentData.url, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                )}
                
                {resource.resourceType === 'file' && (
                  <Button
                    size="sm"
                    onClick={() => sharedResourceApi.downloadResource(resource._id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Shared Resources</h1>
          <p className="text-muted-foreground mt-1">
            Share and discover study materials with your groups
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedGroupId}>
              <Plus className="h-4 w-4 mr-2" />
              Share Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Share Resource</DialogTitle>
              <DialogDescription>
                Share a helpful resource with your study group
              </DialogDescription>
            </DialogHeader>
            <CreateResourceForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a study group" />
          </SelectTrigger>
          <SelectContent>
            {userGroups?.data?.groups?.map((group: StudyGroup) => (
              <SelectItem key={group._id} value={group._id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="group-resources">Group Resources</TabsTrigger>
          <TabsTrigger value="bookmarks">My Bookmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="group-resources" className="space-y-6">
          {selectedGroupId ? (
            <>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="file">Files</SelectItem>
                    <SelectItem value="link">Links</SelectItem>
                    <SelectItem value="note">Notes</SelectItem>
                    <SelectItem value="book">Books</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                    <SelectItem value="practice-test">Practice Tests</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoadingResources ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : groupResources?.data?.resources?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupResources.data.resources.map((resource: SharedResource) => (
                    <ResourceCard key={resource._id} resource={resource} />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Resources Found</h3>
                    <p className="text-muted-foreground mb-4">
                      No resources found for this group. Share one to get started!
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      Share Resource
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Select a Study Group</h3>
                <p className="text-muted-foreground">
                  Choose a study group to view and share resources
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-6">
          {isLoadingBookmarks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : userBookmarks?.data?.bookmarks?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userBookmarks.data.bookmarks.map((bookmark: { _id: string; resource: SharedResource }) => (
                <ResourceCard key={bookmark._id} resource={bookmark.resource} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Bookmarks</h3>
                <p className="text-muted-foreground">
                  You haven't bookmarked any resources yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SharedResources;
