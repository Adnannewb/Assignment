import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react'
import Button from './Button'
import { cn } from '../../lib/utils'

export function Spinner({ size = 20, className }) {
  return (
    <Loader2
      size={size}
      className={cn('animate-spin text-brand-600', className)}
      aria-hidden="true"
    />
  )
}

/** Shimmering placeholder rows — steadier than a bare spinner for tables. */
export function SkeletonRows({ rows = 5, className }) {
  return (
    <div className={cn('space-y-2 p-4 sm:p-5', className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-11 animate-pulse rounded-lg bg-ink-100"
          style={{ animationDelay: `${index * 70}ms` }}
        />
      ))}
    </div>
  )
}

export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        className,
      )}
    >
      <Spinner size={26} />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  )
}

export function ErrorState({ error, onRetry, className }) {
  const message =
    typeof error === 'string' ? error : error?.message || 'Something went wrong.'
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle size={20} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-800">Couldn’t load this</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  icon: Icon = Inbox,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-ink-100 text-ink-400">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-800">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

/** Inline banner for a failed mutation, shown above a form's actions. */
export function InlineError({ children, className }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2',
        'text-sm text-rose-700 ring-1 ring-rose-200',
        className,
      )}
    >
      <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
