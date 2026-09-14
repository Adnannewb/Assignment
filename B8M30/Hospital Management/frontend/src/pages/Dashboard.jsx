import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  FileText,
  Pill,
  Receipt,
  ShieldAlert,
  Stethoscope,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useFetch } from '../hooks/useFetch'
import { toList } from '../api/client'
import {
  appointments as appointmentsApi,
  bills as billsApi,
  doctors as doctorsApi,
  patients as patientsApi,
  prescriptions as prescriptionsApi,
  users as usersApi,
} from '../api/endpoints'
import Card, { CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import { STATUS_TONE } from '../lib/status'
import PageHeader from '../components/ui/PageHeader'
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/States'
import { cn, formatDateTime, personName, todayISODate } from '../lib/utils'

const TILE_TONES = {
  brand: 'bg-brand-50 text-brand-600',
  sky: 'bg-sky-50 text-sky-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  rose: 'bg-rose-50 text-rose-600',
  emerald: 'bg-emerald-50 text-emerald-600',
}

function StatTile({ icon: Icon, label, value, hint, tone = 'brand', to, loading }) {
  const body = (
    <Card className={cn('h-full p-4 transition-shadow sm:p-5', to && 'hover:shadow-pop')}>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'grid h-10 w-10 place-items-center rounded-xl',
            TILE_TONES[tone],
          )}
        >
          <Icon size={19} aria-hidden="true" />
        </span>
        {to && <ArrowRight size={16} className="text-ink-300" aria-hidden="true" />}
      </div>
      <p className="mt-3.5 text-2xl font-bold text-ink-900 tabular-nums">
        {loading ? (
          <span className="inline-block h-7 w-12 animate-pulse rounded bg-ink-100 align-middle" />
        ) : (
          value
        )}
      </p>
      <p className="mt-0.5 text-sm font-medium text-ink-600">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
    </Card>
  )

  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}

/** Fetch only what this role is permitted to read, so no tile 403s. */
function useDashboardData(role) {
  return useFetch(
    async (signal) => {
      const opts = { signal }
      const wanted = {
        appointments: true,
        doctors: role !== 'doctor',
        patients: ['admin', 'doctor', 'receptionist'].includes(role),
        prescriptions: ['admin', 'doctor', 'patient'].includes(role),
        bills: ['admin', 'receptionist', 'patient'].includes(role),
        // Only an admin can act on the approval queue, so only an admin
        // needs to see how long it is.
        pending: role === 'admin',
      }

      const [appointments, doctors, patients, prescriptions, bills, pending] =
        await Promise.all([
          wanted.appointments ? appointmentsApi.list(undefined, opts) : null,
          wanted.doctors ? doctorsApi.list(undefined, opts) : null,
          wanted.patients ? patientsApi.list(undefined, opts) : null,
          wanted.prescriptions ? prescriptionsApi.list(undefined, opts) : null,
          wanted.bills ? billsApi.list(undefined, opts) : null,
          wanted.pending ? usersApi.list({ is_approved: false }, opts) : null,
        ])

      return {
        appointments: toList(appointments),
        doctors: toList(doctors),
        patients: toList(patients),
        prescriptions: toList(prescriptions),
        bills: toList(bills),
        pending: toList(pending),
        has: wanted,
      }
    },
    [role],
  )
}

