import { useState } from 'react'
import { Pencil, Pill, Plus, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useDebounced, useFetch, useMutation } from '../hooks/useFetch'
import { toList } from '../api/client'
import { medicines as medicinesApi } from '../api/endpoints'
import Card, { CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal, { ConfirmDialog } from '../components/ui/Modal'
import PageHeader, { FilterBar } from '../components/ui/PageHeader'
import { Input, Textarea } from '../components/ui/Field'
import { EmptyState, InlineError } from '../components/ui/States'
import { useToast } from '../components/ui/useToast'

function MedicineForm({ onClose, medicine, onSaved }) {
  const isEdit = Boolean(medicine)
  const toast = useToast()
  const [form, setForm] = useState(() => ({
    name: medicine?.name ?? '',
    unit: medicine?.unit ?? '',
    description: medicine?.description ?? '',
  }))

  const { run, submitting, error, fieldErrors } = useMutation((payload) =>
    isEdit ? medicinesApi.update(medicine.id, payload) : medicinesApi.create(payload),
  )

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await run(form)
      toast.success(isEdit ? 'Medicine updated.' : 'Medicine added.')
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
      title={isEdit ? 'Edit medicine' : 'Add a medicine'}
      description="Medicines listed here are what doctors can prescribe."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="medicine-form" loading={submitting}>
            {isEdit ? 'Save changes' : 'Add medicine'}
          </Button>
        </>
      }
    >
      <form id="medicine-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Name"
          value={form.name}
          onChange={update('name')}
          error={fieldErrors.name}
          placeholder="e.g. Napa Extra"
          required
        />
        <Input
          label="Unit"
          value={form.unit}
          onChange={update('unit')}
          error={fieldErrors.unit}
          placeholder="e.g. 500 mg tablet"
          required
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={update('description')}
          error={fieldErrors.description}
          rows={3}
          placeholder="What it treats, cautions, anything worth noting"
        />
        <InlineError>{error}</InlineError>
      </form>
    </Modal>
  )
}

export default function Medicines() {
  const { role } = useAuth()
  const toast = useToast()
  const isAdmin = role === 'admin'

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, loading, error, reload } = useFetch(
    (signal) => medicinesApi.list({ search: debouncedSearch }, { signal }),
    [debouncedSearch],
  )

  const medicines = toList(data)

  const { run: runDelete, submitting: removing } = useMutation((id) =>
    medicinesApi.remove(id),
  )

  async function confirmDelete() {
    try {
      await runDelete(deleting.id)
      toast.success('Medicine removed.')
      setDeleting(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Medicine',
      primary: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Pill size={16} aria-hidden="true" />
          </span>
          <span className="font-semibold text-ink-900">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (row) => <Badge tone="info">{row.unit || '—'}</Badge>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span className="line-clamp-2 max-w-[30rem] text-ink-600">
          {row.description || <span className="text-ink-400">No description</span>}
        </span>
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
            aria-label={`Edit ${row.name}`}
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
            aria-label={`Remove ${row.name}`}
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
        title="Medicines"
        description="The hospital formulary — everything available to prescribe."
        actions={
          isAdmin && (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              Add medicine
            </Button>
          )
        }
      />

      <Card className="overflow-hidden">
        <CardHeader
          icon={Pill}
          title={`${medicines.length} medicine${medicines.length === 1 ? '' : 's'}`}
          description="Search by name or description."
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
              placeholder="Search medicines…"
              aria-label="Search medicines"
              className="w-full rounded-lg bg-white py-2 pr-3 pl-9 text-sm ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={medicines}
          loading={loading}
          error={error}
          onRetry={reload}
          caption="Medicines"
          empty={
            <EmptyState
              icon={Pill}
              title="No medicines found"
              description={
                search
                  ? `Nothing matches “${search}”.`
                  : 'Add the first medicine to the formulary.'
              }
            />
          }
        />
      </Card>

      {formOpen && (
        <MedicineForm
          key={editing?.id ?? 'new'}
          onClose={() => setFormOpen(false)}
          medicine={editing}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Remove this medicine?"
        description={`“${deleting?.name}” will no longer be prescribable. Existing prescriptions that use it will be deleted.`}
        confirmLabel="Remove"
      />
    </div>
  )
}
