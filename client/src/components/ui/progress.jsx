import { cn } from '../../lib/utils';

function Progress({ value, className, variant = 'default', ...props }) {
  const barColor =
    variant === 'magenta'
      ? 'bg-gradient-to-r from-[#FF81FF]/60 to-[#FF81FF]'
      : 'bg-gradient-to-r from-[#51FAAA]/60 to-[#51FAAA]';

  return (
    <div
      className={cn('h-1.5 bg-white/[0.04] rounded-full overflow-hidden', className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export { Progress };
