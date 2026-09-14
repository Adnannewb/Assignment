import { cn } from '../../lib/utils'

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white shadow-card ring-1 ring-ink-200/70',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, description, actions, icon: Icon, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-4 py-3.5 sm:px-5',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Icon size={16} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink-800">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-ink-500">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('p-4 sm:p-5', className)}>{children}</div>
}
