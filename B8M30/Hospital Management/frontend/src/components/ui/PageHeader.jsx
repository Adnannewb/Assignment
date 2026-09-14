import { cn } from '../../lib/utils'

export default function PageHeader({ title, description, actions, className }) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** A labelled control row used above tables (search + filters). */
export function FilterBar({ children, className }) {
  return (
    <div
      className={cn(
        'grid gap-3 border-b border-ink-100 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
