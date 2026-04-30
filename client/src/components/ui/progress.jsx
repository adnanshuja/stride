import { cn } from '../../lib/utils';

function Progress({ value, className, ...props }) {
  return (
    <div
      className={cn('h-2 bg-dark rounded-full overflow-hidden', className)}
      {...props}
    >
      <div
        className="h-full bg-gradient-to-r from-accent/70 to-accent rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export { Progress };
