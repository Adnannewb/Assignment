# MediCore — Hospital Management System

A role-based hospital management system. A Django REST Framework API holds
the data and enforces who may see what; a React single-page app consumes it
and gives each role its own workspace.

One patient record is shared across the hospital, and the same record looks
different depending on who opens it: a receptionist books against it, a
doctor prescribes on it, the patient reads it, and an administrator sees
everything.

---

## What it does

Eight modules, each backed by its own Django app and its own page in the UI.

| Module            | What it holds                                                            |
| ----------------- | ------------------------------------------------------------------------ |
| **Users**         | Accounts and roles. Where staff accounts are created and doctors approved |
| **Departments**   | Clinical units — Cardiology, Paediatrics, and so on                       |
| **Doctors**       | Practice details, department, specialisation, and an availability switch  |
| **Patients**      | Medical record: age, gender, blood group, address, contact               |
| **Appointments**  | Bookings between a patient and a doctor, with an approval workflow        |
| **Prescriptions** | A diagnosis plus any number of medicines, attached to one appointment     |
| **Medicines**     | The hospital formulary — everything a doctor is able to prescribe         |
| **Billing**       | Invoices raised against a patient, marked paid once settled               |

### How the pieces connect

```
User ──┬── Doctor ────┐
       │              ├── Appointment ── Prescription ── PrescriptionMedicine ── Medicine
       └── Patient ───┘         │
                                └── Bill
Department ── Doctor
```

A `User` is the login. A **Doctor** or **Patient** profile hangs off it and
carries the clinical detail — so someone can have an account before they
have a medical record, and an administrator controls when the two are
linked. Appointments join a doctor to a patient; a prescription belongs to
exactly one appointment; bills are raised straight against a patient.

### Appointment lifecycle

```
pending ──▶ approved ──▶ completed
   │            │
   └──────┬─────┘
          ▼
      cancelled
```

A patient books (`pending`). The assigned doctor or an admin approves it —
never the patient themselves. Once seen, the doctor writes the prescription
against that appointment and marks it `completed`. Anyone involved may
cancel; the record stays in the history rather than disappearing.

---

## Roles

Roles live on the user account, not on the login form. Signing in routes you
to the pages your role can reach; typing the URL of a page you can't access
shows a "this page isn't yours" notice rather than the page.

| Page          | Admin | Doctor | Receptionist | Patient |
| ------------- | :---: | :----: | :----------: | :-----: |
| Dashboard     |   ●   |   ●    |      ●       |    ●    |
| Appointments  |   ●   |   ●    |      ●       |    ●    |
| Doctors       |   ●   |   ●    |      ●       |    ●    |
| Patients      |   ●   |   ●    |      ●       |         |
| Prescriptions |   ●   |   ●    |              |    ●    |
| Medicines     |   ●   |   ●    |      ●       |    ●    |
| Billing       |   ●   |        |      ●       |    ●    |
| Departments   |   ●   |        |              |         |
| User accounts |   ●   |        |              |         |
| My profile    |   ●   |   ●    |      ●       |    ●    |

Access is narrowed again inside each page. A doctor sees only their own
appointments and the prescriptions they wrote. A patient sees only their own
record, their own visits and their own bills. None of that relies on the UI
hiding things — every list is filtered server-side, so a hand-made API call
returns the same restricted set.

### Accounts and approval

Three ways an account comes into existence, and they are deliberately not
equivalent:

**1. Anyone can register as a patient.** They are signed in immediately.
A patient can only ever reach their own record, so there is nothing to vet.

**2. Anyone can register as a doctor — but the account is held.** It is
created with `is_approved = false` and **cannot sign in at all** until an
administrator approves it. A self-declared doctor would otherwise walk
straight into every patient record in the hospital. The pending queue
appears at the top of the administrator's dashboard and on the **User
accounts** page, with Approve and Reject beside each request.

