/* Shared loading/error/empty states — on-brand, dark + gold */
import { motion } from 'motion/react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`sl-shimmer rounded-[8px] animate-sl-shimmer ${className}`} />;
}

export function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-card border border-line bg-bg1 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="w-7 h-7 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-12" />
            </div>
          </div>
          <Skeleton className="w-full h-[200px] rounded-none" />
          <div className="p-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3.5 rounded-card border border-line">
          <Skeleton className="w-8 h-4" />
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-16" />
          </div>
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

interface ErrorStateProps { message?: string; onRetry?: () => void }
export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-11 h-11 rounded-full border border-[#E6394644] bg-[#E6394614] flex items-center justify-center mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4m0 4h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#E63946" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="font-sans text-[15px] text-white font-semibold">{message}</div>
      <div className="font-sans text-[13px] text-mute mt-1">Check your connection and try again.</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 px-5 py-2 rounded-pill bg-white/5 border border-line2 text-white font-sans text-[12px] font-semibold hover:bg-white/10 transition-colors"
        >Retry</button>
      )}
    </motion.div>
  );
}

interface EmptyStateProps { title: string; subtitle?: string; icon?: React.ReactNode }
export function EmptyState({ title, subtitle, icon }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-11 h-11 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center mb-4 text-gold">
        {icon ?? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div className="font-sans text-[15px] text-white font-semibold">{title}</div>
      {subtitle && <div className="font-sans text-[13px] text-mute mt-1 max-w-xs">{subtitle}</div>}
    </motion.div>
  );
}
