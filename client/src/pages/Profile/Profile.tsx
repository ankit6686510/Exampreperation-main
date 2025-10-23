import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { logout, fetchProfile } from '@/redux/slices/authSlice';
import axiosInstance from '@/api/axiosInstance';
import { 
  User, 
  Settings, 
  Trophy, 
  BarChart3, 
  Target, 
  Calendar,
  Download,
  Upload,
  Bell,
  Palette,
  Clock,
  Flame,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Star,
  Award,
  Activity,
  Eye,
  Shield,
  Smartphone
} from 'lucide-react';

const Profile = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { plans } = useAppSelector((state) => state.monthlyPlans);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    examTypes: user?.examTypes || [],
    examDate: user?.examDate ? new Date(user.examDate).toISOString().split('T')[0] : '',
    bio: '',
    location: '',
    institution: '',
  });

  const [preferences, setPreferences] = useState({
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      studyReminders: true,
      goalDeadlines: true,
      weeklyProgress: false,
    },
    privacy: {
      profileVisible: true,
      progressVisible: false,
      achievementsVisible: true,
    },
    study: {
      defaultSessionDuration: 60,
      breakDuration: 15,
      dailyGoalHours: 4,
      weeklyGoalHours: 28,
    }
  });

  const availableExamTypes = ['UPSC', 'SSC', 'Banking', 'Railway', 'State PSC', 'Defense', 'Teaching', 'Other'];
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        examTypes: user.examTypes || [],
        examDate: user.examDate ? new Date(user.examDate).toISOString().split('T')[0] : '',
        bio: '',
        location: '',
        institution: '',
      });
    }
  }, [user]);

  // Calculate study statistics
  const calculateStats = () => {
    const totalPlans = plans.length;
    const completedPlans = plans.filter(p => p.completed).length;
    const inProgressPlans = plans.filter(p => !p.completed && p.progressPercentage > 0).length;
    const completionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;
    
    const totalHours = plans.reduce((sum, plan) => {
      const multiplier = plan.targetType === 'hours' ? 1 : 
                       plan.targetType === 'chapters' ? 3 : 
                       plan.targetType === 'topics' ? 2 : 1;
      return sum + (plan.targetAmount * multiplier * (plan.progressPercentage || 0) / 100);
    }, 0);

    // Remove fake data - no real session tracking available
    const currentStreak = 0; 
    const totalSessions = 0;
    
    return {
      totalPlans,
      completedPlans,
      inProgressPlans,
      completionRate,
      totalHours: Math.round(totalHours),
      currentStreak,
      totalSessions
    };
  };

  const stats = calculateStats();

  // Calculate achievements
  const calculateAchievements = () => {
    const achievements = [];
    
    if (stats.completedPlans >= 1) {
      achievements.push({ id: 'first_plan', name: 'First Steps', description: 'Complete your first monthly plan', icon: '🎯', unlocked: true });
    }
    if (stats.completedPlans >= 5) {
      achievements.push({ id: 'consistent_learner', name: 'Consistent Learner', description: 'Complete 5 monthly plans', icon: '📚', unlocked: true });
    }
    if (stats.currentStreak >= 7) {
      achievements.push({ id: 'week_warrior', name: 'Week Warrior', description: 'Study for 7 consecutive days', icon: '🔥', unlocked: true });
    }
    if (stats.totalHours >= 50) {
      achievements.push({ id: 'time_master', name: 'Time Master', description: 'Complete 50 hours of study', icon: '⏰', unlocked: true });
    }
    if (stats.completionRate >= 80) {
      achievements.push({ id: 'excellence', name: 'Excellence', description: 'Maintain 80% completion rate', icon: '⭐', unlocked: true });
    }

    // Add locked achievements
    if (stats.completedPlans < 10) {
      achievements.push({ id: 'perfect_ten', name: 'Perfect Ten', description: 'Complete 10 monthly plans', icon: '🏆', unlocked: false });
    }
    if (stats.currentStreak < 30) {
      achievements.push({ id: 'month_master', name: 'Month Master', description: 'Study for 30 consecutive days', icon: '👑', unlocked: false });
    }
    
    return achievements;
  };

  const achievements = calculateAchievements();

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.name.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }
    if (profileData.examTypes.length === 0) {
      toast({ variant: 'destructive', title: 'Please select at least one exam type' });
      return;
    }
    if (!profileData.examDate) {
      toast({ variant: 'destructive', title: 'Exam date is required' });
      return;
    }

    try {
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        examTypes: profileData.examTypes,
        examDate: new Date(profileData.examDate).toISOString(),
      };
      
      const response = await axiosInstance.put('/auth/profile', updateData);
      
      if (response.data.success && response.data.data.user) {
        await dispatch(fetchProfile());
        toast({ 
          title: 'Profile updated successfully!', 
          description: 'Your profile information has been updated.' 
        });
        setIsEditing(false);
      }
      
    } catch (error: unknown) {
      console.error('Profile update error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Update failed',
        description: 'Failed to update profile'
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    try {
      await axiosInstance.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast({ title: 'Password changed successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Password change failed' });
    }
  };

  const handleExamTypeChange = (examType: string, checked: boolean) => {
    if (checked) {
      setProfileData({ ...profileData, examTypes: [...profileData.examTypes, examType] });
    } else {
      setProfileData({ 
        ...profileData, 
        examTypes: profileData.examTypes.filter(type => type !== examType) 
      });
    }
  };

  const handleExportData = () => {
    const data = {
      profile: user,
      plans: plans,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `examprep-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Data exported successfully' });
  };

  const daysUntilExam = user?.examDate 
    ? Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="mt-1 text-muted-foreground">Manage your account information</p>
        </div>
        <div className="flex items-center gap-4">
          {daysUntilExam && (
            <Badge variant="outline" className="text-sm">
              <Calendar className="h-3 w-3 mr-1" />
              {daysUntilExam} days until exam
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Details
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Change Password
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{user?.name || 'Not set'}</h3>
                        <p className="text-muted-foreground">{user?.email || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                        <p className="mt-1">{profileData.location || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Institution</Label>
                        <p className="mt-1">{profileData.institution || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Bio</Label>
                      <p className="mt-1">{profileData.bio || 'No bio added yet'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Exam Goals</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {user?.examTypes && user.examTypes.length > 0 ? (
                          user.examTypes.map((examType) => (
                            <Badge key={examType} variant="secondary">
                              {examType}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No exam goals set</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Target Exam Date</Label>
                      <p className="mt-1">
                        {user?.examDate 
                          ? new Date(user.examDate).toLocaleDateString() 
                          : 'Not set'
                        }
                      </p>
                    </div>
                    
                    <Button onClick={() => setIsEditing(true)} className="mt-4">
                      Edit Profile
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                          placeholder="Your city, country"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="institution">Institution</Label>
                        <Input
                          id="institution"
                          value={profileData.institution}
                          onChange={(e) => setProfileData({ ...profileData, institution: e.target.value })}
                          placeholder="College/University"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Input
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder="Tell us about yourself"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Exam Goals * (Select all that apply)</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {availableExamTypes.map((examType) => (
                          <div key={examType} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${examType}`}
                              checked={profileData.examTypes.includes(examType)}
                              onCheckedChange={(checked) => handleExamTypeChange(examType, checked as boolean)}
                            />
                            <Label htmlFor={`edit-${examType}`} className="text-sm font-normal">
                              {examType}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="examDate">Target Exam Date *</Label>
                      <Input
                        id="examDate"
                        type="date"
                        value={profileData.examDate}
                        onChange={(e) => setProfileData({ ...profileData, examDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit">Save Changes</Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Removed sidebar stats - keeping profile minimal */}
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                  />
                </div>
                <Button type="submit">Change Password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
