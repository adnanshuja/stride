import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium font-sans transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#51FAAA] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0E1D] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'rounded-full bg-[#51FAAA] text-[#0C0E1D] hover:bg-[#29D97A] shadow-lg shadow-[#51FAAA]/20 hover:shadow-[#51FAAA]/30 font-semibold tracking-wide',
        destructive:
          'rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20',
        outline:
          'rounded-full border border-white/[0.08] bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12]',
        secondary:
          'rounded-full bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08]',
        ghost:
          'rounded-full text-gray-500 hover:text-white hover:bg-white/[0.04]',
        link:
          'text-[#51FAAA] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-8 rounded-full px-4 text-xs',
        lg: 'h-12 rounded-full px-8 text-base',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
