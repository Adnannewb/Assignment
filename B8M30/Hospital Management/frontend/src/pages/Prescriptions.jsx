import { useMemo, useState } from 'react'
import {
  Eye,
  FilePlus2,
  FileText,
  Pill,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useFetch, useMutation } from '../hooks/useFetch'
import { toList } from '../api/client'
import {
  appointments as appointmentsApi,
  medicines as medicinesApi,
  prescriptions as prescriptionsApi,
} from '../api/endpoints'
import Card, { CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal, { ConfirmDialog } from '../components/ui/Modal'
import PageHeader, { FilterBar } from '../components/ui/PageHeader'
import { Input, Select, Textarea } from '../components/ui/Field'
import { EmptyState, InlineError } from '../components/ui/States'
import { useToast } from '../components/ui/useToast'
import { formatDateTime } from '../lib/utils'

/** One blank medicine line. Each row carries a key so React can track it
 *  across add/remove without remounting the untouched rows. */
let rowSeq = 0
const blankRow = () => ({ key: `row-${rowSeq++}`, medicine: '', dosage: '', duration: '' })

function PrescriptionForm({ onClose, appointmentOptions, medicineList, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ appointment: '', diagnosis: '', notes: '' })
  const [rows, setRows] = useState(() => [blankRow()])

  const { run, submitting, error, fieldErrors } = useMutation((payload) =>
    prescriptionsApi.create(payload),
  )

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const updateRow = (key, field) => (event) =>
    setRows((current) =>
      current.map((row) =>
        row.key === key ? { ...row, [field]: event.target.value } : row,
      ),
    )

  const addRow = () => setRows((current) => [...current, blankRow()])

  const removeRow = (key) =>
    setRows((current) =>
      // Always leave one row behind — an empty list has no affordance to
      // add the first medicine back.
      current.length === 1 ? current : current.filter((row) => row.key !== key),
    )

  const filledRows = rows.filter((row) => row.medicine)

  async function handleSubmit(event) {
    event.preventDefault()
    if (filledRows.length === 0) {
      toast.error('Add at least one medicine to the prescription.')
      return
    }

    try {
      await run({
        appointment: Number(form.appointment),
        diagnosis: form.diagnosis,
        notes: form.notes,
        prescription_medicines: filledRows.map((row) => ({
          medicine: Number(row.medicine),
          dosage: row.dosage,
          duration: row.duration,
        })),
      })
      toast.success('Prescription created.')
      onSaved()
      onClose()
    } catch {
      /* rendered inline */
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="New prescription"
      description="Record the diagnosis and everything the patient should take."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="prescription-form" loading={submitting}>
            Save prescription
          </Button>
        </>
      }
    >
      <form
        id="prescription-form"
        onSubmit={handleSubmit}
        className="space-y-5"
        noValidate
      >
        <Select
          label="Appointment"
          value={form.appointment}
          onChange={update('appointment')}
          error={fieldErrors.appointment}
          hint={
            appointmentOptions.length === 0
              ? 'Every appointment already has a prescription.'
              : 'Only appointments without a prescription are listed.'
          }
          required
        >
          <option value="">Select an appointment…</option>
          {appointmentOptions.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              {formatDateTime(appointment.appointment_date)} —{' '}
              {appointment.patient_name?.trim() || `Patient #${appointment.patient}`}
            </option>
          ))}
        </Select>

        <Textarea
          label="Diagnosis"
          value={form.diagnosis}
          onChange={update('diagnosis')}
          error={fieldErrors.diagnosis}
          rows={2}
          placeholder="What you found"
          required
        />

        {/* Dynamic medicine rows */}
        <fieldset className="rounded-xl bg-ink-50 p-3.5 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <legend className="flex items-center gap-2 text-sm font-semibold text-ink-800">
              <Pill size={16} className="text-brand-600" aria-hidden="true" />
              Medicines
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-500 ring-1 ring-ink-200">
                {filledRows.length}
              </span>
            </legend>
            <Button type="button" size="sm" variant="secondary" icon={Plus} onClick={addRow}>
              Add medicine
            </Button>
          </div>

          <div className="space-y-2.5">
            {rows.map((row, index) => (
              <div
                key={row.key}
                className="grid gap-2.5 rounded-lg bg-white p-3 ring-1 ring-ink-200 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_auto] sm:items-end"
              >
                <Select
                  label={index === 0 ? 'Medicine' : undefined}
                  aria-label="Medicine"
                  value={row.medicine}
                  onChange={updateRow(row.key, 'medicine')}
                >
                  <option value="">Select…</option>
                  {medicineList.map((medicine) => (
                    <option key={medicine.id} value={medicine.id}>
                      {medicine.name} ({medicine.unit})
                    </option>
                  ))}
                </Select>
                <Input
                  label={index === 0 ? 'Dosage' : undefined}
                  aria-label="Dosage"
                  value={row.dosage}
                  onChange={updateRow(row.key, 'dosage')}
                  placeholder="1 + 0 + 1"
                />
                <Input
                  label={index === 0 ? 'Duration' : undefined}
                  aria-label="Duration"
                  value={row.duration}
                  onChange={updateRow(row.key, 'duration')}
                  placeholder="7 days"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove medicine row ${index + 1}`}
                  disabled={rows.length === 1}
                  className="justify-self-end text-rose-600 hover:bg-rose-50"
                  onClick={() => removeRow(row.key)}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>

          {fieldErrors.prescription_medicines && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {fieldErrors.prescription_medicines}
            </p>
          )}
        </fieldset>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={update('notes')}
          error={fieldErrors.notes}
          rows={2}
          placeholder="Advice, follow-up, warnings…"
        />

        <InlineError>{error}</InlineError>
      </form>
    </Modal>
  )
}

function PrescriptionDetail({ prescription, appointment, onClose }) {
  const medicines = prescription.prescription_medicines ?? []
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={`Prescription #${prescription.id}`}
      description={formatDateTime(prescription.created_at)}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <dl className="grid gap-3 rounded-xl bg-ink-50 p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Patient
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink-800">
              {appointment?.patient_name?.trim() || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Doctor
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink-800">
              {appointment?.doctor_name?.trim() ? `Dr. ${appointment.doctor_name}` : '—'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Visit
            </dt>
            <dd className="mt-0.5 text-sm text-ink-700">
              {appointment
                ? formatDateTime(appointment.appointment_date)
                : `Appointment #${prescription.appointment}`}
            </dd>
          </div>
        </dl>

        <section>
          <h3 className="text-xs font-medium tracking-wide text-ink-400 uppercase">
            Diagnosis
          </h3>
          <p className="mt-1 text-sm whitespace-pre-wrap text-ink-700">
            {prescription.diagnosis || '—'}
          </p>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-400 uppercase">
            Medicines ({medicines.length})
          </h3>
          {medicines.length === 0 ? (
            <p className="text-sm text-ink-500">No medicines recorded.</p>
          ) : (
            <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl ring-1 ring-ink-200">
              {medicines.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 bg-white px-3.5 py-3"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <Pill size={15} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-ink-800">
                      {item.medicine_name || `Medicine #${item.medicine}`}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {item.dosage && <Badge tone="brand">{item.dosage}</Badge>}
                    {item.duration && <Badge tone="info">{item.duration}</Badge>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {prescription.notes && (
          <section>
            <h3 className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Notes
            </h3>
            <p className="mt-1 text-sm whitespace-pre-wrap text-ink-700">
              {prescription.notes}
            </p>
          </section>
        )}
      </div>
    </Modal>
  )
}

export default function Prescriptions() {
  const { role } = useAuth()
  const toast = useToast()
  const canWrite = ['admin', 'doctor'].includes(role)

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, loading, error, reload } = useFetch(
    (signal) => prescriptionsApi.list(undefined, { signal }),
    [],
  )

  // Prescriptions only carry an appointment id, so the names come from here.
  const { data: appointmentData } = useFetch(
    (signal) => appointmentsApi.list(undefined, { signal }),
    [],
  )

  const { data: medicineData } = useFetch(
    (signal) => medicinesApi.list(undefined, { signal }),
    [],
    { enabled: canWrite },
  )

  const prescriptions = toList(data)
  const appointmentList = toList(appointmentData)
  const medicineList = toList(medicineData)

  const appointmentById = useMemo(() => {
    const map = new Map()
    for (const appointment of appointmentList) map.set(appointment.id, appointment)
    return map
  }, [appointmentList])

  // A prescription is one-to-one with an appointment, so anything already
  // prescribed against must drop out of the picker.
  const availableAppointments = useMemo(() => {
    const taken = new Set(prescriptions.map((item) => item.appointment))
    return appointmentList.filter(
      (appointment) =>
        !taken.has(appointment.id) && appointment.status !== 'cancelled',
    )
  }, [appointmentList, prescriptions])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return prescriptions
    return prescriptions.filter((item) => {
      const appointment = appointmentById.get(item.appointment)
      const haystack = [
        `#${item.id}`,
        item.diagnosis,
        item.notes,
        appointment?.patient_name,
        appointment?.doctor_name,
        ...(item.prescription_medicines ?? []).map((row) => row.medicine_name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [prescriptions, search, appointmentById])

  const { run: runDelete, submitting: removing } = useMutation((id) =>
    prescriptionsApi.remove(id),
  )

  async function confirmDelete() {
    try {
      await runDelete(deleting.id)
      toast.success('Prescription deleted.')
      setDeleting(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'Rx',
      primary: true,
      render: (row) => {
        const appointment = appointmentById.get(row.appointment)
        return (
          <div className="min-w-0">
            <p className="font-semibold text-ink-900">
              #{row.id} · {appointment?.patient_name?.trim() || 'Patient'}
            </p>
            <p className="truncate text-xs text-ink-400">
              {appointment?.doctor_name?.trim()
                ? `Dr. ${appointment.doctor_name}`
                : `Appointment #${row.appointment}`}
            </p>
          </div>
        )
      },
    },
    {
      key: 'diagnosis',
      header: 'Diagnosis',
      render: (row) => (
        <span className="line-clamp-2 max-w-[20rem] text-ink-700">
          {row.diagnosis || '—'}
        </span>
      ),
    },
    {
      key: 'medicines',
      header: 'Medicines',
      render: (row) => {
        const count = row.prescription_medicines?.length ?? 0
        return (
          <Badge tone={count ? 'brand' : 'neutral'}>
            {count} item{count === 1 ? '' : 's'}
          </Badge>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Issued',
      render: (row) => (
        <span className="whitespace-nowrap text-ink-600">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="secondary" icon={Eye} onClick={() => setViewing(row)}>
            View
          </Button>
          {canWrite && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete prescription ${row.id}`}
              className="text-rose-600 hover:bg-rose-50"
              onClick={() => setDeleting(row)}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prescriptions"
        description={
          role === 'patient'
            ? 'Everything your doctors have prescribed, newest first.'
            : 'Diagnoses and medicines issued against appointments.'
        }
        actions={
          canWrite && (
            <Button icon={FilePlus2} onClick={() => setFormOpen(true)}>
              New prescription
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <CardHeader
          icon={FileText}
          title={`${filtered.length} prescription${filtered.length === 1 ? '' : 's'}`}
          description="Search by patient, doctor, diagnosis or medicine."
        />

        <FilterBar className="lg:grid-cols-2">
          <div className="relative sm:col-span-2">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search prescription history…"
              aria-label="Search prescriptions"
              className="w-full rounded-lg bg-white py-2 pr-3 pl-9 text-sm ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          error={error}
          onRetry={reload}
          caption="Prescriptions"
          empty={
            <EmptyState
              icon={FileText}
              title="No prescriptions yet"
              description={
                search
                  ? 'Nothing matches that search.'
                  : canWrite
                    ? 'Write one against a completed appointment.'
                    : 'Prescriptions your doctor issues will appear here.'
              }
            />
          }
        />
      </Card>

      {formOpen && (
        <PrescriptionForm
          onClose={() => setFormOpen(false)}
          appointmentOptions={availableAppointments}
          medicineList={medicineList}
          onSaved={reload}
        />
      )}

      {viewing && (
        <PrescriptionDetail
          prescription={viewing}
          appointment={appointmentById.get(viewing.appointment)}
          onClose={() => setViewing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Delete this prescription?"
        description={`Prescription #${deleting?.id} and its medicine list will be permanently removed.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
