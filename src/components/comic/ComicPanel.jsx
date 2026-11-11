import React from 'react';
import { cn } from '@/lib/utils';

export default function ComicPanel({ children, className, variant = 'default', ...props }) {
  return (
    <div
      className={cn(
        variant === 'sm' ? 'comic-panel-sm' : 'comic-panel',
        'p-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}