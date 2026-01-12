import { CSSProperties } from 'react';

interface SkeletonBaseProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  style?: CSSProperties;
}

export function SkeletonBase({
  className = '',
  width,
  height,
  circle = false,
  style
}: SkeletonBaseProps) {
  const baseStyles: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={`
        bg-gray-700/50
        animate-pulse
        relative
        overflow-hidden
        ${circle ? 'rounded-full' : 'rounded-lg'}
        ${className}
      `}
      style={baseStyles}
      role="status"
      aria-label="Loading..."
    >
      <div className="shimmer absolute inset-0" />
    </div>
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export function SkeletonText({ lines = 1, className = '', lastLineWidth = '80%' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBase
          key={index}
          height={16}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}
