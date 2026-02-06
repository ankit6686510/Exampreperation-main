import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Users, Search, Filter, Calendar, Target, TrendingUp, Settings, Eye, UserPlus, LogOut, Crown, ChevronRight, Edit, Trash2, AlertCircle } from 'lucide-react';
import { studyGroupApi, groupProgressApi, type StudyGroup, type CreateStudyGroupRequest } from '@/api/studyGroupApi';
import { useAppSelector } from '@/redux/hooks';
import { format } from 'date-fns';

const StudyGroups = () => {
  const [activeTab, setActiveTab] = useState('my-groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [isGroupDetailOpen, setIsGroupDetailOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudyGroup | null>(null);

  const queryClient = useQueryClient();
  const { user, isLoading, isInitialized } = useAppSelector((state) => state.auth);

  // Fetch user's groups
  const { data: userGroups, isLoading: isLoadingUserGroups } = useQuery({
    queryKey: ['study-groups', 'user'],
    queryFn: studyGroupApi.getUserGroups,
    enabled: !!user,
  });

  // Fetch public groups
  const { data: publicGroups, isLoading: isLoadingPublicGroups } = useQuery({
    queryKey: ['study-groups', 'public', searchQuery, selectedExamType],
    queryFn: () => studyGroupApi.getPublicGroups({
      search: searchQuery,
      examType: selectedExamType,
      limit: 20,
    }),
    enabled: activeTab === 'discover' && !!user,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: studyGroupApi.createStudyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Study group created successfully!',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create study group';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: studyGroupApi.joinStudyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
      toast({
        title: 'Success',
        description: 'Successfully joined the study group!',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to join study group';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: studyGroupApi.leaveStudyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
      toast({
        title: 'Success',
        description: 'Successfully left the study group',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to leave study group';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: Partial<CreateStudyGroupRequest> }) =>
      studyGroupApi.updateStudyGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
      setIsEditDialogOpen(false);
      setEditingGroup(null);
      toast({
        title: 'Success',
        description: 'Study group updated successfully!',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update study group';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: studyGroupApi.deleteStudyGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
      toast({
        title: 'Success',
        description: 'Study group and all associated content deleted successfully',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete study group';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Show loading spinner while checking auth status
  if (isLoading && !isInitialized) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-md mx-auto text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authentication guard - only show after auth is initialized
  if (isInitialized && !user) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-md mx-auto text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to access study groups and connect with other students.
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CreateGroupForm = () => {
    const [formData, setFormData] = useState<CreateStudyGroupRequest>({
      name: '',
      description: '',
      examTypes: [],
      targetDate: '',
      privacy: 'public',
      settings: {
        allowMemberInvites: true,
        requireApproval: false,
        maxMembers: 50,
        allowDataSharing: true,
        allowLeaderboard: true,
      },
      tags: [],
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createGroupMutation.mutate(formData);
    };

    const examTypeOptions = ['UPSC', 'SSC', 'Banking', 'Railway', 'State PSC', 'Defense', 'Teaching', 'Other'];

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Group Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter group name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your study group"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="examTypes">Exam Types *</Label>
          <Select
            value={formData.examTypes[0] || ''}
            onValueChange={(value) => setFormData({ ...formData, examTypes: [value] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select exam type" />
            </SelectTrigger>
            <SelectContent>
              {examTypeOptions.map((exam) => (
                <SelectItem key={exam} value={exam}>
                  {exam}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetDate">Target Date</Label>
          <Input
            id="targetDate"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="privacy">Privacy</Label>
          <Select
            value={formData.privacy}
            onValueChange={(value) => setFormData({ ...formData, privacy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Group Settings</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="allowMemberInvites">Allow member invites</Label>
            <Switch
              id="allowMemberInvites"
              checked={formData.settings?.allowMemberInvites}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, allowMemberInvites: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireApproval">Require approval to join</Label>
            <Switch
              id="requireApproval"
              checked={formData.settings?.requireApproval}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, requireApproval: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allowDataSharing">Allow data sharing</Label>
            <Switch
              id="allowDataSharing"
              checked={formData.settings?.allowDataSharing}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, allowDataSharing: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allowLeaderboard">Show leaderboard</Label>
            <Switch
              id="allowLeaderboard"
              checked={formData.settings?.allowLeaderboard}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, allowLeaderboard: checked },
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createGroupMutation.isPending}>
            {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const EditGroupForm = () => {
    const [formData, setFormData] = useState<CreateStudyGroupRequest>({
      name: editingGroup?.name || '',
      description: editingGroup?.description || '',
      examTypes: editingGroup?.examTypes || [],
      targetDate: editingGroup?.targetDate ? new Date(editingGroup.targetDate).toISOString().split('T')[0] : '',
      privacy: editingGroup?.privacy || 'public',
      settings: editingGroup?.settings || {
        allowMemberInvites: true,
        requireApproval: false,
        maxMembers: 50,
        allowDataSharing: true,
        allowLeaderboard: true,
      },
      tags: editingGroup?.tags || [],
    });

    if (!editingGroup) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      updateGroupMutation.mutate({ groupId: editingGroup._id, data: formData });
    };

    const examTypeOptions = ['UPSC', 'SSC', 'Banking', 'Railway', 'State PSC', 'Defense', 'Teaching', 'Other'];

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Group Name *</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter group name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your study group"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-examTypes">Exam Types *</Label>
          <Select
            value={formData.examTypes[0] || ''}
            onValueChange={(value) => setFormData({ ...formData, examTypes: [value] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select exam type" />
            </SelectTrigger>
            <SelectContent>
              {examTypeOptions.map((exam) => (
                <SelectItem key={exam} value={exam}>
                  {exam}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-targetDate">Target Date</Label>
          <Input
            id="edit-targetDate"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-privacy">Privacy</Label>
          <Select
            value={formData.privacy}
            onValueChange={(value) => setFormData({ ...formData, privacy: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Group Settings</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-allowMemberInvites">Allow member invites</Label>
            <Switch
              id="edit-allowMemberInvites"
              checked={formData.settings?.allowMemberInvites}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, allowMemberInvites: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-requireApproval">Require approval to join</Label>
            <Switch
              id="edit-requireApproval"
              checked={formData.settings?.requireApproval}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, requireApproval: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-allowDataSharing">Allow data sharing</Label>
            <Switch
              id="edit-allowDataSharing"
              checked={formData.settings?.allowDataSharing}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, allowDataSharing: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-allowLeaderboard">Show leaderboard</Label>
            <Switch
              id="edit-allowLeaderboard"
              checked={formData.settings?.allowLeaderboard}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, allowLeaderboard: checked },
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {
            setIsEditDialogOpen(false);
            setEditingGroup(null);
          }}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateGroupMutation.isPending}>
            {updateGroupMutation.isPending ? 'Updating...' : 'Update Group'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const GroupCard = ({ group, isUserGroup = false }: { group: StudyGroup; isUserGroup?: boolean }) => {
    // Use authenticated user ID for proper authorization
    const currentUserId = user?.id;
    const isOwner = group.admin._id === currentUserId;
    const isMember = group.members.some(member => member.user._id === currentUserId);

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => {
        setSelectedGroup(group);
        setIsGroupDetailOpen(true);
      }}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
                {isOwner ? (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Created by me
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {isUserGroup ? 'Joined' : 'Discovered'}
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {group.description || 'No description provided'}
              </CardDescription>
            </div>
            <Badge variant={group.privacy === 'public' ? 'default' : 'secondary'}>
              {group.privacy}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {group.examTypes.map((exam) => (
                <Badge key={exam} variant="outline" className="text-xs">
                  {exam}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{group.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{group.stats.averageStudyHours.toFixed(1)}h avg</span>
              </div>
            </div>

            {group.targetDate && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Target: {format(new Date(group.targetDate), 'MMM dd, yyyy')}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Crown className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium">{group.admin.name}</span>
              </div>
              
              <div className="flex gap-2">
                {isOwner ? (
                  // Show owner controls (Edit/Delete) for creator's own groups
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGroup(group);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Study Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete "{group.name}"? This action cannot be undone and will:
                            <br />• Remove all group members
                            <br />• Delete all study rooms and sessions
                            <br />• Remove all shared resources
                            <br />• Clear all group activities and progress
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteGroupMutation.mutate(group._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Group
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : isMember ? (
                  // Show leave button for members
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Leave
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Leave Study Group</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to leave "{group.name}"? You'll lose access to all group activities and shared resources.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => leaveGroupMutation.mutate(group._id)}>
                          Leave Group
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  // Show join button for non-members
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      joinGroupMutation.mutate(group._id);
                    }}
                    disabled={joinGroupMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGroup(group);
                    setIsGroupDetailOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const GroupDetailDialog = () => {
    if (!selectedGroup) return null;

    return (
      <Dialog open={isGroupDetailOpen} onOpenChange={setIsGroupDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedGroup.name}</DialogTitle>
            <DialogDescription>
              {selectedGroup.description || 'No description provided'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedGroup.examTypes.map((exam) => (
                <Badge key={exam} variant="outline">
                  {exam}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Group Stats</h4>
                <div className="space-y-1 text-sm">
                  <p>Members: {selectedGroup.memberCount}</p>
                  <p>Average Study Hours: {selectedGroup.stats.averageStudyHours.toFixed(1)}h</p>
                  <p>Group Streak: {selectedGroup.stats.groupStreak} days</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Settings</h4>
                <div className="space-y-1 text-sm">
                  <p>Privacy: {selectedGroup.privacy}</p>
                  <p>Max Members: {selectedGroup.settings.maxMembers}</p>
                  <p>Approval Required: {selectedGroup.settings.requireApproval ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {selectedGroup.targetDate && (
              <div>
                <h4 className="font-medium mb-2">Target Date</h4>
                <p className="text-sm">{format(new Date(selectedGroup.targetDate), 'MMMM dd, yyyy')}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Members ({selectedGroup.members.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedGroup.members.map((member) => (
                  <div key={member.user._id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {member.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{member.user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(member.joinedAt), 'MMM dd')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <p className="text-muted-foreground mt-1">
            Connect with fellow students and study together
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Study Group</DialogTitle>
              <DialogDescription>
                Create a new study group to connect with other students
              </DialogDescription>
            </DialogHeader>
            <CreateGroupForm />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="space-y-6">
          {isLoadingUserGroups ? (
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
          ) : userGroups?.data?.groups?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userGroups.data.groups.map((group: StudyGroup) => (
                <GroupCard key={group._id} group={group} isUserGroup={true} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Study Groups</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't joined any study groups yet. Create one or discover existing groups to get started.
                </p>
                <Button onClick={() => setActiveTab('discover')}>
                  Discover Groups
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search study groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedExamType} onValueChange={setSelectedExamType}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                <SelectItem value="UPSC">UPSC</SelectItem>
                <SelectItem value="SSC">SSC</SelectItem>
                <SelectItem value="Banking">Banking</SelectItem>
                <SelectItem value="Railway">Railway</SelectItem>
                <SelectItem value="State PSC">State PSC</SelectItem>
                <SelectItem value="Defense">Defense</SelectItem>
                <SelectItem value="Teaching">Teaching</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingPublicGroups ? (
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
          ) : publicGroups?.data?.groups?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicGroups.data.groups.map((group: StudyGroup) => (
                <GroupCard key={group._id} group={group} isUserGroup={false} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Groups Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedExamType
                    ? 'No study groups match your search criteria. Try adjusting your filters.'
                    : 'No public study groups available. Create the first one!'}
                </p>
                {(searchQuery || selectedExamType) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedExamType('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <GroupDetailDialog />
      
      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Study Group</DialogTitle>
            <DialogDescription>
              Update your study group settings and information
            </DialogDescription>
          </DialogHeader>
          <EditGroupForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyGroups;
