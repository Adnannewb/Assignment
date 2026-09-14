import { cn } from '../../lib/utils'

export default function Logo({ className, compact = false }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M13.6 2h-3.2a1.4 1.4 0 0 0-1.4 1.4v5.6H3.4A1.4 1.4 0 0 0 2 10.4v3.2A1.4 1.4 0 0 0 3.4 15H9v5.6A1.4 1.4 0 0 0 10.4 22h3.2a1.4 1.4 0 0 0 1.4-1.4V15h5.6a1.4 1.4 0 0 0 1.4-1.4v-3.2A1.4 1.4 0 0 0 20.6 9H15V3.4A1.4 1.4 0 0 0 13.6 2Z"
          />
        </svg>
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block text-[15px] leading-tight font-bold text-ink-900">
            MediCore
          </span>
          <span className="block text-[11px] leading-tight text-ink-400">
            Hospital Management
          </span>
        </span>
      )}
    </span>
  )
}