**3. Administrators create staff accounts directly.** Admin and
receptionist accounts exist *only* this way — the public registration
endpoint rejects those roles outright, so nobody can self-promote by posting
`role: "admin"`. Use **User accounts → Add account**; anything created there
is approved on the spot, because an admin vouched for it.

Approval can also be withdrawn. Suspending an account blocks new logins
*and* refuses to renew the token of a session already open, so access stops
within the life of one access token rather than at the end of the week.

Roles are read-only on `PATCH /api/users/me/`, so no one can approve or
promote themselves by editing their own profile.

---

## Built with

**Backend** — Django 6.1, Django REST Framework, SimpleJWT for tokens,
django-filter for query filtering, PostgreSQL.

**Frontend** — React 19, Vite, React Router 7, Tailwind CSS 4,
lucide-react icons. API calls use `fetch` through a small wrapper that
attaches the token, refreshes it on a 401 and replays the request, and turns
DRF error bodies into per-field form errors.

```
Hospital Management/
├── backend/        Django + DRF API
│   ├── users/         accounts, roles, approval, JWT
│   ├── doctors/  patients/  departments/
│   ├── appointments/  prescriptions/  medicines/  billings/
│   └── hospital_management/   settings and root URLs
├── frontend/       React + Vite single-page app
│   └── src/
│       ├── api/          fetch wrapper and endpoint map
│       ├── auth/         auth context, roles, route table
│       ├── components/   layout and the shared UI kit
│       ├── hooks/        useFetch / useMutation
│       └── pages/        one file per screen
└── venv/           Python virtual environment (shared, at the repo root)
```

---

## Running the project

You need **Python 3.12+**, **PostgreSQL** (running, with an empty database
created) and **Node.js 20+**. The backend and the frontend run as two
processes, so use two terminals.

### 1. Backend

```bash
cd backend
../venv/Scripts/activate      # Windows;  source ../venv/bin/activate on macOS/Linux
pip install -r requirements.txt

cp .env.example .env          # then fill in SECRET_KEY and the DB credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API is now on `http://127.0.0.1:8000/`.

A superuser gets `role="patient"` by default. Promote it once:

```bash
python manage.py shell -c "from users.models import User; User.objects.filter(is_superuser=True).update(role='admin')"
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL, defaults to http://127.0.0.1:8000/api
npm run dev
```

Open `http://localhost:5173/`.

The port is pinned (`strictPort`), so if something already holds 5173 the
dev server stops with an error instead of quietly starting on 5174 — that
way you can't end up editing one server while looking at another. Free the
port, or change it in `vite.config.js`.

### 3. Demo data (optional, recommended)

To see every screen populated rather than empty:

```bash
cd backend
python manage.py seed_demo           # safe to re-run — it won't duplicate
python manage.py seed_demo --reset   # wipe the demo data and recreate it
python manage.py seed_demo --clear   # remove it and stop
```

That creates 6 departments, 18 medicines, 7 doctors (one deliberately off
duty), 12 patients, 2 receptionists, **2 doctors awaiting approval**, 25
appointments spread over the past three weeks and the next two covering all
four statuses, 9 prescriptions with several medicines each, and 15 bills
split between paid and unpaid.

Every demo account uses the password **`Demo@12345`**:

| Role         | Username                             |
| ------------ | ------------------------------------ |
| Admin        | `demo.admin`                         |
| Doctor       | `demo.doctor1` … `demo.doctor7`      |
| Receptionist | `demo.reception1`, `demo.reception2` |
| Patient      | `demo.patient1` … `demo.patient12`   |
| *Pending*    | `demo.pending1`, `demo.pending2` — **cannot sign in until approved** |

Demo rows are tagged by the `demo.` username prefix, so `--clear` removes
exactly what was seeded and leaves your own records alone. These are
throwaway accounts with a password published in this file — clear them
before the database goes anywhere near production.

### Setting up without demo data

1. Sign in as your promoted superuser.
2. **Departments** → add the clinical units.
3. **User accounts → Add account** → create your receptionists and any other
   admins. Approve any doctors who have registered themselves.
