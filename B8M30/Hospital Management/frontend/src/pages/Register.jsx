import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ShieldAlert, Stethoscope, UserPlus, UserRound } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useMutation } from '../hooks/useFetch'
import { useToast } from '../components/ui/useToast'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { InlineError } from '../components/ui/States'
import Logo from '../components/layout/Logo'
import { cn } from '../lib/utils'

/**
 * Self-registration is limited to the two self-service roles — the API
 * rejects anything else, because admin and receptionist carry elevated
 * permissions and must be granted by an existing administrator.
 */
const SELF_SERVICE_ROLES = [
  {
    value: 'patient',
    label: 'Patient',
    description: 'Book appointments, view prescriptions and bills',
    icon: UserRound,
  },
  {
    value: 'doctor',
    label: 'Doctor',
    description: 'Manage your schedule and write prescriptions',
    icon: Stethoscope,
  },
]

const EMPTY = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  role: 'patient',
  password: '',
  password2: '',
}

export default function Register() {
  const { register, isAuthenticated, booting } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)

  const { run, submitting, error, fieldErrors } = useMutation(register)

  if (!booting && isAuthenticated) return <Navigate to="/dashboard" replace />

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  // Caught before the request so the user isn't waiting on a round trip
  // to learn they mistyped the confirmation.
  const mismatch =
    form.password2.length > 0 && form.password !== form.password2
      ? 'Passwords do not match.'
      : undefined

  async function handleSubmit(event) {
    event.preventDefault()
    if (mismatch) return
    try {
      await run(form)
      // Doctors are held back until an admin vets them, so don't send
      // them to a login screen that is going to refuse them.
      toast.success(
        form.role === 'doctor'
          ? 'Account created. An administrator will review it before you can sign in.'
          : 'Account created — you can sign in now.',
      )
      navigate('/login', { replace: true })
    } catch {
      // useMutation surfaced it.
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-200/70 sm:p-8">
          <h1 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Takes a minute. You’ll sign in straight afterwards.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink-700">
                I am a…
              </legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {SELF_SERVICE_ROLES.map(({ value, label, description, icon: Icon }) => {
                  const active = form.role === value
                  return (
                    <label
                      key={value}
                      className={cn(
                        'flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors',
                        active
                          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                          : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50',
                      )}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={active}
                        onChange={update('role')}
                        className="sr-only"
                      />
                      <Icon
                        size={18}
                        className={cn(
                          'mt-0.5 shrink-0',
                          active ? 'text-brand-600' : 'text-ink-400',
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink-800">
                          {label}
                        </span>
                        <span className="block text-xs text-ink-500">
                          {description}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
              {fieldErrors.role && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {fieldErrors.role}
                </p>
              )}
              {form.role === 'doctor' && (
                <p className="mt-2.5 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    Doctor accounts are reviewed by a hospital administrator.
                    You’ll be able to sign in once yours is approved.
                  </span>
                </p>
              )}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                autoComplete="given-name"
                value={form.first_name}
                onChange={update('first_name')}
                error={fieldErrors.first_name}
                required
              />
              <Input
                label="Last name"
                autoComplete="family-name"
                value={form.last_name}
                onChange={update('last_name')}
                error={fieldErrors.last_name}
                required
              />
            </div>

            <Input
              label="Username"
              autoComplete="username"
              value={form.username}
              onChange={update('username')}
              error={fieldErrors.username}
              hint="Letters, digits and @/./+/-/_ only."
              required
            />

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
              error={fieldErrors.email}
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={update('password')}
                error={fieldErrors.password}
                hint="At least 8 characters, not all numbers."
                required
              />
              <Input
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={form.password2}
                onChange={update('password2')}
                error={mismatch ?? fieldErrors.password2}
                required
              />
            </div>

            <InlineError>{error}</InlineError>

            <Button
              type="submit"
              icon={UserPlus}
              loading={submitting}
              size="lg"
              className="w-full justify-center"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-ink-400">
          Need an administrator or receptionist account? Ask a hospital
          administrator to create it for you.
        </p>
      </div>
    </div>
  )
}
