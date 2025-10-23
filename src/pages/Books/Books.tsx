import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchBooks, addBook, updateBook, deleteBook } from '@/redux/slices/bookSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';

const Books = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { books, isLoading } = useAppSelector((state) => state.books);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    totalChapters: 0,
    completedChapters: 0,
  });

  useEffect(() => {
    dispatch(fetchBooks());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await dispatch(updateBook({ id: editingBook, data: formData }));
        toast({ title: 'Book updated successfully' });
      } else {
        await dispatch(addBook(formData));
        toast({ title: 'Book added successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Operation failed' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteBook(id));
      toast({ title: 'Book deleted successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const handleEdit = (book: any) => {
    setEditingBook(book.id);
    setFormData({
      title: book.title,
      subject: book.subject,
      totalChapters: book.totalChapters,
      completedChapters: book.completedChapters,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', subject: '', totalChapters: 0, completedChapters: 0 });
    setEditingBook(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Materials</h1>
          <p className="mt-1 text-muted-foreground">Manage your books and track progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalChapters">Total Chapters</Label>
                <Input
                  id="totalChapters"
                  type="number"
                  min="1"
                  value={formData.totalChapters}
                  onChange={(e) =>
                    setFormData({ ...formData, totalChapters: parseInt(e.target.value) })
                  }
                  required
                />
              </div>
              {editingBook && (
                <div className="space-y-2">
                  <Label htmlFor="completedChapters">Completed Chapters</Label>
                  <Input
                    id="completedChapters"
                    type="number"
                    min="0"
                    max={formData.totalChapters}
                    value={formData.completedChapters}
                    onChange={(e) =>
                      setFormData({ ...formData, completedChapters: parseInt(e.target.value) })
                    }
                  />
                </div>
              )}
              <Button type="submit" className="w-full">
                {editingBook ? 'Update Book' : 'Add Book'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Card key={book.id} className="transition-all hover:shadow-[var(--shadow-card)]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{book.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{book.subject}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(book)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(book.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ProgressBar
                  current={book.completedChapters}
                  total={book.totalChapters}
                  color="primary"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Books;
