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
import { Plus, Trophy, Target, Calendar, Users, Timer, Star, TrendingUp, Award, Crown, Zap } from 'lucide-react';
import { studyGroupApi, type StudyGroup } from '@/api/studyGroupApi';
import { format } from 'date-fns';

// Placeholder interfaces until Challenge API is implemented
interface GroupChallenge {
  _id: string;
  title: string;
  description: string;
  group: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  type: 'study_hours' | 'streak' | 'goals_completed' | 'test_scores' | 'custom';
  criteria: {
    target: number;
    metric: string;
    period: string;
  };
  rewards: {
    points: number;
    badges: string[];
    achievements: string[];
  };
  duration: {
    startDate: string;
    endDate: string;
  };
  participants: Array<{
    user: {
      _id: string;
      name: string;
    };
    progress: number;
    rank: number;
    joinedAt: string;
  }>;
  status: 'upcoming' | 'active' | 'completed';
  isPublic: boolean;
  maxParticipants?: number;
  stats: {
    totalParticipants: number;
    averageProgress: number;
    completionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

const Challenges = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch user's groups
  const { data: userGroups } = useQuery({
    queryKey: ['study-groups', 'user'],
    queryFn: studyGroupApi.getUserGroups,
  });

  // Mock challenges data for now
  const mockChallenges: GroupChallenge[] = [
    {
      _id: '1',
      title: '30-Day Study Streak',
      description: 'Study for at least 2 hours every day for 30 consecutive days',
      group: { _id: '1', name: 'UPSC Preparation 2024' },
      createdBy: { _id: '1', name: 'John Doe' },
      type: 'streak',
      criteria: { target: 30, metric: 'days', period: '30_days' },
      rewards: { points: 500, badges: ['Consistency Champion'], achievements: ['Study Streak Master'] },
      duration: { 
        startDate: new Date().toISOString(), 
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
      },
      participants: [
        { user: { _id: '1', name: 'John Doe' }, progress: 85, rank: 1, joinedAt: new Date().toISOString() },
        { user: { _id: '2', name: 'Jane Smith' }, progress: 72, rank: 2, joinedAt: new Date().toISOString() },
      ],
      status: 'active',
      isPublic: true,
      maxParticipants: 50,
      stats: { totalParticipants: 15, averageProgress: 65, completionRate: 40 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      title: 'Weekly Study Hours Challenge',
      description: 'Complete 40 hours of focused study this week',
      group: { _id: '1', name: 'UPSC Preparation 2024' },
      createdBy: { _id: '2', name: 'Jane Smith' },
      type: 'study_hours',
      criteria: { target: 40, metric: 'hours', period: '7_days' },
      rewards: { points: 200, badges: ['Time Master'], achievements: [] },
      duration: { 
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() 
      },
      participants: [
        { user: { _id: '1', name: 'John Doe' }, progress: 62.5, rank: 2, joinedAt: new Date().toISOString() },
        { user: { _id: '2', name: 'Jane Smith' }, progress: 75, rank: 1, joinedAt: new Date().toISOString() },
        { user: { _id: '3', name: 'Mike Johnson' }, progress: 55, rank: 3, joinedAt: new Date().toISOString() },
      ],
      status: 'active',
      isPublic: true,
      stats: { totalParticipants: 8, averageProgress: 58, completionRate: 25 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const CreateChallengeForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      groupId: selectedGroupId,
      type: 'study_hours',
      target: 0,
      period: '7_days',
      points: 100,
      isPublic: true,
      maxParticipants: 50,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // This would call the challenge API when implemented
      toast({
        title: 'Coming Soon',
        description: 'Challenge creation will be available in the next update!',
      });
      setIsCreateDialogOpen(false);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Challenge Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter challenge title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the challenge"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Challenge Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="study_hours">Study Hours</SelectItem>
                <SelectItem value="streak">Study Streak</SelectItem>
                <SelectItem value="goals_completed">Goals Completed</SelectItem>
                <SelectItem value="test_scores">Test Scores</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Duration</Label>
            <Select
              value={formData.period}
              onValueChange={(value) => setFormData({ ...formData, period: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7_days">1 Week</SelectItem>
                <SelectItem value="14_days">2 Weeks</SelectItem>
                <SelectItem value="30_days">1 Month</SelectItem>
                <SelectItem value="90_days">3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="target">Target</Label>
            <Input
              id="target"
              type="number"
              min="1"
              value={formData.target.toString()}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                setFormData({ ...formData, target: value });
              }}
              placeholder="Enter target value"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Reward Points</Label>
            <Input
              id="points"
              type="number"
              min="10"
              value={formData.points.toString()}
              onChange={(e) => {
                const value = e.target.value === '' ? 100 : parseInt(e.target.value) || 100;
                setFormData({ ...formData, points: value });
              }}
              placeholder="Points to award"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">
            Create Challenge
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const ChallengeCard = ({ challenge }: { challenge: GroupChallenge }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'default';
        case 'upcoming': return 'secondary';
        case 'completed': return 'outline';
        default: return 'outline';
      }
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'study_hours': return Timer;
        case 'streak': return Zap;
        case 'goals_completed': return Target;
        case 'test_scores': return TrendingUp;
        default: return Trophy;
      }
    };

    const TypeIcon = getTypeIcon(challenge.type);
    const progressPercentage = Math.min(100, challenge.stats.averageProgress);

    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <TypeIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg line-clamp-1">{challenge.title}</CardTitle>
              </div>
              <CardDescription className="line-clamp-2">
                {challenge.description}
              </CardDescription>
            </div>
            <Badge variant={getStatusColor(challenge.status)}>
              {challenge.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                </div>
                <p className="font-medium">{challenge.stats.totalParticipants}</p>
                <p className="text-xs text-muted-foreground">Participants</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Award className="h-4 w-4" />
                </div>
                <p className="font-medium">{challenge.rewards.points}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                </div>
                <p className="font-medium">
                  {Math.ceil((new Date(challenge.duration.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                </p>
                <p className="text-xs text-muted-foreground">Days left</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Crown className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium">{challenge.createdBy.name}</span>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Trophy className="h-4 w-4 mr-1" />
                  Leaderboard
                </Button>
                <Button size="sm">
                  Join Challenge
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredChallenges = mockChallenges.filter(challenge => {
    if (activeTab === 'all') return true;
    return challenge.status === activeTab;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Group Challenges</h1>
          <p className="text-muted-foreground mt-1">
            Compete with your study group members and achieve your goals together
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedGroupId}>
              <Plus className="h-4 w-4 mr-2" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Group Challenge</DialogTitle>
              <DialogDescription>
                Create a motivating challenge for your study group
              </DialogDescription>
            </DialogHeader>
            <CreateChallengeForm />
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

      {selectedGroupId ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredChallenges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChallenges.map((challenge) => (
                  <ChallengeCard key={challenge._id} challenge={challenge} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Challenges Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No {activeTab} challenges found for this group. Create one to get started!
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    Create Challenge
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a Study Group</h3>
            <p className="text-muted-foreground">
              Choose a study group to view and create challenges
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Challenges;
