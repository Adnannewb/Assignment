import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useFetch, useMutation } from '../hooks/useFetch'
import { toList } from '../api/client'
import { patients as patientsApi, users as usersApi } from '../api/endpoints'
import Card, { CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal, { ConfirmDialog } from '../components/ui/Modal'
import PageHeader, { FilterBar } from '../components/ui/PageHeader'
import { Input, Select, Textarea } from '../components/ui/Field'
import { EmptyState, InlineError } from '../components/ui/States'
import { useToast } from '../components/ui/useToast'
import { initials, personName } from '../lib/utils'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

const BLANK = {
  user: '',
  age: '',
  gender: 'male',
  blood_group: '',
  address: '',
  phone: '',
}

function PatientForm({ onClose, patient, canPickAccount, onSaved }) {
  const isEdit = Boolean(patient)
  const toast = useToast()
  const [form, setForm] = useState(() =>
    patient
      ? {
          user: patient.user ?? '',
          age: patient.age ?? '',
          gender: patient.gender || 'male',
          blood_group: patient.blood_group ?? '',
          address: patient.address ?? '',
          phone: patient.phone ?? '',
        }
      : BLANK,
  )

  const { data: userData, loading: usersLoading } = useFetch(
    (signal) => usersApi.list({ role: 'patient' }, { signal }),
    [],
    { enabled: !isEdit && canPickAccount },
  )

  const { run, submitting, error, fieldErrors } = useMutation((payload) =>
    isEdit ? patientsApi.update(patient.id, payload) : patientsApi.create(payload),
  )

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = {
      age: Number(form.age) || 0,
      gender: form.gender,
      blood_group: form.blood_group,
      address: form.address,
      phone: form.phone,
    }
    if (!isEdit) payload.user = Number(form.user)

    try {
      await run(payload)
      toast.success(isEdit ? 'Patient updated.' : 'Patient registered.')
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
      title={isEdit ? 'Edit patient' : 'Register a patient'}
      description={
        isEdit
          ? 'Update this patient’s medical and contact details.'
          : 'Attach an existing patient account to a medical record.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="patient-form" loading={submitting}>
            {isEdit ? 'Save changes' : 'Register patient'}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {isEdit ? (
          <div className="rounded-lg bg-ink-50 px-3.5 py-3">
            <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              Account
            </p>
            <p className="mt-0.5 text-sm font-semibold text-ink-800">
              {personName(patient.user_detail)}
            </p>
          </div>
        ) : canPickAccount ? (
          <Select
            label="Patient account"
            value={form.user}
            onChange={update('user')}
            error={fieldErrors.user}
            hint={
              usersLoading
                ? 'Loading accounts…'
                : 'Accounts registered with the patient role.'
            }
            required
          >
            <option value="">Select an account…</option>
            {toList(userData).map((account) => (
              <option key={account.id} value={account.id}>
                {personName(account, account.username)} ({account.username})
              </option>
            ))}
          </Select>
        ) : (
          <Input
            label="Patient account ID"
            type="number"
            value={form.user}
            onChange={update('user')}
            error={fieldErrors.user}
            hint="The user ID of the patient account this record belongs to."
            required
          />
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Age"
            type="number"
            min="0"
            max="150"
            value={form.age}
            onChange={update('age')}
            error={fieldErrors.age}
            required
          />
          <Select
            label="Gender"
            value={form.gender}
            onChange={update('gender')}
            error={fieldErrors.gender}
            required
          >
            {GENDERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            label="Blood group"
            value={form.blood_group}
            onChange={update('blood_group')}
            error={fieldErrors.blood_group}
          >
            <option value="">Unknown</option>
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Phone"
          value={form.phone}
          onChange={update('phone')}
          error={fieldErrors.phone}
          maxLength={11}
          placeholder="01XXXXXXXXX"
        />

        <Textarea
          label="Address"
          value={form.address}
          onChange={update('address')}
          error={fieldErrors.address}
          rows={3}
          required
        />

        <InlineError>{error}</InlineError>
      </form>
    </Modal>
  )
}

export default function Patients() {
  const { role } = useAuth()
  const toast = useToast()
  const isAdmin = role === 'admin'
  const canManage = ['admin', 'receptionist'].includes(role)

  const [search, setSearch] = useState('')
  const [gender, setGender] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, loading, error, reload } = useFetch(
    (signal) => patientsApi.list(undefined, { signal }),
    [],
  )

  const { run: runDelete, submitting: removing } = useMutation((id) =>
    patientsApi.remove(id),
  )

  // The patient endpoint has no search backend, so filtering happens here.
  const patients = useMemo(() => {
    const all = toList(data)
    const term = search.trim().toLowerCase()
    return all.filter((patient) => {
      if (gender && patient.gender !== gender) return false
      if (!term) return true
      const haystack = [
        personName(patient.user_detail),
        patient.user_detail?.username,
        patient.user_detail?.email,
        patient.phone,
        patient.blood_group,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [data, search, gender])

  async function confirmDelete() {
    try {
      await runDelete(deleting.id)
      toast.success('Patient record removed.')
      setDeleting(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Patient',
      primary: true,
      render: (row) => {
        const name = personName(row.user_detail)
        return (
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">
              {initials(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">{name}</p>
              <p className="truncate text-xs text-ink-400">
                {row.user_detail?.email || row.user_detail?.username}
              </p>
            </div>
          </div>
        )
      },
    },
    { key: 'age', header: 'Age', render: (row) => `${row.age ?? '—'}` },
    {
      key: 'gender',
      header: 'Gender',
      render: (row) => <span className="capitalize">{row.gender || '—'}</span>,
    },
    {
      key: 'blood_group',
      header: 'Blood',
      render: (row) =>
        row.blood_group ? (
          <Badge tone="danger">{row.blood_group}</Badge>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    {
      key: 'address',
      header: 'Address',
      render: (row) => (
        <span className="line-clamp-2 max-w-[18rem] text-ink-600">
          {row.address || '—'}
        </span>
      ),
    },
  ]

  if (canManage) {
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
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${personName(row.user_detail)}`}
              className="text-rose-600 hover:bg-rose-50"
              onClick={() => setDeleting(row)}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Patients"
        description="Medical records, contact details and demographics."
        actions={
          canManage && (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              Register patient
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <CardHeader
          icon={Users}
          title={`${patients.length} patient${patients.length === 1 ? '' : 's'}`}
          description="Search by name, username, phone or blood group."
        />

        <FilterBar className="lg:grid-cols-3">
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
              placeholder="Search patients…"
              aria-label="Search patients"
              className="w-full rounded-lg bg-white py-2 pr-3 pl-9 text-sm ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            aria-label="Filter by gender"
            className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">Any gender</option>
            {GENDERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={patients}
          loading={loading}
          error={error}
          onRetry={reload}
          caption="Patients"
          empty={
            <EmptyState
              icon={Users}
              title="No patients found"
              description={
                search || gender
                  ? 'Try clearing the filters above.'
                  : 'Register a patient to get started.'
              }
            />
          }
        />
      </Card>

      {formOpen && (
        <PatientForm
          key={editing?.id ?? 'new'}
          onClose={() => setFormOpen(false)}
          patient={editing}
          canPickAccount={canManage}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Remove this patient?"
        description={`${personName(deleting?.user_detail)}'s record, appointments and bills will be deleted.`}
        confirmLabel="Remove patient"
      />
    </div>
  )
}
