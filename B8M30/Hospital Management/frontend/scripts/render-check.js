/**
 * Mounts every page, once per role, against a stubbed API and fails on any
 * React error, unhandled rejection, or console error. Catches the runtime
 * breakage that a successful build cannot.
 *
 * Run with: npm run check:render
 */
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
})

globalThis.window = dom.window
globalThis.document = dom.window.document
// Node 22 defines `navigator` as a getter-only global, so it has to be
// redefined rather than assigned.
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
})
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Node = dom.window.Node
globalThis.Event = dom.window.Event
globalThis.MouseEvent = dom.window.MouseEvent
globalThis.KeyboardEvent = dom.window.KeyboardEvent
globalThis.localStorage = dom.window.localStorage
globalThis.getComputedStyle = dom.window.getComputedStyle
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const ROLES = ['admin', 'doctor', 'patient', 'receptionist']

const ROUTES = [
  '/dashboard',
  '/appointments',
  '/doctors',
  '/patients',
  '/prescriptions',
  '/medicines',
  '/billing',
  '/departments',
  '/users',
  '/profile',
  '/login',
  '/register',
  '/nope',
]

/** Canned payloads shaped exactly like the DRF serializers. */
const user = (id, role) => ({
  id,
  username: `${role}${id}`,
  email: `${role}@example.com`,
  first_name: 'Test',
  last_name: role,
  role,
  date_joined: '2026-01-01T09:00:00Z',
})

const FIXTURES = {
  '/users/me/': { ...user(1, 'admin'), doctor_id: 1, patient_id: 1 },
  '/users/': [user(1, 'admin'), user(2, 'doctor'), user(3, 'patient')],
  '/departments/': [{ id: 1, name: 'Cardiology', description: 'Heart' }],
  '/doctors/': [
    {
      id: 1,
      user: 2,
      user_detail: user(2, 'doctor'),
      department: 1,
      specialization: 'Cardiology',
      phone: '01700000000',
      experience: 5,
      is_available: true,
    },
  ],
  '/patients/': [
    {
      id: 1,
      user: 3,
      user_detail: user(3, 'patient'),
      age: 30,
      gender: 'male',
      blood_group: 'O+',
      address: '1 Road',
      phone: '01800000000',
    },
  ],
  '/appointments/': [
    {
      id: 1,
      patient: 1,
      patient_name: 'Test patient',
      doctor: 1,
      doctor_name: 'Test doctor',
      appointment_date: '2030-01-01T09:00:00Z',
      status: 'pending',
      created_at: '2026-01-01T09:00:00Z',
    },
  ],
  '/prescriptions/': [
    {
      id: 1,
      appointment: 1,
      diagnosis: 'Test',
      notes: 'Rest',
      created_at: '2026-01-01T09:00:00Z',
      prescription_medicines: [
        { id: 1, medicine: 1, medicine_name: 'SmokeMed', dosage: '1+0+1', duration: '7 days' },
      ],
    },
  ],
  '/medicines/': [{ id: 1, name: 'SmokeMed', unit: '500 mg', description: 'Test' }],
  '/billing/': [
    {
      id: 1,
      patient: 1,
      patient_name: 'Test patient',
      amount: '1500.00',
      paid: false,
      created_at: '2026-01-01T09:00:00Z',
    },
  ],
}

let currentRole = 'admin'

globalThis.fetch = async (url) => {
  const path = new URL(url).pathname.replace(/^\/api/, '')
  let body = FIXTURES[path]
  if (path === '/users/me/') {
    body = { ...FIXTURES['/users/me/'], ...user(1, currentRole), doctor_id: 1, patient_id: 1 }
  }
  if (body === undefined) body = []
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  }
}

// Collect anything React or the pages complain about.
const problems = []
const realConsoleError = console.error
console.error = (...args) => {
  problems.push(args.map(String).join(' '))
  realConsoleError(...args)
}
process.on('unhandledRejection', (err) => problems.push(`unhandledRejection: ${err}`))

const { StrictMode } = await import('react')
const { createRoot } = await import('react-dom/client')
const { act } = await import('react')
const { MemoryRouter } = await import('react-router-dom')
const { default: App } = await import('../src/App.jsx')
const { AuthProvider } = await import('../src/auth/AuthContext.jsx')
const { ToastProvider } = await import('../src/components/ui/Toast.jsx')
const { createElement: h } = await import('react')

let failures = 0

