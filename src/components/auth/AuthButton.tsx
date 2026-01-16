import * as React from 'react';

import Button from '@/components/buttons/Button';
import { cn } from '@/lib/utils';

type AuthButtonProps = React.ComponentPropsWithRef<typeof Button> & {
  isLoading?: boolean;
};

export default function AuthButton({
  className,
  isLoading,
  children,
  ...rest
}: AuthButtonProps) {
  return (
    <Button
      variant='primary'
      isLoading={isLoading}
      className={cn(
        'w-full justify-center rounded-md bg-purple-600 text-white hover:bg-purple-700',
        'border-purple-700 shadow-lg',
        'sm:w-auto',
        className
      )}
      {...rest}
    >
      {children}
    </Button>
  );
}
