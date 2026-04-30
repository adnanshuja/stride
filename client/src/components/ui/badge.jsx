import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-mono font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent/10 text-accent',
        free: 'border-transparent bg-blue-500/10 text-blue-400',
        restricted: 'border-transparent bg-amber-500/10 text-amber-400',
        outline: 'text-gray-400 border-white/10',
        success: 'border-transparent bg-green-500/10 text-green-400',
        danger: 'border-transparent bg-red-500/10 text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
