import { cn } from '../../lib/utils';

function Avatar({ className, ...props }) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10',
        className
      )}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-emerald-900/40 text-sm font-mono font-medium text-accent',
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback };
