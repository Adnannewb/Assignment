import { useMemo, useState } from 'react'
import {
  Check,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useDebounced, useFetch, useMutation } from '../hooks/useFetch'
import { toList } from '../api/client'
import { users as usersApi } from '../api/endpoints'
import { ROLE_BADGE, ROLE_LABEL } from '../auth/roles'
import Card, { CardHeader } from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal, { ConfirmDialog } from '../components/ui/Modal'
import PageHeader, { FilterBar } from '../components/ui/PageHeader'
import { Input, Select } from '../components/ui/Field'
import { EmptyState, InlineError } from '../components/ui/States'
import { useToast } from '../components/ui/useToast'
import { cn, formatDate, initials, personName } from '../lib/utils'

const ROLES = ['admin', 'doctor', 'patient', 'receptionist']

const BLANK = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  role: 'receptionist',
  password: '',
  password2: '',
}

const ROLE_HINT = {
  admin: 'Full control of the hospital, including user accounts.',
  receptionist: 'Registers patients, books appointments and raises bills.',
  doctor: 'Gets a schedule and can write prescriptions. Approved immediately.',
  patient: 'Can book visits and see their own record.',
}

/**
 * Account creation by an administrator. This is the only route by which
 * an admin or receptionist account can exist — public registration
 * refuses those roles — so the form offers all four.
 */
function AccountForm({ onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(BLANK)

  const { run, submitting, error, fieldErrors } = useMutation(usersApi.create)

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const mismatch =
    form.password2.length > 0 && form.password !== form.password2
      ? 'Passwords do not match.'
      : undefined

  async function handleSubmit(event) {
    event.preventDefault()
    if (mismatch) return
    try {
      const created = await run(form)
      toast.success(
        `${personName(created, created.username)} can now sign in as a ${ROLE_LABEL[
          created.role
        ].toLowerCase()}.`,
      )
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
      title="Add an account"
      description="Create a staff or patient account and set its role."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="account-form" loading={submitting}>
            Create account
          </Button>
        </>
      }
    >
      <form id="account-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            value={form.first_name}
            onChange={update('first_name')}
            error={fieldErrors.first_name}
            required
          />
          <Input
            label="Last name"
            value={form.last_name}
            onChange={update('last_name')}
            error={fieldErrors.last_name}
            required
          />
        </div>

        <Input
          label="Username"
          value={form.username}
          onChange={update('username')}
          error={fieldErrors.username}
          hint="Letters, digits and @/./+/-/_ only."
          autoComplete="off"
          required
        />

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={update('email')}
          error={fieldErrors.email}
          required
        />

        <Select
          label="Role"
          value={form.role}
          onChange={update('role')}
          error={fieldErrors.role}
          hint={ROLE_HINT[form.role]}
          required
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABEL[role]}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={update('password')}
            error={fieldErrors.password}
            hint="At least 8 characters, not all numbers."
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={form.password2}
            onChange={update('password2')}
            error={mismatch ?? fieldErrors.password2}
            autoComplete="new-password"
            required
          />
        </div>

        <p className="rounded-lg bg-ink-100 px-3.5 py-3 text-xs leading-relaxed text-ink-500">
          Accounts created here are approved straight away — you are vouching
          for them. Share the password with the person and ask them to change
          it after signing in.
        </p>

        <InlineError>{error}</InlineError>
      </form>
    </Modal>
  )
}

/**
 * Doctors who signed themselves up. Until an administrator approves one,
 * the account cannot sign in at all — a self-declared doctor would
 * otherwise get straight into every patient record.
 */
