import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  BriefcaseMedical,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useMutation } from '../hooks/useFetch'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { InlineError } from '../components/ui/States'
import Logo from '../components/layout/Logo'

const ROLE_NOTES = [
  { icon: ShieldCheck, label: 'Administrator', note: 'Full control of the hospital' },
  { icon: Stethoscope, label: 'Doctor', note: 'Schedule, prescribe, set availability' },
  {
    icon: BriefcaseMedical,
    label: 'Receptionist',
    note: 'Register patients, raise bills',
  },
  { icon: UserRound, label: 'Patient', note: 'Book visits, read prescriptions' },
]

export default function Login() {
  const { signIn, isAuthenticated, booting } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const { run, submitting, error, fieldErrors } = useMutation((values) =>
    signIn(values.username, values.password),
  )

  if (!booting && isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname ?? '/dashboard'} replace />
  }

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await run(form)
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true })
    } catch {
      // useMutation already surfaced the message.
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel — decorative, so it steps aside on small screens. */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand-800 p-10 text-white lg:flex">
        <div
          className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-brand-600/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M13.6 2h-3.2a1.4 1.4 0 0 0-1.4 1.4v5.6H3.4A1.4 1.4 0 0 0 2 10.4v3.2A1.4 1.4 0 0 0 3.4 15H9v5.6A1.4 1.4 0 0 0 10.4 22h3.2a1.4 1.4 0 0 0 1.4-1.4V15h5.6a1.4 1.4 0 0 0 1.4-1.4v-3.2A1.4 1.4 0 0 0 20.6 9H15V3.4A1.4 1.4 0 0 0 13.6 2Z"
              />
            </svg>
          </span>
          <span className="text-lg font-bold">MediCore</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-bold">
            One system for every corner of the hospital.
          </h2>
          <p className="mt-3 text-brand-100">
            Appointments, prescriptions, pharmacy and billing — each role sees
            exactly what it needs, and nothing it doesn’t.
          </p>

          <ul className="mt-8 space-y-3">
            {ROLE_NOTES.map(({ icon: Icon, label, note }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/12 ring-1 ring-white/20">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-sm text-brand-200">{note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200">
          © {new Date().getFullYear()} MediCore Hospital Management
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Sign in and we’ll take you to the right place for your role.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <Input
              label="Username"
              name="username"
              autoComplete="username"
              placeholder="e.g. demo.admin"
              value={form.username}
              onChange={update('username')}
              error={fieldErrors.username}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={update('password')}
                error={fieldErrors.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute top-7.5 right-2 cursor-pointer rounded p-1.5 text-ink-400 transition-colors hover:text-ink-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <InlineError>{error}</InlineError>

            <Button
              type="submit"
              icon={LogIn}
              loading={submitting}
              className="w-full justify-center"
              size="lg"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            New here?{' '}
            <Link
              to="/register"
              className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
            >
              Create an account
            </Link>
          </p>

          <p className="mt-6 rounded-lg bg-ink-100 px-3.5 py-3 text-xs leading-relaxed text-ink-500">
            Your role comes from your account, not from this form. Administrator
            and receptionist accounts are issued by a hospital administrator.
          </p>
        </div>
      </section>
    </div>
  )
}
