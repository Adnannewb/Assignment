import { useState } from 'react'
import { CheckCircle2, Save, Stethoscope, UserRound } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useFetch, useMutation } from '../hooks/useFetch'
import { toList } from '../api/client'
import {
  auth as authApi,
  doctors as doctorsApi,
  patients as patientsApi,
} from '../api/endpoints'
import { ROLE_BADGE, ROLE_LABEL } from '../auth/roles'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import { Input, Toggle } from '../components/ui/Field'
import { InlineError, LoadingState } from '../components/ui/States'
import { useToast } from '../components/ui/useToast'
import { cn, formatDate, initials, personName } from '../lib/utils'

function AccountCard() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
  })

  const { run, submitting, error, fieldErrors } = useMutation(authApi.updateMe)

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await run(form)
      await refreshUser()
      toast.success('Profile updated.')
    } catch {
      /* rendered inline */
    }
  }

  const name = personName(user, user?.username)

  return (
    <Card>
      <CardHeader
        icon={UserRound}
        title="Account details"
        description="Your name and contact address."
      />
      <CardBody>
        <div className="mb-5 flex items-center gap-3.5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-ink-900">{name}</p>
            <p className="truncate text-sm text-ink-400">@{user?.username}</p>
            <span
              className={cn(
                'mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                ROLE_BADGE[user?.role],
              )}
            >
              {ROLE_LABEL[user?.role] ?? user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.first_name}
              onChange={update('first_name')}
              error={fieldErrors.first_name}
            />
            <Input
              label="Last name"
              value={form.last_name}
              onChange={update('last_name')}
              error={fieldErrors.last_name}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={update('email')}
            error={fieldErrors.email}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-ink-50 px-3.5 py-2.5">
              <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
                Username
              </p>
              <p className="mt-0.5 text-sm text-ink-700">{user?.username}</p>
            </div>
            <div className="rounded-lg bg-ink-50 px-3.5 py-2.5">
              <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
                Member since
              </p>
              <p className="mt-0.5 text-sm text-ink-700">
                {formatDate(user?.date_joined)}
              </p>
            </div>
          </div>

          <InlineError>{error}</InlineError>

          <div className="flex justify-end">
            <Button type="submit" icon={Save} loading={submitting}>
              Save changes
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

function DoctorCard() {
  const { user } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const { data, loading, error, setData } = useFetch(
    (signal) => doctorsApi.list(undefined, { signal }),
    [],
  )

  const profile = toList(data).find((doctor) => doctor.user === user?.id)

  async function toggleAvailability(next) {
    setSaving(true)
    const previous = data
    // Flip the switch immediately, then roll back if the API refuses.
    setData((current) => {
      const list = toList(current)
      const updated = list.map((item) =>
        item.id === profile.id ? { ...item, is_available: next } : item,
      )
      return Array.isArray(current) ? updated : { ...current, results: updated }
    })
    try {
      await doctorsApi.update(profile.id, { is_available: next })
      toast.success(next ? 'You are now accepting appointments.' : 'You are now off duty.')
    } catch (err) {
      toast.error(err.message)
      setData(previous)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <LoadingState label="Loading your practice details…" />
      </Card>
    )
  }

  if (error || !profile) {
    return (
      <Card>
        <CardHeader icon={Stethoscope} title="Practice details" />
        <CardBody>
          <p className="text-sm text-ink-500">
            You don’t have a doctor record yet. An administrator needs to create
            one and link it to your account before you can take appointments.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        icon={Stethoscope}
        title="Practice details"
        description="What patients see when they book with you."
      />
      <CardBody className="space-y-4">
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl p-4 ring-1',
            profile.is_available
              ? 'bg-emerald-50 ring-emerald-200'
              : 'bg-ink-50 ring-ink-200',
          )}
        >
          <CheckCircle2
            size={20}
            className={cn(
              'mt-0.5 shrink-0',
              profile.is_available ? 'text-emerald-600' : 'text-ink-400',
            )}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-800">
              {profile.is_available ? 'Accepting appointments' : 'Off duty'}
            </p>
            <p className="mt-0.5 text-sm text-ink-500">
              {profile.is_available
                ? 'Patients can book new visits with you.'
                : 'You won’t appear in the booking form until you turn this back on.'}
            </p>
            <div className="mt-3">
              <Toggle
                checked={Boolean(profile.is_available)}
                disabled={saving}
                onChange={toggleAvailability}
                label="Available for appointments"
              />
            </div>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-ink-50 px-3.5 py-2.5">
            <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Specialization
            </dt>
            <dd className="mt-0.5 text-sm text-ink-700">
              {profile.specialization || '—'}
            </dd>
          </div>
          <div className="rounded-lg bg-ink-50 px-3.5 py-2.5">
            <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Experience
            </dt>
            <dd className="mt-0.5 text-sm text-ink-700">
              {profile.experience ?? 0} year{profile.experience === 1 ? '' : 's'}
            </dd>
          </div>
          <div className="rounded-lg bg-ink-50 px-3.5 py-2.5 sm:col-span-2">
            <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Phone
            </dt>
            <dd className="mt-0.5 text-sm text-ink-700">{profile.phone || '—'}</dd>
          </div>
        </dl>

        <p className="text-xs text-ink-400">
          Specialization, department and phone are maintained by an administrator.
        </p>
      </CardBody>
    </Card>
  )
}

function PatientCard() {
  const { user } = useAuth()
  const { data, loading } = useFetch(
    (signal) => patientsApi.list(undefined, { signal }),
    [],
  )

  const profile = toList(data).find((patient) => patient.user === user?.id)

  if (loading) {
    return (
      <Card>
        <LoadingState label="Loading your medical record…" />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        icon={UserRound}
        title="Medical record"
        description="Kept up to date by the hospital."
      />
      <CardBody>
        {profile ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-ink-50 px-3.5 py-2.5">
              <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
                Age
              </dt>
              <dd className="mt-0.5 text-sm text-ink-700">{profile.age ?? '—'}</dd>
            </div>
            <div className="rounded-lg bg-ink-50 px-3.5 py-2.5">
              <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
                Gender
              </dt>
              <dd className="mt-0.5 text-sm text-ink-700 capitalize">
                {profile.gender || '—'}
              </dd>
            </div>
            <div className="rounded-lg bg-ink-50 px-3.5 py-2.5">
              <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
                Blood group
              </dt>
              <dd className="mt-1">
                {profile.blood_group ? (
                  <Badge tone="danger">{profile.blood_group}</Badge>
                ) : (
                  <span className="text-sm text-ink-400">Unknown</span>
                )}
              </dd>
            </div>
            <div className="rounded-lg bg-ink-50 px-3.5 py-2.5">
              <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
                Phone
              </dt>
              <dd className="mt-0.5 text-sm text-ink-700">{profile.phone || '—'}</dd>
            </div>
            <div className="rounded-lg bg-ink-50 px-3.5 py-2.5 sm:col-span-2">
              <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
                Address
              </dt>
              <dd className="mt-0.5 text-sm whitespace-pre-wrap text-ink-700">
                {profile.address || '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-ink-500">
            You don’t have a medical record yet. Reception will create one when
            you first visit — you’ll need it before you can book an appointment.
          </p>
        )}
      </CardBody>
    </Card>
  )
}

export default function Profile() {
  const { role } = useAuth()

  return (
    <div className="space-y-5">
      <PageHeader
        title="My profile"
        description="Your account, and the record the hospital holds for you."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <AccountCard />
        {role === 'doctor' && <DoctorCard />}
        {role === 'patient' && <PatientCard />}
      </div>
    </div>
  )
}
