import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink-50 px-5">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Compass size={26} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-brand-600">404</p>
          <h1 className="mt-1 text-2xl font-bold text-ink-900">Page not found</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            That link doesn’t lead anywhere in MediCore.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
