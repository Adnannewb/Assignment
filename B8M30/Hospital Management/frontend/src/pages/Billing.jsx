import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  CircleDollarSign,
  Plus,
  Receipt,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useFetch, useMutation } from '../hooks/useFetch'
import { toList } from '../api/client'
import { bills as billsApi, patients as patientsApi } from '../api/endpoints'
import Card, { CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal, { ConfirmDialog } from '../components/ui/Modal'
import PageHeader, { FilterBar } from '../components/ui/PageHeader'
import { Input, Select } from '../components/ui/Field'
import { EmptyState, InlineError } from '../components/ui/States'
import { useToast } from '../components/ui/useToast'
import { cn, formatDateTime, formatMoney, personName } from '../lib/utils'

function BillForm({ onClose, patientList, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ patient: '', amount: '' })

  const { run, submitting, error, fieldErrors } = useMutation((payload) =>
    billsApi.create(payload),
  )

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      await run({
        patient: Number(form.patient),
        amount: form.amount,
        paid: false,
      })
      toast.success('Bill generated.')
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
      title="Generate a bill"
      description="Raise a new invoice against a patient's account."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="bill-form" loading={submitting}>
            Generate bill
          </Button>
        </>
      }
    >
      <form id="bill-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          value={form.amount}
          onChange={update('amount')}
          error={fieldErrors.amount}
          placeholder="0.00"
          hint="The bill starts as unpaid — mark it paid once settled."
          required
        />

        <InlineError>{error}</InlineError>
      </form>
    </Modal>
  )
}

function SummaryTile({ icon: Icon, label, value, tone }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tone)}
        >
          <Icon size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold text-ink-900 tabular-nums">{value}</p>
          <p className="truncate text-xs text-ink-500">{label}</p>
        </div>
      </div>
    </Card>
  )
}

export default function Billing() {
  const { role } = useAuth()
  const toast = useToast()
  const isAdmin = role === 'admin'
  const canGenerate = ['admin', 'receptionist'].includes(role)
  const canMarkPaid = ['admin', 'receptionist'].includes(role)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const { data, loading, error, reload } = useFetch(
    (signal) => billsApi.list(undefined, { signal }),
    [],
  )

  const { data: patientData } = useFetch(
    (signal) => patientsApi.list(undefined, { signal }),
    [],
    { enabled: canGenerate },
  )

  const bills = toList(data)
  const patientList = toList(patientData)

  const summary = useMemo(() => {
    const paid = bills.filter((bill) => bill.paid)
    const unpaid = bills.filter((bill) => !bill.paid)
    const sum = (list) => list.reduce((total, bill) => total + Number(bill.amount || 0), 0)
    return {
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      outstanding: sum(unpaid),
      collected: sum(paid),
    }
  }, [bills])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return bills.filter((bill) => {
      if (status === 'paid' && !bill.paid) return false
      if (status === 'unpaid' && bill.paid) return false
      if (!term) return true
      return [`#${bill.id}`, bill.patient_name, String(bill.amount)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [bills, search, status])

  const { run: runDelete, submitting: removing } = useMutation((id) =>
    billsApi.remove(id),
  )

  async function markPaid(bill) {
    setBusyId(bill.id)
    try {
      await billsApi.markPaid(bill.id)
      toast.success(`Bill #${bill.id} marked as paid.`)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    try {
      await runDelete(deleting.id)
      toast.success('Bill deleted.')
      setDeleting(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'Bill',
      primary: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-ink-900">
            #{row.id} · {row.patient_name?.trim() || `Patient #${row.patient}`}
          </p>
          <p className="text-xs text-ink-400">{formatDateTime(row.created_at)}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-ink-900 tabular-nums">
          {formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: 'paid',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.paid ? 'success' : 'warning'}>
          {row.paid ? 'Paid' : 'Unpaid'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          {canMarkPaid && !row.paid && (
            <Button
              size="sm"
              variant="subtle"
              icon={BadgeCheck}
              loading={busyId === row.id}
              onClick={() => markPaid(row)}
            >
              Mark paid
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete bill ${row.id}`}
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
        title="Billing"
        description={
          role === 'patient'
            ? 'Your invoices and what’s still outstanding.'
            : 'Invoices raised against patient accounts.'
        }
        actions={
          canGenerate && (
            <Button icon={Plus} onClick={() => setFormOpen(true)}>
              Generate bill
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SummaryTile
          icon={Wallet}
          label="Outstanding"
          value={formatMoney(summary.outstanding)}
          tone="bg-rose-50 text-rose-600"
        />
        <SummaryTile
          icon={CircleDollarSign}
          label="Collected"
          value={formatMoney(summary.collected)}
          tone="bg-emerald-50 text-emerald-600"
        />
        <SummaryTile
          icon={Receipt}
          label="Unpaid bills"
          value={summary.unpaidCount}
          tone="bg-amber-50 text-amber-600"
        />
        <SummaryTile
          icon={BadgeCheck}
          label="Paid bills"
          value={summary.paidCount}
          tone="bg-brand-50 text-brand-600"
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          icon={Receipt}
          title={`${filtered.length} bill${filtered.length === 1 ? '' : 's'}`}
          description="Search by bill number, patient or amount."
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
              placeholder="Search bills…"
              aria-label="Search bills"
              className="w-full rounded-lg bg-white py-2 pr-3 pl-9 text-sm ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by payment status"
            className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">Paid and unpaid</option>
            <option value="unpaid">Unpaid only</option>
            <option value="paid">Paid only</option>
          </select>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          error={error}
          onRetry={reload}
          caption="Bills"
          empty={
            <EmptyState
              icon={Receipt}
              title="No bills found"
              description={
                search || status
                  ? 'Try clearing the filters above.'
                  : canGenerate
                    ? 'Generate a bill to get started.'
                    : 'You have no bills right now.'
              }
            />
          }
        />
      </Card>

      {formOpen && (
        <BillForm
          onClose={() => setFormOpen(false)}
          patientList={patientList}
          onSaved={reload}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Delete this bill?"
        description={`Bill #${deleting?.id} for ${formatMoney(deleting?.amount)} will be permanently removed.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
