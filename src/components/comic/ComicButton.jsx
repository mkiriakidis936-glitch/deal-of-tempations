import React from 'react';
import { cn } from '@/lib/utils';

// Χρώμα ανά variant (χρησιμοποιούν τα tarot tokens του tailwind.config.js).
const VARIANTS = {
  red: 'bg-tarot-crimson text-foreground',
  green: 'bg-tarot-forest text-foreground',
  dark: 'bg-secondary text-foreground',
  yellow: 'bg-primary text-tarot-dark',
  magenta: 'bg-tarot-wine text-foreground',
  white: 'bg-tarot-parchment text-tarot-dark',
  cyan: 'bg-tarot-teal text-foreground',
  purple: 'bg-tarot-royal text-foreground',
};

const SIZES = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-6 py-3.5',
};

const ComicButton = React.forwardRef(function ComicButton(
  { children, variant = 'yellow', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'comic-boom font-heading inline-flex items-center justify-center gap-2 select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANTS[variant] || VARIANTS.yellow,
        SIZES[size] || SIZES.md,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default ComicButton;
