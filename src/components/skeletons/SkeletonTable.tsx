import { SkeletonBase } from './SkeletonBase';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
  showHeader = true
}: SkeletonTableProps) {
  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden ${className}`}>
      {showHeader && (
        <div className="bg-gray-750 border-b border-gray-700 px-6 py-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <SkeletonBase key={index} height={16} width="80%" />
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="px-6 py-4"
          >
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <SkeletonBase
                  key={colIndex}
                  height={16}
                  width={colIndex === 0 ? '90%' : '70%'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SkeletonTableCompactProps {
  rows?: number;
  className?: string;
}

export function SkeletonTableCompact({
  rows = 5,
  className = ''
}: SkeletonTableCompactProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center gap-4"
        >
          <SkeletonBase circle width={48} height={48} />
          <div className="flex-1 space-y-2">
            <SkeletonBase height={20} width="60%" />
            <SkeletonBase height={16} width="40%" />
          </div>
          <div className="flex gap-2">
            <SkeletonBase width={32} height={32} />
            <SkeletonBase width={32} height={32} />
          </div>
        </div>
      ))}
    </div>
  );
}
