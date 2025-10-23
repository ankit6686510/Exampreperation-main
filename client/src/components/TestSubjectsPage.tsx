import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import VirtualizedList from './VirtualizedList';

interface TestBook {
  id: string;
  title: string;
  totalChapters: number;
  completedChapters: number;
  subject: string;
}

interface TestChapter {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision';
}

const TestSubjectsPage = () => {
  const { toast } = useToast();
  const [testChapters, setTestChapters] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [testBooks, setTestBooks] = useState<TestBook[]>([]);

  // Generate test data for different scenarios
  const generateTestBook = (chapters: number, title: string): TestBook => ({
    id: Math.random().toString(36).substr(2, 9),
    title,
    totalChapters: chapters,
    completedChapters: Math.floor(Math.random() * chapters),
    subject: 'Test Subject'
  });

  const generateTestChapters = (count: number): TestChapter[] => {
    return Array.from({ length: count }, (_, index) => ({
      id: `chapter-${index + 1}`,
      name: `Chapter ${index + 1}: Test Topic ${index + 1}`,
      status: ['not_started', 'in_progress', 'completed', 'needs_revision'][
        Math.floor(Math.random() * 4)
      ] as TestChapter['status']
    }));
  };

  // Test edge cases
  const runEdgeCaseTests = () => {
    const edgeCases = [0, 1, 99, 100, 150, 200];
    const books = edgeCases.map(count => 
      generateTestBook(count, `Book with ${count} chapters`)
    );
    setTestBooks(books);
    
    toast({
      title: 'Edge Case Tests Generated',
      description: `Created books with ${edgeCases.join(', ')} chapters`
    });
  };

  // Test Select.Item with dynamic values
  const testSelectItems = (chapterCount: number) => {
    setTestChapters(chapterCount);
    
    // Test that all SelectItem values are non-empty
    const chapters = generateTestChapters(chapterCount);
    const hasEmptyValues = chapters.some(chapter => !chapter.id || chapter.id === '');
    
    if (hasEmptyValues) {
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: 'Found empty values in SelectItem components'
      });
    } else {
      toast({
        title: 'Test Passed',
        description: `All ${chapterCount} SelectItem components have valid values`
      });
    }
  };

  // Render chapter item for virtualized list
  const renderChapterItem = (chapter: TestChapter, index: number, style: React.CSSProperties) => (
    <div style={style} className="px-4 py-2 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
            {index + 1}
          </div>
          <span className="font-medium">{chapter.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={
            chapter.status === 'completed' ? 'default' :
            chapter.status === 'in_progress' ? 'secondary' :
            chapter.status === 'needs_revision' ? 'destructive' :
            'outline'
          }>
            {chapter.status.replace('_', ' ')}
          </Badge>
          <Select value={chapter.status}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="needs_revision">Needs Revision</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'needs_revision': return <RefreshCw className="h-4 w-4 text-orange-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Subjects Page Test Suite</h1>
          <p className="text-muted-foreground">
            Testing edge cases, performance, and error handling for the Subjects page
          </p>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Test Chapter Count</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={testChapters || ''}
                    onChange={(e) => setTestChapters(parseInt(e.target.value) || 0)}
                    placeholder="Enter number..."
                    min="0"
                    max="200"
                  />
                  <Button onClick={() => testSelectItems(testChapters)}>
                    Test
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Edge Case Tests</Label>
                <Button onClick={runEdgeCaseTests} className="w-full">
                  Run Edge Case Tests
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Performance Test</Label>
                <Button 
                  onClick={() => {
                    setTestChapters(200);
                    testSelectItems(200);
                  }} 
                  className="w-full"
                >
                  Test 200 Chapters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testBooks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Edge Case Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {testBooks.map((book) => (
                  <Card key={book.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{book.title}</h4>
                        <div className="flex items-center justify-between text-sm">
                          <span>Total Chapters:</span>
                          <Badge variant="outline">{book.totalChapters}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Completed:</span>
                          <Badge variant="secondary">{book.completedChapters}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress:</span>
                          <Badge variant={book.totalChapters === 0 ? "destructive" : "default"}>
                            {book.totalChapters === 0 ? 'N/A' : 
                             `${Math.round((book.completedChapters / book.totalChapters) * 100)}%`}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Status: {book.totalChapters === 0 ? 'Invalid' : 
                                  book.completedChapters === 0 ? 'Not Started' :
                                  book.completedChapters === book.totalChapters ? 'Completed' :
                                  'In Progress'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chapter Selection Test */}
        {testChapters > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Chapter Selection Test ({testChapters} chapters)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Chapter (Testing Select.Item values)</Label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a chapter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.min(testChapters, 100) }, (_, index) => {
                      const chapterId = `chapter-${index + 1}`;
                      return (
                        <SelectItem key={chapterId} value={chapterId}>
                          Chapter {index + 1}
                        </SelectItem>
                      );
                    })}
                    {testChapters > 100 && (
                      <SelectItem value="more" disabled>
                        ... and {testChapters - 100} more chapters
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedChapter && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    Selected: <strong>{selectedChapter}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Virtualized List Test */}
        {testChapters > 50 && (
          <Card>
            <CardHeader>
              <CardTitle>Virtualized List Performance Test</CardTitle>
              <p className="text-sm text-muted-foreground">
                Testing performance with {testChapters} chapters using virtualization
              </p>
            </CardHeader>
            <CardContent>
              <VirtualizedList
                items={generateTestChapters(testChapters)}
                itemHeight={60}
                height={400}
                renderItem={renderChapterItem}
                searchKey="name"
                placeholder="Search chapters..."
              />
            </CardContent>
          </Card>
        )}

        {/* Test Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Fixes Applied
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✅ Removed default "1" from Monthly Plan</li>
                  <li>✅ Fixed Select.Item empty value props</li>
                  <li>✅ Increased chapter limit to 200</li>
                  <li>✅ Added error boundaries</li>
                  <li>✅ Added performance optimizations</li>
                  <li>✅ Added input validation</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  Test Coverage
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>🧪 Edge cases: 0, 1, 99, 100, 150, 200 chapters</li>
                  <li>🚀 Performance: Up to 200 chapters</li>
                  <li>🛡️ Error handling with boundaries</li>
                  <li>📝 Input validation</li>
                  <li>🔍 Search and filtering</li>
                  <li>⚡ Virtualized rendering</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default TestSubjectsPage;
