import { useMemo, useState } from 'react'
import {
  CalendarDays,
  CalendarPlus,
  Check,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useFetch, useMutation } from '../hooks/useFetch'
import { toList } from '../api/client'
import {
  appointments as appointmentsApi,
  doctors as doctorsApi,
  patients as patientsApi,
} from '../api/endpoints'
import Card, { CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import { STATUS_TONE } from '../lib/status'
import Button from '../components/ui/Button'
import Modal, { ConfirmDialog } from '../components/ui/Modal'
import PageHeader, { FilterBar } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Field'
import { EmptyState, InlineError } from '../components/ui/States'
import { useToast } from '../components/ui/useToast'
import {
  formatDateTime,
  fromDateTimeLocal,
  personName,
  toDateTimeLocal,
} from '../lib/utils'

const STATUSES = ['pending', 'approved', 'completed', 'cancelled']

const CLOSED = ['cancelled', 'completed']

function AppointmentForm({
  onClose,
  appointment,
  doctorList,
  patientList,
  lockedPatientId,
  canSetStatus,
  onSaved,
}) {
  const isEdit = Boolean(appointment)
  const toast = useToast()

  const [form, setForm] = useState(() => ({
    patient: appointment?.patient ?? lockedPatientId ?? '',
    doctor: appointment?.doctor ?? '',
    appointment_date: toDateTimeLocal(appointment?.appointment_date),
    status: appointment?.status ?? 'pending',
  }))

  const { run, submitting, error, fieldErrors } = useMutation((payload) =>
    isEdit
      ? appointmentsApi.update(appointment.id, payload)
      : appointmentsApi.create(payload),
  )

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = {
      patient: Number(form.patient),
      doctor: Number(form.doctor),
      appointment_date: fromDateTimeLocal(form.appointment_date),
    }
    if (canSetStatus) payload.status = form.status

    try {
      await run(payload)
      toast.success(isEdit ? 'Appointment updated.' : 'Appointment booked.')
      onSaved()
      onClose()
    } catch {
      /* rendered inline */
    }
  }

  // Booking a new slot with an off-duty doctor is pointless; when editing we
  // still list everyone so an existing booking keeps its doctor.
  const selectableDoctors = isEdit
    ? doctorList
    : doctorList.filter((doctor) => doctor.is_available)

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Update appointment' : 'Book an appointment'}
      description={
        isEdit
          ? 'Reschedule or change the status of this visit.'
          : 'Pick a doctor and a time slot.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="appointment-form" loading={submitting}>
            {isEdit ? 'Save changes' : 'Book appointment'}
          </Button>
        </>
      }
    >
      <form
        id="appointment-form"
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
      >
        {lockedPatientId ? (
          <div className="rounded-lg bg-ink-50 px-3.5 py-3">
            <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Patient
            </p>
            <p className="mt-0.5 text-sm font-semibold text-ink-800">
              This appointment will be booked in your name.
            </p>
          </div>
        ) : (
          <Select
            label="Patient"
            value={form.patient}
            onChange={update('patient')}
            error={fieldErrors.patient}
            required
          >
            <option value="">Select a patient…</option>
            {patientList.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {personName(patient.user_detail)}
              </option>
            ))}
          </Select>
        )}

        <Select
          label="Doctor"
          value={form.doctor}
          onChange={update('doctor')}
          error={fieldErrors.doctor}
          hint={
            !isEdit && selectableDoctors.length === 0
              ? 'No doctors are accepting appointments right now.'
              : undefined
          }
          required
        >
          <option value="">Select a doctor…</option>
          {selectableDoctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              Dr. {personName(doctor.user_detail)} — {doctor.specialization}
              {doctor.is_available ? '' : ' (off duty)'}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-700">
              Date &amp; time<span className="ml-0.5 text-rose-500">*</span>
            </span>
            <input
              type="datetime-local"
              value={form.appointment_date}
              min={toDateTimeLocal(new Date())}
              onChange={update('appointment_date')}
              required
              className="w-full rounded-lg bg-white px-3 py-2 text-sm text-ink-800 ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {fieldErrors.appointment_date && (
              <span className="text-xs font-medium text-rose-600">
                {fieldErrors.appointment_date}
              </span>
            )}
          </label>

          {canSetStatus && (
            <Select
              label="Status"
              value={form.status}
              onChange={update('status')}
              error={fieldErrors.status}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </Select>
          )}
        </div>

        <InlineError>{error}</InlineError>
      </form>
    </Modal>
  )
}

