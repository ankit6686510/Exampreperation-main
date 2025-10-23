import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Book,
  Clock,
  Target,
  Award,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Minus,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { Book as BookType } from '@/redux/slices/bookSlice';
import { useAppDispatch } from '@/redux/hooks';
import { updateBook, deleteBook } from '@/redux/slices/bookSlice';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface EnhancedBookCardProps {
  book: BookType;
  onEdit: (book: BookType) => void;
  onViewDetails: (book: BookType) => void;
  onQuickChapterUpdate: (bookId: string, increment: number) => void;
}

const EnhancedBookCard = ({ 
  book, 
  onEdit, 
  onViewDetails, 
  onQuickChapterUpdate 
}: EnhancedBookCardProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await dispatch(deleteBook(book.id));
        toast({ title: 'Book deleted successfully' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Failed to delete book' });
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusInfo = () => {
    const { completedChapters, totalChapters, chapters } = book;
    const chaptersNeedingRevision = chapters?.filter(ch => ch.status === 'needs_revision').length || 0;
    
    if (completedChapters === totalChapters && totalChapters > 0) {
      return {
        status: 'Completed',
        color: 'text-green-600',
        icon: Award,
        bgColor: 'bg-green-50'
      };
    }
    
    if (chaptersNeedingRevision > 0) {
      return {
        status: 'Needs Revision',
        color: 'text-orange-600',
        icon: RefreshCw,
        bgColor: 'bg-orange-50'
      };
    }
    
    if (completedChapters > 0) {
      return {
        status: 'In Progress',
        color: 'text-blue-600',
        icon: TrendingUp,
        bgColor: 'bg-blue-50'
      };
    }
    
    return {
      status: 'Not Started',
      color: 'text-gray-600',
      icon: BookOpen,
      bgColor: 'bg-gray-50'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Calculate progress percentage properly
  const progressPercentage = book.totalChapters > 0 
    ? Math.round((book.completedChapters / book.totalChapters) * 100)
    : 0;

  // Calculate chapters needing revision from the actual chapter data
  const chaptersNeedingRevision = book.chapters?.filter(ch => ch.status === 'needs_revision').length || 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg truncate" title={book.title}>
                {book.title}
              </CardTitle>
              <Badge 
                className={`text-xs border ${getPriorityColor(book.priority)}`}
                variant="outline"
              >
                {book.priority}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground truncate" title={book.subject}>
                📚 {book.subject}
              </p>
              {book.author && (
                <p className="text-xs text-muted-foreground truncate" title={book.author}>
                  ✍️ {book.author}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(book)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(book)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Book
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Book
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium w-fit ${statusInfo.bgColor} ${statusInfo.color}`}>
          <StatusIcon className="h-3 w-3" />
          {statusInfo.status}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {book.completedChapters} / {book.totalChapters} chapters
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{progressPercentage}% completed</span>
            {chaptersNeedingRevision > 0 && (
              <span className="text-orange-600 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                {chaptersNeedingRevision} need revision
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {book.tags && book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {book.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {book.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{book.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Quick Actions - Only Details Button */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(book)}
            className="w-full text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>

        {/* Created Date */}
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Added {format(new Date(book.createdAt), 'MMM dd, yyyy')}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedBookCard;