function PendingApprovals({ accounts, onApprove, onReject, busyId }) {
  if (accounts.length === 0) return null

  return (
    <Card className="overflow-hidden ring-amber-200">
      <CardHeader
        icon={ShieldCheck}
        title={`${accounts.length} account${accounts.length === 1 ? '' : 's'} awaiting approval`}
        description="Self-registered doctors cannot sign in until you approve them."
      />
      <ul className="divide-y divide-ink-100">
        {accounts.map((account) => {
          const name = personName(account, account.username)
          return (
            <li
              key={account.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">
                {initials(name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {name}
                  <span className="ml-2 text-xs font-medium text-ink-400">
                    @{account.username}
                  </span>
                </p>
                <p className="truncate text-xs text-ink-500">
                  {account.email || 'No email'} · applied{' '}
                  {formatDate(account.date_joined)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  icon={Check}
                  loading={busyId === account.id}
                  onClick={() => onApprove(account)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={X}
                  onClick={() => onReject(account)}
                >
                  Reject
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const debouncedSearch = useDebounced(search)

  const { data, loading, error, reload } = useFetch(
    (signal) =>
      usersApi.list({ search: debouncedSearch, role: roleFilter }, { signal }),
    [debouncedSearch, roleFilter],
  )

  const accounts = toList(data)
  const pending = useMemo(
    () => accounts.filter((account) => !account.is_approved),
    [accounts],
  )

  const counts = useMemo(() => {
    const tally = Object.fromEntries(ROLES.map((role) => [role, 0]))
    for (const account of accounts) {
      if (account.role in tally) tally[account.role] += 1
    }
    return tally
  }, [accounts])

  const { run: runDelete, submitting: removing } = useMutation((id) =>
    usersApi.remove(id),
  )

  async function changeRole(account, role) {
    setBusyId(account.id)
    try {
      await usersApi.update(account.id, { role })
      toast.success(
        `${personName(account, account.username)} is now a ${ROLE_LABEL[role].toLowerCase()}.`,
      )
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function setApproval(account, approved) {
    setBusyId(account.id)
    try {
      await (approved ? usersApi.approve(account.id) : usersApi.revoke(account.id))
      const name = personName(account, account.username)
      toast.success(
        approved ? `${name} can now sign in.` : `${name}'s access has been withdrawn.`,
      )
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
      toast.success('Account deleted.')
      setDeleting(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="User accounts"
        description="Create staff accounts, grant roles, and approve doctors who signed themselves up."
        actions={
          <Button icon={UserPlus} onClick={() => setFormOpen(true)}>
            Add account
          </Button>
        }
      />

      <PendingApprovals
        accounts={pending}
        busyId={busyId}
        onApprove={(account) => setApproval(account, true)}
        onReject={(account) => setDeleting(account)}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {ROLES.map((role) => (
          <Card key={role} className="p-4">
            <p className="text-lg font-bold text-ink-900 tabular-nums">
              {counts[role]}
            </p>
            <span
              className={cn(
                'mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                ROLE_BADGE[role],
              )}
            >
              {ROLE_LABEL[role]}
            </span>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          icon={UserCog}
          title={`${accounts.length} account${accounts.length === 1 ? '' : 's'}`}
          description="Search by name, username or email."
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
              placeholder="Search accounts…"
              aria-label="Search accounts"
              className="w-full rounded-lg bg-white py-2 pr-3 pl-9 text-sm ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter by role"
            className="cursor-pointer rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">All roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </select>
        </FilterBar>

        <DataTable
          rows={accounts}
          loading={loading}
          error={error}
          onRetry={reload}
          caption="User accounts"
          columns={[
            {
              key: 'name',
              header: 'Account',
              primary: true,
              render: (row) => {
                const name = personName(row, row.username)
                const isSelf = row.id === currentUser?.id
                return (
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-200 text-[11px] font-bold text-ink-600">
                      {initials(name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">
                        {name}
                        {isSelf && (
                          <span className="ml-1.5 text-xs font-medium text-brand-600">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-ink-400">@{row.username}</p>
                    </div>
                  </div>
                )
              },
            },
            {
              key: 'email',
              header: 'Email',
              render: (row) => row.email || <span className="text-ink-400">—</span>,
            },
            {
              key: 'role',
              header: 'Role',
              render: (row) => {
                // Changing your own role could lock you out of this page.
                const isSelf = row.id === currentUser?.id
                return isSelf ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                      ROLE_BADGE[row.role],
                    )}
                  >
                    <ShieldCheck size={12} aria-hidden="true" />
                    {ROLE_LABEL[row.role]}
                  </span>
                ) : (
                  <select
                    value={row.role}
                    disabled={busyId === row.id}
                    onChange={(event) => changeRole(row, event.target.value)}
                    aria-label={`Role for ${row.username}`}
                    className="cursor-pointer rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:opacity-60"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </option>
                    ))}
                  </select>
                )
              },
            },
            {
              key: 'is_approved',
              header: 'Access',
              render: (row) =>
                row.is_approved ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Badge tone="warning">Pending</Badge>
                ),
            },
            {
              key: 'date_joined',
              header: 'Joined',
              render: (row) => (
                <span className="whitespace-nowrap text-ink-600">
                  {formatDate(row.date_joined)}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (row) =>
                row.id === currentUser?.id ? (
                  <span className="text-xs text-ink-400">—</span>
                ) : (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant={row.is_approved ? 'secondary' : 'subtle'}
                      loading={busyId === row.id}
                      onClick={() => setApproval(row, !row.is_approved)}
                    >
                      {row.is_approved ? 'Suspend' : 'Approve'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${row.username}`}
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
              icon={UserCog}
              title="No accounts found"
              description="Try a different search or role filter."
            />
          }
        />
      </Card>

      {formOpen && (
        <AccountForm onClose={() => setFormOpen(false)} onSaved={reload} />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={removing}
        title="Delete this account?"
        description={`@${deleting?.username} and everything attached to it — doctor or patient record, appointments, prescriptions and bills — will be permanently deleted.`}
        confirmLabel="Delete account"
      />
    </div>
  )
}
