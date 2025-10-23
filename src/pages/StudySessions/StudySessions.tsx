import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Clock, BookOpen, TrendingUp, Filter } from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/store';
import {
  fetchStudySessions,
  createStudySession,
  deleteStudySession,
  fetchStudyAnalytics,
  clearError
} from '../../redux/slices/studySessionSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { CreateStudySessionRequest } from '../../api/studySessionApi';

const StudySessions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { sessions, analytics, isLoading, error } = useSelector((state: RootState) => state.studySessions);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [analyticsFilter, setAnalyticsFilter] = useState<'7d' | '30d' | '90d'>('7d');
  const [formData, setFormData] = useState<CreateStudySessionRequest>({
    subject: '',
    topic: '',
    startTime: '',
    endTime: '',
    sessionType: 'Reading',
    productivity: 3,
    notes: '',
    breaksTaken: 0,
    mood: 'Good'
  });

  useEffect(() => {
    dispatch(fetchStudySessions({}));
    dispatch(fetchStudyAnalytics(analyticsFilter));
  }, [dispatch, analyticsFilter]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(createStudySession(formData)).unwrap();
      setShowCreateDialog(false);
      setFormData({
        subject: '',
        topic: '',
        startTime: '',
        endTime: '',
        sessionType: 'Reading',
        productivity: 3,
        notes: '',
        breaksTaken: 0,
        mood: 'Good'
      });
      toast({
        title: 'Success',
        description: 'Study session created successfully',
      });
      dispatch(fetchStudyAnalytics(analyticsFilter));
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await dispatch(deleteStudySession(id)).unwrap();
      toast({
        title: 'Success',
        description: 'Study session deleted successfully',
      });
      dispatch(fetchStudyAnalytics(analyticsFilter));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Average': return 'bg-yellow-100 text-yellow-800';
      case 'Poor': return 'bg-orange-100 text-orange-800';
      case 'Very Poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'Reading': return 'bg-purple-100 text-purple-800';
      case 'Practice': return 'bg-green-100 text-green-800';
      case 'Revision': return 'bg-blue-100 text-blue-800';
      case 'Test': return 'bg-red-100 text-red-800';
      case 'Notes': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Study Sessions</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Study Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic">Topic (Optional)</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionType">Session Type</Label>
                  <Select value={formData.sessionType} onValueChange={(value) => setFormData({...formData, sessionType: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reading">Reading</SelectItem>
                      <SelectItem value="Practice">Practice</SelectItem>
                      <SelectItem value="Revision">Revision</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                      <SelectItem value="Notes">Notes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mood">Mood</Label>
                  <Select value={formData.mood} onValueChange={(value) => setFormData({...formData, mood: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                      <SelectItem value="Very Poor">Very Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productivity">Productivity (1-5)</Label>
                  <Input
                    id="productivity"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.productivity}
                    onChange={(e) => setFormData({...formData, productivity: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="breaksTaken">Breaks Taken</Label>
                  <Input
                    id="breaksTaken"
                    type="number"
                    min="0"
                    value={formData.breaksTaken}
                    onChange={(e) => setFormData({...formData, breaksTaken: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                Create Session
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Cards */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <Select value={analyticsFilter} onValueChange={(value) => setAnalyticsFilter(value as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalHours}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Productivity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageProductivity}/5</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Subject</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {Object.keys(analytics.subjectBreakdown).length > 0 
                  ? Object.entries(analytics.subjectBreakdown).sort(([,a], [,b]) => b - a)[0][0]
                  : 'No data'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No study sessions found. Create your first session to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session._id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{session.subject}</h3>
                        {session.topic && (
                          <span className="text-sm text-muted-foreground">- {session.topic}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(session.startTime).toLocaleString()} - 
                        {new Date(session.endTime).toLocaleTimeString()} 
                        ({session.duration} mins)
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSession(session._id)}
                    >
                      Delete
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getSessionTypeColor(session.sessionType)}`}>
                      {session.sessionType}
                    </div>
                    <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getMoodColor(session.mood)}`}>
                      {session.mood}
                    </div>
                    <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border border-gray-300 bg-white text-gray-700">
                      Productivity: {session.productivity}/5
                    </div>
                    {session.breaksTaken > 0 && (
                      <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border border-gray-300 bg-white text-gray-700">
                        {session.breaksTaken} breaks
                      </div>
                    )}
                  </div>
                  
                  {session.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudySessions;
