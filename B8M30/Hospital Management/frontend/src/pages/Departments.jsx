import { useState } from 'react'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useFetch, useMutation } from '../hooks/useFetch'
import { toList } from '../api/client'
import { departments as departmentsApi } from '../api/endpoints'
import Card, { CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Modal, { ConfirmDialog } from '../components/ui/Modal'
import PageHeader from '../components/ui/PageHeader'
import { Input, Textarea } from '../components/ui/Field'
import { EmptyState, InlineError } from '../components/ui/States'
import { useToast } from '../components/ui/useToast'

function DepartmentForm({ onClose, department, onSaved }) {
  const isEdit = Boolean(department)
  const toast = useToast()
  const [form, setForm] = useState(() => ({
    name: department?.name ?? '',
    description: department?.description ?? '',
  }))

  const { run, submitting, error, fieldErrors } = useMutation((payload) =>
    isEdit
      ? departmentsApi.update(department.id, payload)
      : departmentsApi.create(payload),
  )

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await run(form)
      toast.success(isEdit ? 'Department updated.' : 'Department created.')
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
      title={isEdit ? 'Edit department' : 'New department'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="department-form" loading={submitting}>
            {isEdit ? 'Save changes' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="department-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Name"
          value={form.name}
          onChange={update('name')}
          error={fieldErrors.name}
          placeholder="e.g. Cardiology"
          required
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={update('description')}
          error={fieldErrors.description}
          rows={3}
        />
        <InlineError>{error}</InlineError>
      </form>
    </Modal>
  )
}

export default function Departments() {
  const toast = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, loading, error, reload } = useFetch(
    (signal) => departmentsApi.list(undefined, { signal }),
    [],
  )

  const departments = toList(data)

  const { run: runDelete, submitting: removing } = useMutation((id) =>
    departmentsApi.remove(id),
  )

  async function confirmDelete() {
    try {
      await runDelete(deleting.id)
      toast.success('Department removed.')
      setDeleting(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Departments"
        description="The clinical units doctors are assigned to."
        actions={
          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            New department
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader
          icon={Building2}
          title={`${departments.length} department${departments.length === 1 ? '' : 's'}`}
        />
        <DataTable
          rows={departments}
          loading={loading}
          error={error}
          onRetry={reload}
          caption="Departments"
          columns={[
            {
              key: 'name',
              header: 'Name',
              primary: true,
              render: (row) => (
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">
                    <Building2 size={16} aria-hidden="true" />
                  </span>
                  <span className="font-semibold text-ink-900">{row.name}</span>
                </div>
              ),
            },
            {
              key: 'description',
              header: 'Description',
              render: (row) => (
                <span className="line-clamp-2 max-w-[32rem] text-ink-600">
                  {row.description || (
                    <span className="text-ink-400">No description</span>
                  )}
                </span>
              ),
            },
            {
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
            },
          ]}
          empty={
            <EmptyState
              icon={Building2}
              title="No departments yet"
              description="Create one so doctors can be grouped by specialty."
            />
          }
        />
      </Card>

      {formOpen && (
        <DepartmentForm
          key={editing?.id ?? 'new'}
          onClose={() => setFormOpen(false)}
          department={editing}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Remove this department?"
        description={`“${deleting?.name}” will be removed. Doctors in it become unassigned.`}
        confirmLabel="Remove"
      />
    </div>
  )
}
