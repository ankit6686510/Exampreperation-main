import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Bookmark, 
  Eye, 
  FolderOpen,
  TrendingUp,
  Globe,
  Upload,
  StickyNote,
  FileCheck,
  LucideIcon
} from 'lucide-react';
import { ResourceStats as ResourceStatsType } from '@/redux/slices/resourceSlice';

interface ResourceStatsProps {
  stats: ResourceStatsType;
  isLoading: boolean;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  isLoading 
}: { 
  title: string; 
  value: string | number; 
  icon: LucideIcon; 
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

const ResourceStats = ({ stats, isLoading }: ResourceStatsProps) => {
  const getLinkTypeIcon = (linkType: string) => {
    switch (linkType) {
      case 'external_url':
        return Globe;
      case 'file_upload':
        return Upload;
      case 'notes':
        return StickyNote;
      case 'document':
        return FileCheck;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Resources"
          value={stats.totalResources}
          icon={FileText}
          isLoading={isLoading}
        />
        <StatCard
          title="Bookmarked"
          value={stats.totalBookmarked}
          icon={Bookmark}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Accesses"
          value={stats.totalAccesses}
          icon={Eye}
          isLoading={isLoading}
        />
        <StatCard
          title="Categories"
          value={stats.categoriesCount}
          icon={FolderOpen}
          isLoading={isLoading}
        />
      </div>

      {/* Additional Stats */}
      {stats.totalResources > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Average Access Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Access Count</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.avgAccessCount}</div>
              )}
            </CardContent>
          </Card>

          {/* Link Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Resource Types</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.linkTypeDistribution).map(([linkType, count]) => {
                    const Icon = getLinkTypeIcon(linkType);
                    const percentage = stats.totalResources > 0 
                      ? Math.round((count / stats.totalResources) * 100) 
                      : 0;
                    
                    return (
                      <div key={linkType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm capitalize">
                            {linkType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-muted-foreground">
                            ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {Object.keys(stats.linkTypeDistribution).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No resource types to display
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Insights */}
      {stats.totalResources > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Bookmark Rate</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.totalResources > 0 
                      ? Math.round((stats.totalBookmarked / stats.totalResources) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of resources bookmarked
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">Usage Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.avgAccessCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    average accesses per resource
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Organization</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.categoriesCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    categories used
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResourceStats;