for (const role of ROLES) {
  currentRole = role
  for (const route of ROUTES) {
    const before = problems.length
    localStorage.setItem(
      'medicore.auth',
      JSON.stringify({ access: 'fake-access', refresh: 'fake-refresh' }),
    )

    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        root.render(
          h(
            StrictMode,
            null,
            h(
              MemoryRouter,
              { initialEntries: [route] },
              h(ToastProvider, null, h(AuthProvider, null, h(App, null))),
            ),
          ),
        )
      })
      // Let the data effects settle.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
      })
    } catch (err) {
      problems.push(`threw while rendering ${role} ${route}: ${err?.stack || err}`)
    }

    await act(async () => root.unmount())
    container.remove()

    const added = problems.slice(before)
    if (added.length) {
      failures += 1
      console.log(`  FAIL  ${role.padEnd(13)} ${route}`)
      for (const problem of added) console.log(`        ${problem.slice(0, 300)}`)
    } else {
      console.log(`  PASS  ${role.padEnd(13)} ${route}`)
    }
  }
}

console.log(
  `\n${ROLES.length * ROUTES.length - failures} rendered clean, ${failures} with problems\n`,
)

/* ------------------------------------------------------------------ *
 * Phase 2 — open each create form and drive the dynamic fields.
 * Modals never render on a plain page load, so they need their own pass.
 * ------------------------------------------------------------------ */

const byText = (root, text) =>
  [...root.querySelectorAll('button')].find((node) =>
    node.textContent.trim().toLowerCase().includes(text.toLowerCase()),
  )

const click = async (node) => {
  await act(async () => {
    node.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
  })
}

const FORMS = [
  { role: 'admin', route: '/doctors', open: 'Add doctor', form: 'doctor-form' },
  { role: 'receptionist', route: '/patients', open: 'Register patient', form: 'patient-form' },
  { role: 'patient', route: '/appointments', open: 'Book appointment', form: 'appointment-form' },
  { role: 'admin', route: '/medicines', open: 'Add medicine', form: 'medicine-form' },
  { role: 'admin', route: '/departments', open: 'New department', form: 'department-form' },
  { role: 'receptionist', route: '/billing', open: 'Generate bill', form: 'bill-form' },
  { role: 'doctor', route: '/prescriptions', open: 'New prescription', form: 'prescription-form' },
]

let formFailures = 0

for (const { role, route, open, form } of FORMS) {
  currentRole = role
  const before = problems.length
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  let note = ''
  try {
    await act(async () => {
      root.render(
        h(
          MemoryRouter,
          { initialEntries: [route] },
          h(ToastProvider, null, h(AuthProvider, null, h(App, null))),
        ),
      )
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })

    const trigger = byText(container, open)
    if (!trigger) throw new Error(`no "${open}" button on ${route} as ${role}`)
    await click(trigger)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })

    const formEl = document.getElementById(form)
    if (!formEl) throw new Error(`form #${form} did not open`)

    if (form === 'prescription-form') {
      // Dynamic medicine rows: add two, then remove one.
      const countRows = () =>
        formEl.querySelectorAll('[aria-label^="Remove medicine row"]').length
      const start = countRows()
      const add = byText(document.body, 'Add medicine')
      await click(add)
      await click(add)
      const grown = countRows()
      const removeButtons = [
        ...formEl.querySelectorAll('[aria-label^="Remove medicine row"]'),
      ]
      await click(removeButtons[removeButtons.length - 1])
      const shrunk = countRows()
      if (!(start === 1 && grown === 3 && shrunk === 2)) {
        throw new Error(`row counts wrong: start=${start} afterAdd=${grown} afterRemove=${shrunk}`)
      }
      note = ` (rows ${start} → ${grown} → ${shrunk})`
    }
  } catch (err) {
    problems.push(`${role} ${route}: ${err?.message || err}`)
  }

  await act(async () => root.unmount())
  container.remove()

  const added = problems.slice(before)
  if (added.length) {
    formFailures += 1
    console.log(`  FAIL  ${role.padEnd(13)} ${open}`)
    for (const problem of added) console.log(`        ${problem.slice(0, 300)}`)
  } else {
    console.log(`  PASS  ${role.padEnd(13)} ${open}${note}`)
  }
}

console.log(`\n${FORMS.length - formFailures} forms opened clean, ${formFailures} with problems`)
process.exit(failures + formFailures ? 1 : 0)
