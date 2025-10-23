import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  searchKey?: keyof T;
  placeholder?: string;
  className?: string;
  overscan?: number;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  searchKey,
  placeholder = "Search items...",
  className = "",
  overscan = 5
}: VirtualizedListProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm || !searchKey) return items;

    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => {
      const searchValue = item[searchKey];
      if (typeof searchValue === 'string') {
        return searchValue.toLowerCase().includes(searchLower);
      }
      return String(searchValue).toLowerCase().includes(searchLower);
    });
  }, [items, searchTerm, searchKey]);

  // Calculate visible range for virtualization
  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    const containerHeight = height;
    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIdx = Math.min(filteredItems.length - 1, startIdx + visibleCount + 2 * overscan);
    
    return {
      startIndex: startIdx,
      endIndex: endIdx,
      totalHeight: filteredItems.length * itemHeight
    };
  }, [scrollTop, itemHeight, height, filteredItems.length, overscan]);

  // Handle scroll events
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Reset scroll when search changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [searchTerm]);

  // Render visible items
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const item = filteredItems[i];
    if (item) {
      const style: React.CSSProperties = {
        position: 'absolute',
        top: i * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
      };
      visibleItems.push(
        <div key={i} style={style}>
          {renderItem(item, i, style)}
        </div>
      );
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      {searchKey && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
      )}

      {/* Results Info */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredItems.length} of {items.length} items
        </div>
      )}

      {/* Virtualized List */}
      {filteredItems.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <div
            ref={containerRef}
            className="overflow-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-background"
            style={{ height }}
            onScroll={handleScroll}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              {visibleItems}
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              {searchTerm ? 'No items match your search.' : 'No items to display.'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VirtualizedList;
