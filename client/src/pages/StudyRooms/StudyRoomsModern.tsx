import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Plus, Video, Calendar, Clock, Users, Play, CalendarIcon, Sparkles, TrendingUp, Zap, Coffee, BookOpen, Target } from 'lucide-react';
import { studyRoomApi, type StudyRoom, type CreateStudyRoomRequest } from '@/api/studyRoomApi';
import { studyGroupApi, type StudyGroup } from '@/api/studyGroupApi';
import { useAppSelector } from '@/redux/hooks';
import { format } from 'date-fns';

const StudyRoomsModern = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);

  const { data: userGroups } = useQuery({
    queryKey: ['study-groups', 'user'],
    queryFn: studyGroupApi.getUserGroups,
    enabled: !!user,
  });

  const { data: studyRooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['study-rooms', selectedGroupId, activeTab],
    queryFn: () => studyRoomApi.getGroupStudyRooms(selectedGroupId, {
      upcoming: activeTab === 'upcoming',
      status: activeTab === 'all' ? undefined : activeTab,
    }),
    enabled: !!selectedGroupId,
  });

  const { data: allRooms } = useQuery({
    queryKey: ['study-rooms', selectedGroupId, 'all-stats'],
    queryFn: () => studyRoomApi.getGroupStudyRooms(selectedGroupId, {}),
    enabled: !!selectedGroupId,
  });

  const statistics = React.useMemo(() => {
    if (!allRooms?.data?.studyRooms) {
      return {
        activeSessions: 0,
        totalParticipants: 0,
        totalStudyTime: 0,
        upcomingSessions: 0,
      };
    }

    const rooms = allRooms.data.studyRooms;
    const activeSessions = rooms.filter((r: StudyRoom) => r.sessionStatus === 'active').length;
    const upcomingSessions = rooms.filter((r: StudyRoom) => 
      r.sessionStatus === 'scheduled' && new Date(r.scheduledTime.startTime) > new Date()
    ).length;
    
    const totalParticipants = rooms.reduce((sum: number, room: StudyRoom) => 
      sum + room.participants.filter(p => p.status === 'joined').length, 0
    );
    
    const totalStudyTime = rooms
      .filter((r: StudyRoom) => r.sessionStatus === 'completed')
      .reduce((sum: number, room: StudyRoom) => {
        if (room.actualTimes?.actualStartTime && room.actualTimes?.actualEndTime) {
          const duration = new Date(room.actualTimes.actualEndTime).getTime() - 
                          new Date(room.actualTimes.actualStartTime).getTime();
          return sum + duration;
        }
        return sum;
      }, 0);

    const totalHours = Math.round(totalStudyTime / (1000 * 60 * 60));

    return {
      activeSessions,
      totalParticipants,
      totalStudyTime: totalHours,
      upcomingSessions,
    };
  }, [allRooms]);

  const createRoomMutation = useMutation({
    mutationFn: studyRoomApi.createStudyRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-rooms'] });
      setIsCreateDialogOpen(false);
      toast({
        title: '🎉 Room Created!',
        description: 'Your study session is ready to go.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create study room';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

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

    const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
      const hour = Math.floor(i / 4);
      const minute = (i % 4) * 15;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      return { value: timeString, label: timeString };
    });

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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Room Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Morning Focus Session"
              className="h-11 text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will you study together?"
              rows={3}
              className="resize-none text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId" className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Study Group
            </Label>
            <Select
              value={formData.groupId}
              onValueChange={(value) => setFormData({ ...formData, groupId: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Choose your group" />
              </SelectTrigger>
              <SelectContent>
                {userGroups?.data?.groups?.map((group: StudyGroup) => (
                  <SelectItem key={group._id} value={group._id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Start Time
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-11 justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM dd") : "Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
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
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                End Time
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-11 justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM dd") : "Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
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
            <Label htmlFor="subject" className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Subject
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Mathematics, History"
              className="h-11 text-base"
              required
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Room Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Max Participants</Label>
                <p className="text-xs text-muted-foreground">Set the room capacity</p>
              </div>
              <Input
                type="number"
                min="2"
                max="50"
                value={formData.roomSettings.maxParticipants}
                onChange={(e) => setFormData({
                  ...formData,
                  roomSettings: { ...formData.roomSettings, maxParticipants: parseInt(e.target.value) }
                })}
                className="w-20 h-9"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Public Room</Label>
                <p className="text-xs text-muted-foreground">Anyone in the group can join</p>
              </div>
              <Switch
                checked={formData.roomSettings.isPublic}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  roomSettings: { ...formData.roomSettings, isPublic: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Allow Late Join</Label>
                <p className="text-xs text-muted-foreground">Members can join after start</p>
              </div>
              <Switch
                checked={formData.roomSettings.allowLateJoin}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  roomSettings: { ...formData.roomSettings, allowLateJoin: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-orange-500" />
                  Pomodoro Timer
                </Label>
                <p className="text-xs text-muted-foreground">25 min focus + 5 min breaks</p>
              </div>
              <Switch
                checked={formData.roomSettings.enablePomodoro}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  roomSettings: { ...formData.roomSettings, enablePomodoro: checked }
                })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCreateDialogOpen(false)}
            className="h-11"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createRoomMutation.isPending}
            className="h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {createRoomMutation.isPending ? (
              <>Creating...</>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Room
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/60">
              <Video className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Study Rooms
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Join virtual study sessions and collaborate with your peers
          </p>
        </div>

        {selectedGroupId && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/10">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {!allRooms ? (
                        <span className="inline-block h-7 w-12 bg-muted animate-pulse rounded" />
                      ) : (
                        statistics.activeSessions
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/10">
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {!allRooms ? (
                        <span className="inline-block h-7 w-12 bg-muted animate-pulse rounded" />
                      ) : (
                        statistics.totalParticipants
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Participants</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/10">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {!allRooms ? (
                        <span className="inline-block h-7 w-16 bg-muted animate-pulse rounded" />
                      ) : (
                        `${statistics.totalStudyTime}h`
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Study Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-500/10">
                    <Calendar className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {!allRooms ? (
                        <span className="inline-block h-7 w-12 bg-muted animate-pulse rounded" />
                      ) : (
                        statistics.upcomingSessions
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-full sm:w-[300px] h-11">
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

          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={!selectedGroupId}
            className="h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Study Room
          </Button>
        </div>

        {selectedGroupId && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-11">
                  <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Completed
                  </TabsTrigger>
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    All
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {isLoadingRooms ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-4 text-muted-foreground">Loading rooms...</p>
                </div>
              ) : !studyRooms?.data?.studyRooms || studyRooms.data.studyRooms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No study rooms yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first study room to get started</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Room
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studyRooms?.data?.studyRooms?.map((room: StudyRoom) => (
                    <Card key={room._id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{room.name}</CardTitle>
                          <Badge variant={room.sessionStatus === 'active' ? 'default' : 'secondary'}>
                            {room.sessionStatus}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">{room.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(room.scheduledTime.startTime), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(new Date(room.scheduledTime.startTime), 'HH:mm')} - {format(new Date(room.scheduledTime.endTime), 'HH:mm')}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {room.participants.length} / {room.roomSettings.maxParticipants} participants
                        </div>
                        <Button className="w-full mt-4" variant={room.sessionStatus === 'active' ? 'default' : 'outline'}>
                          <Play className="mr-2 h-4 w-4" />
                          {room.sessionStatus === 'active' ? 'Join Now' : 'Register'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Create Study Room
              </DialogTitle>
              <DialogDescription>
                Schedule a virtual study session for your group
              </DialogDescription>
            </DialogHeader>
            <CreateRoomForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudyRoomsModern;