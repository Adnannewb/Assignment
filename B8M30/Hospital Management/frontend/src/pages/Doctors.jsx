import { useState } from 'react'
import { Pencil, Plus, Search, Stethoscope, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useFetch, useDebounced, useMutation } from '../hooks/useFetch'
import { toList } from '../api/client'
import {
  departments as departmentsApi,
  doctors as doctorsApi,
  users as usersApi,
} from '../api/endpoints'
import Card, { CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal, { ConfirmDialog } from '../components/ui/Modal'
import PageHeader, { FilterBar } from '../components/ui/PageHeader'
import { Input, Select, Toggle } from '../components/ui/Field'
import { EmptyState, InlineError } from '../components/ui/States'
import { useToast } from '../components/ui/useToast'
import { initials, personName } from '../lib/utils'

const BLANK = {
  user: '',
  department: '',
  specialization: '',
  phone: '',
  experience: 0,
  is_available: true,
}

/**
 * Mounted only while open (and keyed on the record), so the initial state
 * below is always the right seed — no prop/state syncing effect needed.
 */
function DoctorForm({ onClose, doctor, departmentList, onSaved }) {
  const isEdit = Boolean(doctor)
  const toast = useToast()
  const [form, setForm] = useState(() =>
    doctor
      ? {
          user: doctor.user ?? '',
          department: doctor.department ?? '',
          specialization: doctor.specialization ?? '',
          phone: doctor.phone ?? '',
          experience: doctor.experience ?? 0,
          is_available: doctor.is_available ?? true,
        }
      : BLANK,
  )

  // Only admins open this form, and only admins may read the user list —
  // so the "which account?" picker is fetched lazily with the modal.
  const { data: userData, loading: usersLoading } = useFetch(
    (signal) => usersApi.list({ role: 'doctor' }, { signal }),
    [],
    { enabled: !isEdit },
  )

  const { run, submitting, error, fieldErrors } = useMutation((payload) =>
    isEdit ? doctorsApi.update(doctor.id, payload) : doctorsApi.create(payload),
  )

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = {
      department: form.department === '' ? null : Number(form.department),
      specialization: form.specialization,
      phone: form.phone,
      experience: Number(form.experience) || 0,
      is_available: form.is_available,
    }
    if (!isEdit) payload.user = Number(form.user)

    try {
      await run(payload)
      toast.success(isEdit ? 'Doctor updated.' : 'Doctor added.')
      onSaved()
      onClose()
    } catch {
      /* error is rendered inline */
    }
  }

  const availableUsers = toList(userData)

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit doctor' : 'Add a doctor'}
      description={
        isEdit
          ? 'Update the practice details for this doctor.'
          : 'Link an existing doctor account to a department and specialisation.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="doctor-form" loading={submitting}>
            {isEdit ? 'Save changes' : 'Add doctor'}
          </Button>
        </>
      }
    >
      <form id="doctor-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {isEdit ? (
          <div className="rounded-lg bg-ink-50 px-3.5 py-3">
            <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Account
            </p>
            <p className="mt-0.5 text-sm font-semibold text-ink-800">
              {personName(doctor.user_detail)}
            </p>
          </div>
        ) : (
          <Select
            label="Doctor account"
            value={form.user}
            onChange={update('user')}
            error={fieldErrors.user}
            hint={
              usersLoading
                ? 'Loading accounts…'
                : 'Accounts registered with the doctor role.'
            }
            required
          >
            <option value="">Select an account…</option>
            {availableUsers.map((account) => (
              <option key={account.id} value={account.id}>
                {personName(account, account.username)} ({account.username})
              </option>
            ))}
          </Select>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Specialization"
            value={form.specialization}
            onChange={update('specialization')}
            error={fieldErrors.specialization}
            placeholder="e.g. Cardiology"
            required
          />
          <Select
            label="Department"
            value={form.department ?? ''}
            onChange={update('department')}
            error={fieldErrors.department}
          >
            <option value="">Unassigned</option>
            {departmentList.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            value={form.phone}
            onChange={update('phone')}
            error={fieldErrors.phone}
            maxLength={11}
            placeholder="01XXXXXXXXX"
          />
          <Input
            label="Years of experience"
            type="number"
            min="0"
            value={form.experience}
            onChange={update('experience')}
            error={fieldErrors.experience}
          />
        </div>

        <div className="rounded-lg bg-ink-50 px-3.5 py-3">
          <Toggle
            checked={Boolean(form.is_available)}
            onChange={(checked) =>
              setForm((current) => ({ ...current, is_available: checked }))
            }
            label="Currently accepting appointments"
          />
        </div>

        <InlineError>{error}</InlineError>
      </form>
    </Modal>
  )
}

export default function Doctors() {
  const { role, user } = useAuth()
  const toast = useToast()
  const isAdmin = role === 'admin'

  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [availability, setAvailability] = useState('')
  const debouncedSearch = useDebounced(search)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const { data, loading, error, reload, setData } = useFetch(
    (signal) =>
      doctorsApi.list(
        {
          search: debouncedSearch,
          department,
          is_available: availability,
        },
        { signal },
      ),
    [debouncedSearch, department, availability],
  )

  const { data: departmentData } = useFetch(
    (signal) => departmentsApi.list(undefined, { signal }),
    [],
  )

  const doctors = toList(data)
  const departmentList = toList(departmentData)
  const departmentName = (id) =>
    departmentList.find((item) => item.id === id)?.name ?? '—'

  const { run: runDelete, submitting: deleting_ } = useMutation((id) =>
    doctorsApi.remove(id),
  )

  /** Admins may toggle anyone; a doctor may toggle only their own profile. */
  const canToggle = (doctor) =>
    isAdmin || (role === 'doctor' && doctor.user === user?.id)

  async function toggleAvailability(doctor, nextValue) {
    setTogglingId(doctor.id)
    // Optimistic: the switch should feel instant, and we roll back on error.
    setData((current) => {
      const list = toList(current)
      const next = list.map((item) =>
        item.id === doctor.id ? { ...item, is_available: nextValue } : item,
      )
      return Array.isArray(current) ? next : { ...current, results: next }
    })
    try {
      await doctorsApi.update(doctor.id, { is_available: nextValue })
      toast.success(
        `${personName(doctor.user_detail)} is now ${nextValue ? 'available' : 'unavailable'}.`,
      )
    } catch (err) {
      toast.error(err.message)
      reload()
    } finally {
      setTogglingId(null)
    }
  }

  async function confirmDelete() {
    try {
      await runDelete(deleting.id)
      toast.success('Doctor removed.')
      setDeleting(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Doctor',
      primary: true,
      render: (row) => {
        const name = personName(row.user_detail)
        return (
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
              {initials(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">Dr. {name}</p>
              <p className="truncate text-xs text-ink-400">
                {row.user_detail?.email || row.user_detail?.username}
              </p>
            </div>
          </div>
        )
      },
    },
    { key: 'specialization', header: 'Specialization' },
    {
      key: 'department',
      header: 'Department',
      render: (row) => departmentName(row.department),
    },
    {
      key: 'experience',
      header: 'Experience',
      render: (row) => `${row.experience ?? 0} yr${row.experience === 1 ? '' : 's'}`,
    },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    {
      key: 'is_available',
      header: 'Availability',
      render: (row) =>
        canToggle(row) ? (
          <Toggle
            checked={Boolean(row.is_available)}
            disabled={togglingId === row.id}
            onChange={(next) => toggleAvailability(row, next)}
            label={row.is_available ? 'Available' : 'Off duty'}
          />
        ) : (
          <Badge tone={row.is_available ? 'success' : 'neutral'}>
            {row.is_available ? 'Available' : 'Off duty'}
          </Badge>
        ),
    },
  ]

  if (isAdmin) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${personName(row.user_detail)}`}
            onClick={() => {
              setEditing(row)
              setFormOpen(true)
            }}
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${personName(row.user_detail)}`}
            className="text-rose-600 hover:bg-rose-50"
            onClick={() => setDeleting(row)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Doctors"
        description="Specialisations, departments and who is accepting appointments."
        actions={
          isAdmin && (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              Add doctor
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <CardHeader
          icon={Stethoscope}
          title={`${doctors.length} doctor${doctors.length === 1 ? '' : 's'}`}
          description="Search by name or specialisation."
        />

        <FilterBar>
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
              placeholder="Search doctors…"
              aria-label="Search doctors"
              className="w-full rounded-lg bg-white py-2 pr-3 pl-9 text-sm ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            aria-label="Filter by department"
            className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">All departments</option>
            {departmentList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            aria-label="Filter by availability"
            className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">Any availability</option>
            <option value="true">Available only</option>
            <option value="false">Off duty only</option>
          </select>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={doctors}
          loading={loading}
          error={error}
          onRetry={reload}
          caption="Doctors"
          empty={
            <EmptyState
              icon={Stethoscope}
              title="No doctors found"
              description={
                search || department || availability
                  ? 'Try clearing the filters above.'
                  : 'Add a doctor to get started.'
              }
            />
          }
        />
      </Card>

      {formOpen && (
        <DoctorForm
          key={editing?.id ?? 'new'}
          onClose={() => setFormOpen(false)}
          doctor={editing}
          departmentList={departmentList}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleting_}
        title="Remove this doctor?"
        description={`${personName(deleting?.user_detail)} will be removed from the doctor list. Their appointments and prescriptions will be deleted too.`}
        confirmLabel="Remove doctor"
      />
    </div>
  )
}
