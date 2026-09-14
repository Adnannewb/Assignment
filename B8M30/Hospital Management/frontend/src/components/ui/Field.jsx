import { useId } from 'react'
import { cn } from '../../lib/utils'

const CONTROL = cn(
  'w-full rounded-lg bg-white px-3 py-2 text-sm text-ink-800',
  'ring-1 ring-ink-200 transition-shadow placeholder:text-ink-400',
  'focus:ring-2 focus:ring-brand-500 focus:outline-none',
  'disabled:bg-ink-50 disabled:text-ink-400',
)

const INVALID = 'ring-rose-400 focus:ring-rose-500'

function Wrapper({ id, label, error, hint, required, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : (
        hint && <p className="text-xs text-ink-400">{hint}</p>
      )}
    </div>
  )
}

export function Input({ label, error, hint, className, required, ...props }) {
  const autoId = useId()
  const id = props.id ?? autoId
  return (
    <Wrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <input
        id={id}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={cn(CONTROL, error && INVALID)}
        {...props}
      />
    </Wrapper>
  )
}

export function Textarea({
  label,
  error,
  hint,
  className,
  required,
  rows = 3,
  ...props
}) {
  const autoId = useId()
  const id = props.id ?? autoId
  return (
    <Wrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={cn(CONTROL, 'resize-y', error && INVALID)}
        {...props}
      />
    </Wrapper>
  )
}

export function Select({
  label,
  error,
  hint,
  className,
  required,
  children,
  ...props
}) {
  const autoId = useId()
  const id = props.id ?? autoId
  return (
    <Wrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <select
        id={id}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={cn(CONTROL, 'cursor-pointer pr-8', error && INVALID)}
        {...props}
      >
        {children}
      </select>
    </Wrapper>
  )
}

/** An accessible on/off switch — used for doctor availability. */
export function Toggle({ checked, onChange, label, disabled, id }) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-flex items-center gap-2.5',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      )}
    >
      <span className="relative inline-block">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <span
          className={cn(
            'block h-6 w-11 rounded-full bg-ink-300 transition-colors',
            'peer-checked:bg-brand-500',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
            'peer-focus-visible:outline-brand-500',
          )}
        />
        <span
          className={cn(
            'pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full',
            'bg-white shadow transition-transform duration-200',
            checked && 'translate-x-5',
          )}
        />
      </span>
      {label && <span className="text-sm text-ink-700">{label}</span>}
    </label>
  )
}
