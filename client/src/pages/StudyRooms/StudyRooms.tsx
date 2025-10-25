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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Plus, Video, Search, Filter, Calendar, Clock, Users, Play, Pause, UserPlus, Settings, MoreVertical, CalendarIcon, AlertCircle, Edit, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { studyRoomApi, type StudyRoom, type CreateStudyRoomRequest } from '@/api/studyRoomApi';
import { studyGroupApi, type StudyGroup } from '@/api/studyGroupApi';
import { useAppSelector } from '@/redux/hooks';
import { format } from 'date-fns';

const StudyRooms = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [isRoomDetailOpen, setIsRoomDetailOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<StudyRoom | null>(null);

  const queryClient = useQueryClient();
  const { user, isLoading, isInitialized } = useAppSelector((state) => state.auth);

  // Fetch user's groups for creating rooms
  const { data: userGroups } = useQuery({
    queryKey: ['study-groups', 'user'],
    queryFn: studyGroupApi.getUserGroups,
    enabled: !!user,
  });

  // Fetch study rooms for selected group
  const { data: studyRooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['study-rooms', selectedGroupId, activeTab],
    queryFn: () => studyRoomApi.getGroupStudyRooms(selectedGroupId, {
      upcoming: activeTab === 'upcoming',
      status: activeTab === 'all' ? undefined : activeTab,
    }),
    enabled: !!selectedGroupId,
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: studyRoomApi.createStudyRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-rooms'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Study room created successfully!',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create study room';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: studyRoomApi.joinStudyRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-rooms'] });
      toast({
        title: 'Success',
        description: 'Successfully joined the study room!',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to join study room';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Handle edit room - now properly opens the edit dialog
  const handleEditRoom = (room: StudyRoom) => {
    setEditingRoom(room);
    setIsEditRoomOpen(true);
  };

  const handleDeleteRoom = (roomId: string) => {
    toast({
      title: 'Coming Soon', 
      description: 'Room deletion functionality will be available soon!',
    });
  };

  const CreateRoomForm = () => {
    const [formData, setFormData] = useState<CreateStudyRoomRequest>({
      name: '',
      description: '',
      groupId: selectedGroupId,
      scheduledTime: {
        startTime: '',
        endTime: '',
        timezone: 'UTC',
      },
      subject: '',
      topics: [],
      roomSettings: {
        maxParticipants: 10,
        isPublic: true,
        requireApproval: false,
        allowLateJoin: true,
        enablePomodoro: true,
        pomodoroSettings: {
          workDuration: 25,
          shortBreak: 5,
          longBreak: 15,
          cyclesBeforeLongBreak: 4,
        },
      },
      tags: [],
    });

    const [startDate, setStartDate] = useState<Date>();
    const [startTime, setStartTime] = useState('09:00');
    const [endDate, setEndDate] = useState<Date>();
    const [endTime, setEndTime] = useState('11:00');

    // Generate time options
    const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
      const hour = Math.floor(i / 4);
      const minute = (i % 4) * 15;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      return {
        value: timeString,
        label: timeString,
      };
    });

    // Update form data when date/time changes
    React.useEffect(() => {
      if (startDate && startTime) {
        const [hours, minutes] = startTime.split(':');
        const datetime = new Date(startDate);
        datetime.setHours(parseInt(hours), parseInt(minutes));
        setFormData(prev => ({
          ...prev,
          scheduledTime: { ...prev.scheduledTime, startTime: datetime.toISOString() }
        }));
      }
    }, [startDate, startTime]);

    React.useEffect(() => {
      if (endDate && endTime) {
        const [hours, minutes] = endTime.split(':');
        const datetime = new Date(endDate);
        datetime.setHours(parseInt(hours), parseInt(minutes));
        setFormData(prev => ({
          ...prev,
          scheduledTime: { ...prev.scheduledTime, endTime: datetime.toISOString() }
        }));
      }
    }, [endDate, endTime]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createRoomMutation.mutate(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Room Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter room name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the study session"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="groupId">Study Group *</Label>
          <Select
            value={formData.groupId}
            onValueChange={(value) => setFormData({ ...formData, groupId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select study group" />
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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Start Date & Time *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>End Date & Time *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

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

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Room Settings</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="2"
                max="50"
                value={formData.roomSettings?.maxParticipants?.toString() || '10'}
                onChange={(e) => {
                  const value = e.target.value === '' ? 10 : parseInt(e.target.value) || 10;
                  setFormData({
                    ...formData,
                    roomSettings: { ...formData.roomSettings, maxParticipants: value },
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isPublic">Public room</Label>
            <Switch
              id="isPublic"
              checked={formData.roomSettings?.isPublic}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  roomSettings: { ...formData.roomSettings, isPublic: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allowLateJoin">Allow late join</Label>
            <Switch
              id="allowLateJoin"
              checked={formData.roomSettings?.allowLateJoin}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  roomSettings: { ...formData.roomSettings, allowLateJoin: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enablePomodoro">Enable Pomodoro timer</Label>
            <Switch
              id="enablePomodoro"
              checked={formData.roomSettings?.enablePomodoro}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  roomSettings: { ...formData.roomSettings, enablePomodoro: checked },
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createRoomMutation.isPending}>
            {createRoomMutation.isPending ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const EditRoomForm = () => {
    const [formData, setFormData] = useState<CreateStudyRoomRequest>({
      name: editingRoom?.name || '',
      description: editingRoom?.description || '',
      groupId: editingRoom?.group._id || '',
      scheduledTime: {
        startTime: editingRoom?.scheduledTime.startTime || '',
        endTime: editingRoom?.scheduledTime.endTime || '',
        timezone: editingRoom?.scheduledTime.timezone || 'UTC',
      },
      subject: editingRoom?.subject || '',
      topics: editingRoom?.topics || [],
      roomSettings: {
        maxParticipants: editingRoom?.roomSettings.maxParticipants || 10,
        isPublic: editingRoom?.roomSettings.isPublic ?? true,
        requireApproval: editingRoom?.roomSettings.requireApproval ?? false,
        allowLateJoin: editingRoom?.roomSettings.allowLateJoin ?? true,
        enablePomodoro: editingRoom?.roomSettings.enablePomodoro ?? true,
        pomodoroSettings: editingRoom?.roomSettings.pomodoroSettings,
      },
      tags: editingRoom?.tags || [],
    });

    const [startDate, setStartDate] = useState<Date>(editingRoom ? new Date(editingRoom.scheduledTime.startTime) : new Date());
    const [startTime, setStartTime] = useState(editingRoom ? format(new Date(editingRoom.scheduledTime.startTime), 'HH:mm') : '09:00');
    const [endDate, setEndDate] = useState<Date>(editingRoom ? new Date(editingRoom.scheduledTime.endTime) : new Date());
    const [endTime, setEndTime] = useState(editingRoom ? format(new Date(editingRoom.scheduledTime.endTime), 'HH:mm') : '11:00');

    // Update form data when date/time changes - moved before conditional return
    React.useEffect(() => {
      if (startDate && startTime) {
        const [hours, minutes] = startTime.split(':');
        const datetime = new Date(startDate);
        datetime.setHours(parseInt(hours), parseInt(minutes));
        setFormData(prev => ({
          ...prev,
          scheduledTime: { ...prev.scheduledTime, startTime: datetime.toISOString() }
        }));
      }
    }, [startDate, startTime]);

    React.useEffect(() => {
      if (endDate && endTime) {
        const [hours, minutes] = endTime.split(':');
        const datetime = new Date(endDate);
        datetime.setHours(parseInt(hours), parseInt(minutes));
        setFormData(prev => ({
          ...prev,
          scheduledTime: { ...prev.scheduledTime, endTime: datetime.toISOString() }
        }));
      }
    }, [endDate, endTime]);

    if (!editingRoom) return null;

    // Generate time options
    const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
      const hour = Math.floor(i / 4);
      const minute = (i % 4) * 15;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      return {
        value: timeString,
        label: timeString,
      };
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      toast({
        title: 'Coming Soon',
        description: 'Room editing will be available once backend API is implemented!',
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Room Name *</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter room name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the study session"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-subject">Subject *</Label>
          <Input
            id="edit-subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Enter subject"
            required
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Start Date & Time *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>End Date & Time *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Room Settings</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-maxParticipants">Max Participants</Label>
              <Input
                id="edit-maxParticipants"
                type="number"
                min="2"
                max="50"
                value={formData.roomSettings?.maxParticipants?.toString() || '10'}
                onChange={(e) => {
                  const value = e.target.value === '' ? 10 : parseInt(e.target.value) || 10;
                  setFormData({
                    ...formData,
                    roomSettings: { ...formData.roomSettings, maxParticipants: value },
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-isPublic">Public room</Label>
            <Switch
              id="edit-isPublic"
              checked={formData.roomSettings?.isPublic}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  roomSettings: { ...formData.roomSettings, isPublic: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-allowLateJoin">Allow late join</Label>
            <Switch
              id="edit-allowLateJoin"
              checked={formData.roomSettings?.allowLateJoin}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  roomSettings: { ...formData.roomSettings, allowLateJoin: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-enablePomodoro">Enable Pomodoro timer</Label>
            <Switch
              id="edit-enablePomodoro"
              checked={formData.roomSettings?.enablePomodoro}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  roomSettings: { ...formData.roomSettings, enablePomodoro: checked },
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {
            setIsEditRoomOpen(false);
            setEditingRoom(null);
          }}>
            Cancel
          </Button>
          <Button type="submit">
            Update Room
          </Button>
        </DialogFooter>
      </form>
    );
  };

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
              Please log in to access study rooms and join virtual study sessions.
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const RoomCard = ({ room }: { room: StudyRoom }) => {
    const isUpcoming = new Date(room.scheduledTime.startTime) > new Date();
    const isActive = room.sessionStatus === 'active';
    const canJoin = isUpcoming || (isActive && room.roomSettings.allowLateJoin);
    
    // Check if current user is already a participant
    const isParticipant = room.participants.some(p => 
      p.user._id === user?.id && (p.status === 'registered' || p.status === 'joined')
    );
    const isHost = room.host._id === user?.id;

    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg line-clamp-1">{room.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {room.description || 'No description provided'}
              </CardDescription>
            </div>
            <Badge variant={isActive ? 'default' : isUpcoming ? 'secondary' : 'outline'}>
              {room.sessionStatus}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{room.subject}</Badge>
              {room.roomSettings.enablePomodoro && (
                <Badge variant="outline" className="text-xs">Pomodoro</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(room.scheduledTime.startTime), 'MMM dd')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(room.scheduledTime.startTime), 'HH:mm')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{room.participants.length}/{room.roomSettings.maxParticipants}</span>
              </div>
              <div className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                <span>{room.host.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {room.participants.slice(0, 3).map((participant) => (
                  <div
                    key={participant.user._id}
                    className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center"
                  >
                    <span className="text-white text-xs font-medium">
                      {participant.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
                {room.participants.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{room.participants.length - 3} more
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                {!isHost && (
                  <>
                    {isParticipant ? (
                      <Button size="sm" variant="outline" disabled>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Registered
                      </Button>
                    ) : canJoin ? (
                      <Button
                        size="sm"
                        onClick={() => joinRoomMutation.mutate(room._id)}
                        disabled={joinRoomMutation.isPending}
                      >
                        {isActive ? <Play className="h-4 w-4 mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                        {isActive ? 'Join' : 'Register'}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Unavailable
                      </Button>
                    )}
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedRoom(room);
                      setIsRoomDetailOpen(true);
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {isHost && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditRoom(room)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Room
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRoom(room._id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Room
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
          <h1 className="text-3xl font-bold">Study Rooms</h1>
          <p className="text-muted-foreground mt-1">
            Join virtual study sessions with your study groups
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedGroupId}>
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Study Room</DialogTitle>
              <DialogDescription>
                Schedule a virtual study session for your group
              </DialogDescription>
            </DialogHeader>
            <CreateRoomForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative w-80">
          <Popover open={isGroupSelectorOpen} onOpenChange={setIsGroupSelectorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isGroupSelectorOpen}
                className="w-full justify-between"
              >
                {selectedGroupId
                  ? userGroups?.data?.groups?.find((group: StudyGroup) => group._id === selectedGroupId)?.name
                  : "Select a study group..."}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Search groups..."
                  value={groupSearchQuery}
                  onChange={(e) => setGroupSearchQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {userGroups?.data?.groups?.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No study groups found. Create one first!
                  </div>
                ) : (
                  userGroups?.data?.groups
                    ?.filter((group: StudyGroup) =>
                      group.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
                      group.examTypes.some(exam => exam.toLowerCase().includes(groupSearchQuery.toLowerCase()))
                    )
                    ?.map((group: StudyGroup) => (
                      <div
                        key={group._id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between p-3 hover:bg-accent",
                          selectedGroupId === group._id && "bg-accent"
                        )}
                        onClick={() => {
                          setSelectedGroupId(group._id);
                          setIsGroupSelectorOpen(false);
                          setGroupSearchQuery('');
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{group.name}</div>
                          <div className="flex gap-1 mt-1">
                            {group.examTypes.map((exam) => (
                              <Badge key={exam} variant="outline" className="text-xs">
                                {exam}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {group.memberCount} members
                          </div>
                        </div>
                        {selectedGroupId === group._id && (
                          <Users className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))
                )}
                {userGroups?.data?.groups?.filter((group: StudyGroup) =>
                  group.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
                  group.examTypes.some(exam => exam.toLowerCase().includes(groupSearchQuery.toLowerCase()))
                ).length === 0 && groupSearchQuery && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No groups match your search.
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {selectedGroupId ? (
        <div>
          {/* Show info about room creation permissions */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Only group admins and moderators can create study rooms for this group.</span>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              {isLoadingRooms ? (
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
              ) : studyRooms?.data?.studyRooms?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {studyRooms.data.studyRooms.map((room: StudyRoom) => (
                    <RoomCard key={room._id} room={room} />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Study Rooms</h3>
                    <p className="text-muted-foreground mb-4">
                      No study rooms found for this group. Create one to get started!
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      Create Study Room
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a Study Group</h3>
            <p className="text-muted-foreground">
              Choose a study group to view and create study rooms
            </p>
          </CardContent>
        </Card>
      )}

      {/* Room Detail Dialog */}
      <Dialog open={isRoomDetailOpen} onOpenChange={setIsRoomDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRoom && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedRoom.name}</DialogTitle>
                <DialogDescription>
                  {selectedRoom.description || 'No description provided'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedRoom.subject}</Badge>
                  {selectedRoom.roomSettings.enablePomodoro && (
                    <Badge variant="outline" className="text-xs">Pomodoro</Badge>
                  )}
                  <Badge variant={selectedRoom.sessionStatus === 'active' ? 'default' : selectedRoom.sessionStatus === 'scheduled' ? 'secondary' : 'outline'}>
                    {selectedRoom.sessionStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Schedule</h4>
                    <div className="space-y-1 text-sm">
                      <p>Start: {format(new Date(selectedRoom.scheduledTime.startTime), 'MMM dd, yyyy HH:mm')}</p>
                      <p>End: {format(new Date(selectedRoom.scheduledTime.endTime), 'MMM dd, yyyy HH:mm')}</p>
                      <p>Duration: {Math.floor((new Date(selectedRoom.scheduledTime.endTime).getTime() - new Date(selectedRoom.scheduledTime.startTime).getTime()) / (1000 * 60))} minutes</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Room Settings</h4>
                    <div className="space-y-1 text-sm">
                      <p>Max Participants: {selectedRoom.roomSettings.maxParticipants}</p>
                      <p>Public: {selectedRoom.roomSettings.isPublic ? 'Yes' : 'No'}</p>
                      <p>Late Join: {selectedRoom.roomSettings.allowLateJoin ? 'Allowed' : 'Not Allowed'}</p>
                      <p>Pomodoro: {selectedRoom.roomSettings.enablePomodoro ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Host</h4>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {selectedRoom.host.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{selectedRoom.host.name}</span>
                    <Badge variant="default" className="text-xs">Host</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Participants ({selectedRoom.participants.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedRoom.participants.map((participant) => (
                      <div key={participant.user._id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {participant.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{participant.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={participant.role === 'host' ? 'default' : 'secondary'}>
                            {participant.role}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {participant.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRoom.roomSettings.enablePomodoro && (
                  <div>
                    <h4 className="font-medium mb-2">Pomodoro Settings</h4>
                    {selectedRoom.roomSettings.pomodoroSettings ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>Work Duration: {selectedRoom.roomSettings.pomodoroSettings.workDuration} min</div>
                        <div>Short Break: {selectedRoom.roomSettings.pomodoroSettings.shortBreak} min</div>
                        <div>Long Break: {selectedRoom.roomSettings.pomodoroSettings.longBreak} min</div>
                        <div>Cycles Before Long Break: {selectedRoom.roomSettings.pomodoroSettings.cyclesBeforeLongBreak}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Using default Pomodoro settings</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={isEditRoomOpen} onOpenChange={setIsEditRoomOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Study Room</DialogTitle>
            <DialogDescription>
              Update your study room settings and information
            </DialogDescription>
          </DialogHeader>
          {editingRoom && <EditRoomForm />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyRooms;
