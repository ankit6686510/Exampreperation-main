import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Clock, Target, TrendingUp, BookOpen, Award, RefreshCw, AlertTriangle } from 'lucide-react';
import { Book as BookType } from '@/redux/slices/bookSlice';

interface BooksOverviewProps {
  books: BookType[];
  isLoading: boolean;
}

const BooksOverview = ({ books, isLoading }: BooksOverviewProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalBooks = books.length;
  const totalChapters = books.reduce((sum, book) => sum + book.totalChapters, 0);
  const completedChapters = books.reduce((sum, book) => sum + book.completedChapters, 0);
  const totalTimeSpent = books.reduce((sum, book) => sum + book.totalTimeSpent, 0);
  const totalTests = books.reduce((sum, book) => sum + book.totalTests, 0);
  const averageScore = books.reduce((sum, book) => sum + book.averageTestScore, 0) / (books.filter(b => b.averageTestScore > 0).length || 1);
  const totalRevisions = books.reduce((sum, book) => sum + book.totalRevisions, 0);
  const chaptersNeedingRevision = books.reduce((sum, book) => sum + book.chaptersNeedingRevision, 0);

  const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const stats = [
    {
      title: "Total Subjects",
      value: totalBooks,
      description: `${totalChapters} topics in total`,
      icon: Book,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Completed Topics",
      value: completedChapters,
      description: `${overallProgress}% overall progress`,
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Need Revision",
      value: books.reduce((sum, book) => 
        sum + (book.chapters?.filter(chapter => chapter.status === 'needs_revision').length || 0), 0),
      description: "Topics flagged for review",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Total Tests",
      value: books.reduce((sum, book) => 
        sum + (book.chapters?.reduce((chapterSum, chapter) => 
          chapterSum + (chapter.tests?.length || 0), 0) || 0), 0),
      description: "Tests taken across all topics",
      icon: Award,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Total Revisions",
      value: books.reduce((sum, book) => 
        sum + (book.chapters?.reduce((chapterSum, chapter) => 
          chapterSum + (chapter.revisions?.length || 0), 0) || 0), 0),
      description: "Revision sessions completed",
      icon: RefreshCw,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BooksOverview;
