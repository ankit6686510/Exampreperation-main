import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  BookOpen,
  Star,
  Trash2,
  Edit3,
  Play,
  Pause,
  MoreVertical,
  Target,
  Coffee,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface StudySession {
  _id: string;
  subject: string;
  topic?: string;
  startTime: string;
  endTime: string;
  duration: number;
  sessionType: string;
  productivity: number;
  mood: string;
  notes?: string;
  breaksTaken: number;
  isActive?: boolean;
  focusTime?: number;
  createdAt: string;
}

interface SessionCardProps {
  session: StudySession;
  onEdit: (session: StudySession) => void;
  onDelete: (id: string) => void;
  onResume?: (session: StudySession) => void;
  className?: string;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onEdit,
  onDelete,
  onResume,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getSessionTypeInfo = (type: string) => {
    const types = {
      Reading: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: BookOpen },
      Practice: { color: 'bg-green-100 text-green-800 border-green-200', icon: Target },
      Revision: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: TrendingUp },
      Test: { color: 'bg-red-100 text-red-800 border-red-200', icon: CheckCircle2 },
      Notes: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Edit3 }
    };
    return types[type as keyof typeof types] || types.Reading;
  };

  const getMoodInfo = (mood: string) => {
    const moods = {
      Excellent: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', emoji: '😊' },
      Good: { color: 'bg-blue-50 text-blue-700 border-blue-200', emoji: '🙂' },
      Average: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', emoji: '😐' },
      Poor: { color: 'bg-orange-50 text-orange-700 border-orange-200', emoji: '😞' },
      'Very Poor': { color: 'bg-red-50 text-red-700 border-red-200', emoji: '😓' }
    };
    return moods[mood as keyof typeof moods] || moods.Average;
  };

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 4) return 'text-green-600 bg-green-50';
    if (productivity >= 3) return 'text-blue-600 bg-blue-50';
    if (productivity >= 2) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const sessionTypeInfo = getSessionTypeInfo(session.sessionType);
  const moodInfo = getMoodInfo(session.mood);
  const TypeIcon = sessionTypeInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn("group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/60 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "p-2 rounded-lg border",
                  sessionTypeInfo.color
                )}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {session.subject}
                  </h3>
                  {session.topic && (
                    <p className="text-sm text-gray-600 mt-1">
                      {session.topic}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Time and Date */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(session.startTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                    isHovered && "opacity-100"
                  )}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(session)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Session
                </DropdownMenuItem>
                {onResume && (
                  <DropdownMenuItem onClick={() => onResume(session)}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Session
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(session._id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatDuration(session.duration)}
              </div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-lg font-bold inline-flex items-center gap-1 px-2 py-1 rounded-md",
                getProductivityColor(session.productivity)
              )}>
                {session.productivity}/5
                <Star className="h-3 w-3" />
              </div>
              <div className="text-xs text-gray-500">Productivity</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                {session.breaksTaken}
                <Coffee className="h-4 w-4" />
              </div>
              <div className="text-xs text-gray-500">Breaks</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Session Progress
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((session.focusTime || session.duration) / session.duration * 100)}%
              </span>
            </div>
            <Progress 
              value={(session.focusTime || session.duration) / session.duration * 100}
              className="h-2"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge 
              variant="outline" 
              className={cn("border", sessionTypeInfo.color)}
            >
              {session.sessionType}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn("border", moodInfo.color)}
            >
              {moodInfo.emoji} {session.mood}
            </Badge>
            {session.isActive && (
              <Badge className="bg-green-100 text-green-800 border-green-200 animate-pulse">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Active
              </Badge>
            )}
          </div>

          {/* Notes Preview */}
          {session.notes && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full justify-start text-gray-600 hover:text-gray-900 p-0 h-auto"
              >
                <div className="text-left">
                  <div className="font-medium text-xs uppercase tracking-wide mb-1">
                    Notes
                  </div>
                  <div className={cn(
                    "text-sm leading-relaxed transition-all duration-200",
                    showDetails ? "line-clamp-none" : "line-clamp-2"
                  )}>
                    {session.notes}
                  </div>
                </div>
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-gray-100"
              >
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEdit(session)}
                    className="flex-1"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  {onResume && (
                    <Button 
                      size="sm"
                      onClick={() => onResume(session)}
                      className="flex-1"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SessionCard;
