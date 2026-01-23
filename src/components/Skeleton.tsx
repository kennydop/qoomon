import * as React from 'react';

import { cn } from '@/lib/utils';

type SkeletonProps = React.ComponentPropsWithoutRef<'div'>;

export default function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn('animate-shimmer bg-[#f5f3ff]', className)}
      style={{
        backgroundImage:
          'linear-gradient(to right, #f5f3ff 0%, #ede9fe 20%, #f5f3ff 40%, #f5f3ff 100%)',
        backgroundSize: '700px 100%',
        backgroundRepeat: 'no-repeat',
      }}
      {...rest}
    />
  );
}
