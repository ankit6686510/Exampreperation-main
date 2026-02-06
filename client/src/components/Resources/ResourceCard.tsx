import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  Link as LinkIcon,
  FileText,
  Globe,
  Upload,
  StickyNote,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Resource } from '@/redux/slices/resourceSlice';

interface ResourceCardProps {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
  onBookmark: (id: string) => void;
  onAccess: (id: string, link: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  showCheckbox?: boolean;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getLinkTypeIcon = (linkType: string) => {
  switch (linkType) {
    case 'external_url':
      return <Globe className="h-4 w-4" />;
    case 'file_upload':
      return <Upload className="h-4 w-4" />;
    case 'notes':
      return <StickyNote className="h-4 w-4" />;
    case 'document':
      return <FileText className="h-4 w-4" />;
    default:
      return <LinkIcon className="h-4 w-4" />;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const ResourceCard = ({
  resource,
  onEdit,
  onDelete,
  onBookmark,
  onAccess,
  isSelected = false,
  onToggleSelect,
  showCheckbox = false
}: ResourceCardProps) => {
  const { toast } = useToast();
  const [isBookmarking, setIsBookmarking] = useState(false);

  const handleAccess = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onAccess(resource._id, resource.link);
      
      // Open link based on type
      if (resource.linkType === 'external_url') {
        window.open(resource.link, '_blank', 'noopener,noreferrer');
      } else {
        // For files and notes, we might want to handle differently
        toast({
          title: 'Access recorded',
          description: 'Resource access has been tracked'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to access resource'
      });
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarking(true);
    try {
      await onBookmark(resource._id);
      toast({
        title: resource.isBookmarked ? 'Bookmark removed' : 'Bookmark added',
        description: `Resource ${resource.isBookmarked ? 'removed from' : 'added to'} bookmarks`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update bookmark'
      });
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(resource);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(resource._id);
  };

  const handleToggleSelect = () => {
    onToggleSelect?.(resource._id);
  };

  return (
    <Card className={`group hover:shadow-md transition-all duration-200 relative ${
      isSelected ? 'ring-2 ring-primary' : ''
    }`}>
      {showCheckbox && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleToggleSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={`flex-1 ${showCheckbox ? 'ml-8' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              {getLinkTypeIcon(resource.linkType)}
              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {resource.title}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {resource.category}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${getPriorityColor(resource.priority)}`}
              >
                {resource.priority}
              </Badge>
              {resource.isBookmarked && (
                <BookmarkCheck className="h-3 w-3 text-yellow-500" />
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleAccess}>
                <Eye className="mr-2 h-4 w-4" />
                View Resource
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBookmark} disabled={isBookmarking}>
                {resource.isBookmarked ? (
                  <>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Remove Bookmark
                  </>
                ) : (
                  <>
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                    Add Bookmark
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {resource.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {resource.description}
          </p>
        )}

        {resource.linkPreview && (
          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{resource.linkPreview}</span>
          </div>
        )}

        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{resource.accessCount}</span>
            </div>
            {resource.lastAccessedAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(resource.lastAccessedAt)}</span>
              </div>
            )}
          </div>
          <span>{formatDate(resource.createdAt)}</span>
        </div>

        {resource.relatedBooks.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">Related Books:</p>
            <div className="flex flex-wrap gap-1">
              {resource.relatedBooks.slice(0, 2).map((book) => (
                <Badge key={book._id} variant="outline" className="text-xs">
                  {book.title}
                </Badge>
              ))}
              {resource.relatedBooks.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{resource.relatedBooks.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAccess}
            className="flex-1"
          >
            <ExternalLink className="mr-2 h-3 w-3" />
            Open
          </Button>
          <Button
            size="sm"
            variant={resource.isBookmarked ? "default" : "outline"}
            onClick={handleBookmark}
            disabled={isBookmarking}
          >
            {resource.isBookmarked ? (
              <BookmarkCheck className="h-3 w-3" />
            ) : (
              <Bookmark className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceCard;
