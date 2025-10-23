import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, BookOpen } from 'lucide-react';

const BooksSimple = () => {
  const [chapters, setChapters] = useState(1);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Subjects</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Manage your subjects and track your learning progress
          </p>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {/* Simple Form Test */}
      <Card>
        <CardHeader>
          <CardTitle>Test Chapter Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chapters">Total Chapters</Label>
            <Input
              id="chapters"
              type="number"
              min="1"
              max="200"
              value={chapters}
              onChange={(e) => setChapters(parseInt(e.target.value) || 1)}
              placeholder="Enter number of chapters..."
            />
            <p className="text-xs text-muted-foreground">
              Maximum 200 chapters supported
            </p>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              Current value: <strong>{chapters}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* No subjects state */}
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No subjects yet</h3>
        <p className="text-muted-foreground mb-4">
          Start building your study library by adding your first subject
        </p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Your First Subject
        </Button>
      </div>
    </div>
  );
};

export default BooksSimple;
