import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#211F36]/60 px-4 py-2 text-sm font-sans text-white placeholder:text-gray-500 focus:outline-none focus:border-[#51FAAA]/50 focus:ring-1 focus:ring-[#51FAAA]/30 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
