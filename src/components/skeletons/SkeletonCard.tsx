import { SkeletonBase, SkeletonText } from './SkeletonBase';

interface SkeletonCardProps {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  rows?: number;
}

export function SkeletonCard({
  className = '',
  showHeader = true,
  showFooter = false,
  rows = 3
}: SkeletonCardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          <SkeletonBase circle width={40} height={40} />
          <div className="flex-1">
            <SkeletonBase height={20} width="60%" className="mb-2" />
            <SkeletonBase height={14} width="40%" />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <SkeletonText lines={rows} />
      </div>

      {showFooter && (
        <div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-2">
          <SkeletonBase height={32} width={100} />
          <SkeletonBase height={32} width={100} />
        </div>
      )}
    </div>
  );
}

interface SkeletonCardGridProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function SkeletonCardGrid({
  count = 6,
  columns = 2,
  className = ''
}: SkeletonCardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