export default function Appointments() {
  const { role, user } = useAuth()
  const toast = useToast()

  const isPatient = role === 'patient'
  const isDoctor = role === 'doctor'
  const isAdmin = role === 'admin'
  const canApprove = isAdmin || isDoctor
  const canSetStatus = isAdmin || isDoctor || role === 'receptionist'

  const [filters, setFilters] = useState({ doctor: '', patient: '', date: '', status: '' })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const { data, loading, error, reload } = useFetch(
    (signal) =>
      appointmentsApi.list(
        {
          doctor: filters.doctor,
          patient: filters.patient,
          status: filters.status,
          appointment_date__date: filters.date,
        },
        { signal },
      ),
    [filters.doctor, filters.patient, filters.status, filters.date],
  )

  const { data: doctorData } = useFetch(
    (signal) => doctorsApi.list(undefined, { signal }),
    [],
  )

  // A patient may only read their own record, which is exactly what the
  // booking form needs — everyone else gets the full list for the filter.
  const { data: patientData } = useFetch(
    (signal) => patientsApi.list(undefined, { signal }),
    [],
  )

  const appointments = toList(data)
  const doctorList = toList(doctorData)
  const patientList = toList(patientData)

  // Patients book in their own name; prefer the id the API gave us at login.
  const ownPatientId = useMemo(() => {
    if (!isPatient) return null
    return user?.patient_id ?? patientList[0]?.id ?? null
  }, [isPatient, user, patientList])

  const { run: runCancel, submitting: cancelling_ } = useMutation((id) =>
    appointmentsApi.cancel(id),
  )
  const { run: runDelete, submitting: deleting_ } = useMutation((id) =>
    appointmentsApi.remove(id),
  )

  async function approve(appointment) {
    setBusyId(appointment.id)
    try {
      await appointmentsApi.approve(appointment.id)
      toast.success('Appointment approved.')
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function confirmCancel() {
    try {
      await runCancel(cancelling.id)
      toast.success('Appointment cancelled.')
      setCancelling(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function confirmDelete() {
    try {
      await runDelete(deleting.id)
      toast.success('Appointment deleted.')
      setDeleting(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const setFilter = (key) => (event) =>
    setFilters((current) => ({ ...current, [key]: event.target.value }))

  const hasFilters = Object.values(filters).some(Boolean)

  const columns = [
    {
      key: 'appointment_date',
      header: 'Date & time',
      primary: true,
      render: (row) => (
        <span className="font-medium whitespace-nowrap text-ink-900">
          {formatDateTime(row.appointment_date)}
        </span>
      ),
    },
    {
      key: 'patient_name',
      header: 'Patient',
      render: (row) => row.patient_name?.trim() || `Patient #${row.patient}`,
    },
    {
      key: 'doctor_name',
      header: 'Doctor',
      render: (row) =>
        row.doctor_name?.trim() ? `Dr. ${row.doctor_name}` : `Doctor #${row.doctor}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'created_at',
      header: 'Booked',
      render: (row) => (
        <span className="text-xs whitespace-nowrap text-ink-400">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const closed = CLOSED.includes(row.status)
        // A patient may reschedule only while the booking is still pending.
        const canEdit = !closed && (!isPatient || row.status === 'pending')
        return (
          <div className="flex flex-wrap justify-end gap-1.5">
            {canApprove && row.status === 'pending' && (
              <Button
                size="sm"
                variant="subtle"
                icon={Check}
                loading={busyId === row.id}
                onClick={() => approve(row)}
              >
                Approve
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit appointment"
                onClick={() => {
                  setEditing(row)
                  setFormOpen(true)
                }}
              >
                <Pencil size={16} />
              </Button>
            )}
            {!closed && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cancel appointment"
                className="text-amber-600 hover:bg-amber-50"
                onClick={() => setCancelling(row)}
              >
                <X size={16} />
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete appointment"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => setDeleting(row)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Appointments"
        description={
          isDoctor
            ? 'Your schedule — approve, reschedule or close out visits.'
            : isPatient
              ? 'Your visits — book a new one or cancel an existing booking.'
              : 'Every booking across the hospital.'
        }
        actions={
          <Button
            icon={CalendarPlus}
            onClick={() => {
              // A patient can only book against their own medical record;
              // without one there is nothing to attach the booking to.
              if (isPatient && !ownPatientId) {
                toast.error(
                  'You don’t have a patient record yet. Ask reception to register you first.',
                )
                return
              }
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Book appointment
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader
          icon={CalendarDays}
          title={`${appointments.length} appointment${appointments.length === 1 ? '' : 's'}`}
          description="Filter by doctor, patient, date or status."
          actions={
            hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                icon={RotateCcw}
                onClick={() =>
                  setFilters({ doctor: '', patient: '', date: '', status: '' })
                }
              >
                Clear
              </Button>
            )
          }
        />

        <FilterBar>
          <select
            value={filters.doctor}
            onChange={setFilter('doctor')}
            aria-label="Filter by doctor"
            className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">All doctors</option>
            {doctorList.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {personName(doctor.user_detail)}
              </option>
            ))}
          </select>

          <select
            value={filters.patient}
            onChange={setFilter('patient')}
            aria-label="Filter by patient"
            disabled={isPatient}
            className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400"
          >
            <option value="">All patients</option>
            {patientList.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {personName(patient.user_detail)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={setFilter('date')}
            aria-label="Filter by date"
            className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />

          <select
            value={filters.status}
            onChange={setFilter('status')}
            aria-label="Filter by status"
            className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm capitalize ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">Any status</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={appointments}
          loading={loading}
          error={error}
          onRetry={reload}
          caption="Appointments"
          empty={
            <EmptyState
              icon={CalendarDays}
              title="No appointments"
              description={
                hasFilters
                  ? 'Nothing matches these filters.'
                  : 'Book the first appointment to see it here.'
              }
            />
          }
        />
      </Card>

      {formOpen && (
        <AppointmentForm
          key={editing?.id ?? 'new'}
          onClose={() => setFormOpen(false)}
          appointment={editing}
          doctorList={doctorList}
          patientList={patientList}
          lockedPatientId={isPatient ? ownPatientId : null}
          canSetStatus={canSetStatus && Boolean(editing)}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={confirmCancel}
        loading={cancelling_}
        tone="danger"
        title="Cancel this appointment?"
        description={`The ${formatDateTime(cancelling?.appointment_date)} visit will be marked cancelled. The record stays in the history.`}
        confirmLabel="Cancel appointment"
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleting_}
        title="Delete this appointment?"
        description="The appointment and any prescription attached to it will be permanently removed."
        confirmLabel="Delete"
      />
    </div>
  )
}