4. **Doctors** / **Patients** → create the profile records that link those
   accounts to the hospital. A patient can't book until they have one.
5. **Medicines** → stock the formulary so doctors have something to
   prescribe.

---

## Worth trying

- **`demo.admin`** — the pending-approval banner is on the dashboard.
  Approve a doctor, then add a receptionist from **User accounts**.
- **`demo.pending1`** — try signing in. You'll be told the account is
  waiting for approval.
- **`demo.doctor1`** — sees only her own appointments. Approve a pending
  one, then write a prescription against it with several medicines.
- **`demo.reception1`** — register a patient, then generate a bill and mark
  it paid.
- **`demo.patient1`** — sees only his own record. Book a visit, and note
  that off-duty doctors don't appear in the list.

`demo.admin` is also a Django staff user, so the same login works at
`http://127.0.0.1:8000/admin/`.

---

## API

Everything is under `/api/` and needs a JWT (`Authorization: Bearer …`)
except registration and token issuance.

| Endpoint                                  | Notes                                                        |
| ----------------------------------------- | ------------------------------------------------------------ |
| `POST /api/token/`                        | Sign in; returns `access`, `refresh` and the user. 401 if unapproved |
| `POST /api/token/refresh/`                | Rotate the access token; also re-checks approval              |
| `POST /api/users/register/`               | Self-registration — doctor or patient only                    |
| `GET/PATCH /api/users/me/`                | The signed-in user; `role` and `is_approved` are read-only    |
| `GET/POST /api/users/`                    | Admin creates accounts of any role. `?role=` `?is_approved=`  |
| `PATCH /api/users/{id}/approve/`          | Let a pending account sign in (admin)                         |
| `PATCH /api/users/{id}/revoke/`           | Withdraw access (admin)                                       |
| `/api/departments/`                       | Admin writes, everyone reads                                  |
| `/api/doctors/`                           | `?search=` `?department=` `?is_available=`                    |
| `/api/patients/`                          | Patients see only themselves                                  |
| `/api/appointments/`                      | `?doctor=` `?patient=` `?status=` `?appointment_date__date=`  |
| `PATCH /api/appointments/{id}/approve/`   | Admin or the assigned doctor                                  |
| `PATCH /api/appointments/{id}/cancel/`    |                                                               |
| `/api/prescriptions/`                     | Nested `prescription_medicines` on create                     |
| `/api/medicines/`                         | `?search=`; admin writes                                      |
| `/api/billing/`                           | Admin/receptionist create                                     |
| `PATCH /api/billing/{id}/mark-paid/`      |                                                               |

---

## Checks

```bash
cd frontend
npm run lint          # ESLint 9 (flat config) with the React, hooks and refresh plugins
npm run lint:fix      # the same, applying autofixes
npm run build         # production build
npm run check:render  # mounts every page for every role, plus the create forms
```

`check:render` renders the whole app in jsdom against a stubbed API and
fails on any React error or warning — it catches runtime breakage that a
successful build does not.

```bash
cd backend
python manage.py check
```

The Django apps ship with empty `tests.py` stubs — there is no automated
backend test suite yet.

---

## Troubleshooting

**"Couldn't reach the API…" in the UI.** The browser reports a blocked
cross-origin request and a dead server identically. Check that
`python manage.py runserver` is up on port 8000, that `VITE_API_URL` in
`frontend/.env` points at it, and that the page's origin is allowed by CORS.
The browser console shows which of the two it actually was.

While `DEBUG=True` the backend accepts any `localhost` / `127.0.0.1` port,
so moving the dev server won't break API calls. For anything else — a LAN
address, a deployed frontend — list the origin in `CORS_ALLOWED_ORIGINS` in
`backend/.env` as a comma-separated list.

**"Port 5173 is already in use."** A previous dev server is still running.
On Windows:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**A doctor can't sign in.** Their account is probably still pending. Sign in
as an administrator and approve it under **User accounts**.
