import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-sans font-medium transition-colors tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-[#51FAAA]/25 bg-[#51FAAA]/10 text-[#51FAAA]',
        free: 'border-blue-500/25 bg-blue-500/10 text-blue-400',
        restricted: 'border-[#FF81FF]/25 bg-[#FF81FF]/10 text-[#FF81FF]',
        outline: 'text-gray-500 border-white/[0.06]',
        success: 'border-[#51FAAA]/25 bg-[#51FAAA]/10 text-[#51FAAA]',
        danger: 'border-rose-500/25 bg-rose-500/10 text-rose-400',
        dim: 'border-white/[0.04] bg-white/[0.02] text-gray-500',
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
