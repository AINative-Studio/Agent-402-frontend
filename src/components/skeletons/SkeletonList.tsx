import { SkeletonBase, SkeletonText } from './SkeletonBase';

interface SkeletonListItemProps {
  showIcon?: boolean;
  showAction?: boolean;
  className?: string;
}

export function SkeletonListItem({
  showIcon = true,
  showAction = false,
  className = ''
}: SkeletonListItemProps) {
  return (
    <div className={`flex items-center gap-3 py-3 ${className}`}>
      {showIcon && <SkeletonBase circle width={24} height={24} />}
      <div className="flex-1">
        <SkeletonBase height={16} width="70%" className="mb-1" />
        <SkeletonBase height={12} width="40%" />
      </div>
      {showAction && <SkeletonBase width={80} height={32} />}
    </div>
  );
}

interface SkeletonListProps {
  items?: number;
  className?: string;
  showIcon?: boolean;
  showAction?: boolean;
  divided?: boolean;
}

export function SkeletonList({
  items = 5,
  className = '',
  showIcon = true,
  showAction = false,
  divided = true
}: SkeletonListProps) {
  return (
    <div className={`${divided ? 'divide-y divide-gray-700' : 'space-y-2'} ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonListItem
          key={index}
          showIcon={showIcon}
          showAction={showAction}
        />
      ))}
    </div>
  );
}

interface SkeletonListCardProps {
  items?: number;
  className?: string;
}

export function SkeletonListCard({
  items = 5,
  className = ''
}: SkeletonListCardProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-start gap-3">
            <SkeletonBase className="flex-shrink-0" width={40} height={40} />
            <div className="flex-1 space-y-3">
              <div>
                <SkeletonBase height={20} width="50%" className="mb-2" />
                <SkeletonBase height={14} width="30%" />
              </div>
              <SkeletonText lines={2} lastLineWidth="60%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
