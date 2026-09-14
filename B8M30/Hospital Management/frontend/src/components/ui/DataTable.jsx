import { cn } from '../../lib/utils'
import { EmptyState, ErrorState, SkeletonRows } from './States'

/**
 * One table definition, two presentations:
 *   - a real <table> from `md` up
 *   - a stacked card per row below `md`, because a 7-column table on a
 *     phone is either unreadable or a horizontal-scroll maze.
 *
 * Columns: { key, header, render?, align?, cellClass?, headerClass?,
 *            primary?  -> used as the card title on mobile
 *            hideOnCard? -> skip in the mobile card }
 */
export default function DataTable({
  columns,
  rows,
  keyField = 'id',
  loading = false,
  error = null,
  onRetry,
  empty,
  caption,
  className,
}) {
  if (loading) return <SkeletonRows rows={5} />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (!rows?.length) return empty ?? <EmptyState />

  const primary = columns.find((column) => column.primary) ?? columns[0]
  const secondary = columns.filter(
    (column) => column !== primary && !column.hideOnCard,
  )

  const cellValue = (column, row) =>
    column.render ? column.render(row) : (row[column.key] ?? '—')

  return (
    <div className={className}>
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50/70">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-xs font-semibold tracking-wide text-ink-500 uppercase whitespace-nowrap',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                    column.headerClass,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => (
              <tr
                key={row[keyField]}
                className="transition-colors hover:bg-brand-50/40"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 align-middle text-ink-700',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      column.cellClass,
                    )}
                  >
                    {cellValue(column, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone */}
      <ul className="divide-y divide-ink-100 md:hidden">
        {rows.map((row) => (
          <li key={row[keyField]} className="px-4 py-3.5">
            <div className="mb-2 text-sm font-semibold text-ink-900">
              {cellValue(primary, row)}
            </div>
            <dl className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-1.5">
              {secondary.map((column) => (
                <div key={column.key} className="contents">
                  <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">
                    {column.header}
                  </dt>
                  <dd className="min-w-0 text-sm text-ink-700">
                    {cellValue(column, row)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}
