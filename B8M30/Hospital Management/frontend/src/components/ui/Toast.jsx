import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ToastContext } from './toast-context'

const TONE = {
  success: {
    icon: CheckCircle2,
    ring: 'ring-emerald-200',
    accent: 'text-emerald-600',
  },
  error: { icon: AlertTriangle, ring: 'ring-rose-200', accent: 'text-rose-600' },
  info: { icon: Info, ring: 'ring-sky-200', accent: 'text-sky-600' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, tone = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      setToasts((current) => [...current, { id, message, tone }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      )
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toast: push,
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-3 bottom-3 z-60 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end"
        >
          {toasts.map(({ id, message, tone }) => {
            const { icon: Icon, ring, accent } = TONE[tone] ?? TONE.info
            return (
              <div
                key={id}
                className={cn(
                  'animate-slide-in-right pointer-events-auto flex w-full max-w-sm items-start gap-2.5',
                  'rounded-xl bg-white px-3.5 py-3 shadow-pop ring-1',
                  ring,
                )}
              >
                <Icon
                  size={18}
                  className={cn('mt-0.5 shrink-0', accent)}
                  aria-hidden="true"
                />
                <p className="min-w-0 flex-1 text-sm text-ink-700">{message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  aria-label="Dismiss notification"
                  className="-mt-0.5 cursor-pointer rounded p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
