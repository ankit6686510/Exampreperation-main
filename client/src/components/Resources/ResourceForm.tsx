import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Resource } from '@/redux/slices/resourceSlice';
import { RESOURCE_CONFIG, LinkType, Priority } from '@/config/resourceConfig';

// Create dynamic schema based on config
const createResourceSchema = () => {
  const linkTypeValues = RESOURCE_CONFIG.linkTypes.map(lt => lt.value) as [LinkType, ...LinkType[]];
  const priorityValues = RESOURCE_CONFIG.priorities.map(p => p.value) as [Priority, ...Priority[]];
  
  return z.object({
    title: z.string().min(1, 'Title is required').max(RESOURCE_CONFIG.defaults.maxTitleLength, 'Title too long'),
    link: z.string().min(1, 'Link is required').max(RESOURCE_CONFIG.defaults.maxLinkLength, 'Link too long'),
    description: z.string().max(RESOURCE_CONFIG.defaults.maxDescriptionLength, 'Description too long').optional(),
    category: z.string().min(1, 'Category is required').max(RESOURCE_CONFIG.defaults.maxCategoryLength, 'Category too long'),
    linkType: z.enum(linkTypeValues),
    priority: z.enum(priorityValues),
    tags: z.array(z.string()).max(RESOURCE_CONFIG.defaults.maxTags, 'Too many tags'),
    relatedBooks: z.array(z.string()).optional(),
  });
};

const resourceSchema = createResourceSchema();

type ResourceFormData = z.infer<typeof resourceSchema>;

interface ResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceFormData) => Promise<void>;
  resource?: Resource | null;
  categories: string[];
  availableBooks?: Array<{ _id: string; title: string; subject: string }>;
  isLoading?: boolean;
}

const ResourceForm = ({
  isOpen,
  onClose,
  onSubmit,
  resource,
  categories,
  availableBooks = [],
  isLoading = false
}: ResourceFormProps) => {
  const { toast } = useToast();
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: '',
      link: '',
      description: '',
      category: '',
      linkType: RESOURCE_CONFIG.defaults.linkType as LinkType,
      priority: RESOURCE_CONFIG.defaults.priority as Priority,
      tags: [],
      relatedBooks: [],
    },
  });

  const { watch, setValue, reset } = form;
  const watchedTags = watch('tags');
  const watchedCategory = watch('category');

  // Reset form when resource changes
  useEffect(() => {
    if (resource) {
      reset({
        title: resource.title,
        link: resource.link,
        description: resource.description || '',
        category: resource.category,
        linkType: resource.linkType,
        priority: resource.priority,
        tags: resource.tags,
        relatedBooks: resource.relatedBooks.map(book => book._id),
      });
    } else {
      reset({
        title: '',
        link: '',
        description: '',
        category: '',
        linkType: RESOURCE_CONFIG.defaults.linkType as LinkType,
        priority: RESOURCE_CONFIG.defaults.priority as Priority,
        tags: [],
        relatedBooks: [],
      });
    }
  }, [resource, reset]);

  const handleSubmit = async (data: ResourceFormData) => {
    try {
      await onSubmit(data);
      toast({
        title: resource ? 'Resource updated' : 'Resource created',
        description: `Resource has been ${resource ? 'updated' : 'created'} successfully`,
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${resource ? 'update' : 'create'} resource`,
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setValue('category', newCategory.trim());
      setNewCategory('');
    }
  };

  const validateUrl = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname;
    } catch {
      return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {resource ? 'Edit Resource' : 'Add New Resource'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter resource title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Link */}
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com or file path" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (e.target.value && validateUrl(e.target.value)) {
                          setValue('linkType', RESOURCE_CONFIG.defaults.linkType as LinkType);
                        }
                      }}
                    />
                  </FormControl>
                  {field.value && validateUrl(field.value) && (
                    <p className="text-xs text-muted-foreground">
                      Preview: {validateUrl(field.value)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Link Type */}
            <FormField
              control={form.control}
              name="linkType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select link type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RESOURCE_CONFIG.linkTypes.map((linkType) => (
                        <SelectItem key={linkType.value} value={linkType.value}>
                          {linkType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <div className="space-y-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select or create category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Add new category */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Or create new category"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RESOURCE_CONFIG.priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter resource description (optional)"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {watchedTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Related Books - Only show if feature is enabled */}
            {RESOURCE_CONFIG.features.enableRelatedBooks && availableBooks.length > 0 && (
              <FormField
                control={form.control}
                name="relatedBooks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Books</FormLabel>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {availableBooks.map((book) => (
                        <label key={book._id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value?.includes(book._id) || false}
                            onChange={(e) => {
                              const currentBooks = field.value || [];
                              if (e.target.checked) {
                                field.onChange([...currentBooks, book._id]);
                              } else {
                                field.onChange(currentBooks.filter(id => id !== book._id));
                              }
                            }}
                          />
                          <span className="text-sm">
                            {book.title} <span className="text-muted-foreground">({book.subject})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (resource ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceForm;
