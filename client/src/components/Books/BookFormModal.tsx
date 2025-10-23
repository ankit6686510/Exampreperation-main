import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Book, 
  Plus, 
  X, 
  Save, 
  BookOpen, 
  User, 
  Hash, 
  Calendar,
  Tag,
  Target,
  FileText,
  Layers
} from 'lucide-react';
import { Book as BookType } from '@/redux/slices/bookSlice';
import { useAppDispatch } from '@/redux/hooks';
import { addBook, updateBook } from '@/redux/slices/bookSlice';
import { useToast } from '@/hooks/use-toast';

interface BookFormModalProps {
  book: BookType | null;
  isOpen: boolean;
  onClose: () => void;
}

const BookFormModal = ({ book, isOpen, onClose }: BookFormModalProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    subject: '',
    isbn: '',
    edition: '',
    publishedYear: new Date().getFullYear(),
    totalChapters: 10,
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[]
  });

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        subject: book.subject || '',
        isbn: book.isbn || '',
        edition: book.edition || '',
        publishedYear: book.publishedYear || new Date().getFullYear(),
        totalChapters: book.totalChapters || 10,
        notes: book.notes || '',
        priority: book.priority || 'medium',
        tags: book.tags || []
      });
    } else {
      setFormData({
        title: '',
        author: '',
        subject: '',
        isbn: '',
        edition: '',
        publishedYear: new Date().getFullYear(),
        totalChapters: 10,
        notes: '',
        priority: 'medium',
        tags: []
      });
    }
    setTagInput('');
  }, [book, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (book) {
        await dispatch(updateBook({ id: book.id, data: formData }));
        toast({ title: 'Book updated successfully' });
      } else {
        await dispatch(addBook(formData));
        toast({ title: 'Book added successfully' });
      }
      onClose();
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: book ? 'Failed to update book' : 'Failed to add book' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const predefinedSubjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'Political Science',
    'Economics',
    'English Literature',
    'Computer Science',
    'Engineering',
    'Medical',
    'Law',
    'Philosophy',
    'Psychology',
    'UPSC Preparation',
    'Other'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            {book ? 'Edit Book' : 'Add New Book'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter book title..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="author">Author</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Author name..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">
                    Subject <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="isbn">ISBN</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                      placeholder="978-0-123456-78-9"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edition">Edition</Label>
                  <Input
                    id="edition"
                    value={formData.edition}
                    onChange={(e) => setFormData(prev => ({ ...prev, edition: e.target.value }))}
                    placeholder="1st, 2nd, Latest..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Study Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalChapters">
                    Total Chapters <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="totalChapters"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.totalChapters}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      totalChapters: parseInt(e.target.value) || 1 
                    }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="publishedYear">Published Year</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="publishedYear"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={formData.publishedYear}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        publishedYear: parseInt(e.target.value) || new Date().getFullYear() 
                      }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      priority: value as 'low' | 'medium' | 'high' 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-green-600" />
                          Low Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-yellow-600" />
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-red-600" />
                          High Priority
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag and press Enter..."
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} size="sm" variant="outline">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Tags help you organize and filter your books
              </p>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this book..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Optional notes about the book, study approach, or any other relevant information
              </p>
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {book ? 'Update Book' : 'Add Book'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookFormModal;