export default function Dashboard() {
  const { user, role } = useAuth()
  const { data, loading, error, reload } = useDashboardData(role)

  const appointments = data?.appointments ?? []
  const today = todayISODate()

  const todays = appointments.filter(
    (item) => (item.appointment_date ?? '').slice(0, 10) === today,
  )
  const pending = appointments.filter((item) => item.status === 'pending')
  const upcoming = appointments
    .filter(
      (item) =>
        !['cancelled', 'completed'].includes(item.status) &&
        new Date(item.appointment_date) >= new Date(),
    )
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
    .slice(0, 6)

  const pendingApprovals = data?.pending ?? []
  const unpaid = (data?.bills ?? []).filter((bill) => !bill.paid)
  const unpaidTotal = unpaid.reduce((sum, bill) => sum + Number(bill.amount || 0), 0)
  const availableDoctors = (data?.doctors ?? []).filter((doc) => doc.is_available)

  const greeting = personName(user, user?.username)

  const tiles = {
    admin: [
      { icon: CalendarDays, label: 'Appointments today', value: todays.length, tone: 'brand', to: '/appointments' },
      { icon: Stethoscope, label: 'Doctors', value: data?.doctors?.length ?? 0, hint: `${availableDoctors.length} available now`, tone: 'sky', to: '/doctors' },
      { icon: Users, label: 'Registered patients', value: data?.patients?.length ?? 0, tone: 'violet', to: '/patients' },
      { icon: Wallet, label: 'Unpaid bills', value: unpaid.length, hint: `${unpaidTotal.toFixed(2)} outstanding`, tone: 'rose', to: '/billing' },
    ],
    doctor: [
      { icon: CalendarDays, label: 'My appointments today', value: todays.length, tone: 'brand', to: '/appointments' },
      { icon: CalendarClock, label: 'Awaiting my approval', value: pending.length, tone: 'amber', to: '/appointments' },
      { icon: FileText, label: 'Prescriptions written', value: data?.prescriptions?.length ?? 0, tone: 'violet', to: '/prescriptions' },
      { icon: Users, label: 'Patients on file', value: data?.patients?.length ?? 0, tone: 'sky', to: '/patients' },
    ],
    patient: [
      { icon: CalendarCheck, label: 'Upcoming visits', value: upcoming.length, tone: 'brand', to: '/appointments' },
      { icon: FileText, label: 'My prescriptions', value: data?.prescriptions?.length ?? 0, tone: 'violet', to: '/prescriptions' },
      { icon: Receipt, label: 'Unpaid bills', value: unpaid.length, hint: `${unpaidTotal.toFixed(2)} due`, tone: 'rose', to: '/billing' },
      { icon: Stethoscope, label: 'Doctors available', value: availableDoctors.length, tone: 'emerald', to: '/doctors' },
    ],
    receptionist: [
      { icon: CalendarDays, label: 'Appointments today', value: todays.length, tone: 'brand', to: '/appointments' },
      { icon: CalendarClock, label: 'Pending approval', value: pending.length, tone: 'amber', to: '/appointments' },
      { icon: Users, label: 'Registered patients', value: data?.patients?.length ?? 0, tone: 'violet', to: '/patients' },
      { icon: Wallet, label: 'Unpaid bills', value: unpaid.length, hint: `${unpaidTotal.toFixed(2)} outstanding`, tone: 'rose', to: '/billing' },
    ],
  }[role] ?? []

  const quickLinks = {
    admin: [
      { to: '/users', label: 'Add an admin or receptionist', icon: UserPlus },
      { to: '/doctors', label: 'Doctors', icon: Stethoscope },
      { to: '/medicines', label: 'Medicines', icon: Pill },
      { to: '/billing', label: 'Billing', icon: Receipt },
    ],
    doctor: [
      { to: '/appointments', label: 'My schedule', icon: CalendarDays },
      { to: '/prescriptions', label: 'Write a prescription', icon: FileText },
      { to: '/medicines', label: 'Medicine list', icon: Pill },
      { to: '/profile', label: 'Set availability', icon: Stethoscope },
    ],
    patient: [
      { to: '/appointments', label: 'Book an appointment', icon: CalendarDays },
      { to: '/prescriptions', label: 'My prescriptions', icon: FileText },
      { to: '/billing', label: 'My bills', icon: Receipt },
      { to: '/doctors', label: 'Find a doctor', icon: Stethoscope },
    ],
    receptionist: [
      { to: '/appointments', label: 'Book an appointment', icon: CalendarDays },
      { to: '/patients', label: 'Register a patient', icon: Users },
      { to: '/billing', label: 'Generate a bill', icon: Receipt },
      { to: '/doctors', label: 'Doctor availability', icon: Stethoscope },
    ],
  }[role] ?? []

  if (error) {
    return (
      <Card>
        <ErrorState error={error} onRetry={reload} />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good day, ${greeting.split(' ')[0]}`}
        description="Here’s what’s happening across the hospital today."
      />

      {/* Doctors who signed themselves up are locked out until vetted, so
          this queue is time-sensitive — it sits above everything else. */}
      {pendingApprovals.length > 0 && (
        <Link
          to="/users"
          className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-200 transition-colors hover:bg-amber-100 sm:px-5"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <ShieldAlert size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-amber-900">
              {pendingApprovals.length} doctor
              {pendingApprovals.length === 1 ? '' : 's'} waiting for approval
            </span>
            <span className="block text-xs text-amber-700">
              They can’t sign in until you approve them.
            </span>
          </span>
          <ArrowRight size={16} className="shrink-0 text-amber-700" aria-hidden="true" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <StatTile key={tile.label} loading={loading} {...tile} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader
            icon={CalendarClock}
            title="Next appointments"
            description="Upcoming visits that haven’t been completed or cancelled"
            actions={
              <Link
                to="/appointments"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
              >
                View all
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            }
          />
          {loading ? (
            <SkeletonRows rows={4} />
          ) : (
            <DataTable
              rows={upcoming}
              caption="Upcoming appointments"
              columns={[
                {
                  key: 'when',
                  header: 'When',
                  primary: true,
                  render: (row) => (
                    <span className="font-medium text-ink-900">
                      {formatDateTime(row.appointment_date)}
                    </span>
                  ),
                },
                {
                  key: 'patient_name',
                  header: 'Patient',
                  render: (row) => row.patient_name?.trim() || `#${row.patient}`,
                },
                {
                  key: 'doctor_name',
                  header: 'Doctor',
                  render: (row) => row.doctor_name?.trim() || `#${row.doctor}`,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
                  ),
                },
              ]}
              empty={
                <EmptyState
                  icon={CalendarDays}
                  title="Nothing scheduled"
                  description="When an appointment is booked it will show up here."
                />
              }
            />
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader icon={ArrowRight} title="Quick actions" />
          <div className="divide-y divide-ink-100">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to + label}
                to={to}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-brand-50/60 sm:px-5"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink-100 text-ink-500">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-medium text-ink-700">
                  {label}
                </span>
                <ArrowRight size={15} className="text-ink-300" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
