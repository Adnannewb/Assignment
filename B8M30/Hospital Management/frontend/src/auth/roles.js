import {
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Pill,
  Receipt,
  Stethoscope,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react'

export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  RECEPTIONIST: 'receptionist',
}

export const ROLE_LABEL = {
  admin: 'Administrator',
  doctor: 'Doctor',
  patient: 'Patient',
  receptionist: 'Receptionist',
}

export const ROLE_BADGE = {
  admin: 'bg-violet-100 text-violet-700 ring-violet-200',
  doctor: 'bg-brand-100 text-brand-700 ring-brand-200',
  patient: 'bg-sky-100 text-sky-700 ring-sky-200',
  receptionist: 'bg-amber-100 text-amber-700 ring-amber-200',
}

const ALL = ['admin', 'doctor', 'patient', 'receptionist']

/**
 * The single source of truth for route access. `ProtectedRoute` reads it,
 * and the sidebar is built from it, so a role can never see a link to a
 * page it would be bounced out of.
 */
export const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ALL,
  },
  {
    to: '/appointments',
    label: 'Appointments',
    icon: CalendarDays,
    roles: ALL,
  },
  {
    to: '/doctors',
    label: 'Doctors',
    icon: Stethoscope,
    roles: ALL,
  },
  {
    to: '/patients',
    label: 'Patients',
    icon: Users,
    roles: ['admin', 'doctor', 'receptionist'],
  },
  {
    to: '/prescriptions',
    label: 'Prescriptions',
    icon: FileText,
    roles: ['admin', 'doctor', 'patient'],
  },
  {
    to: '/medicines',
    label: 'Medicines',
    icon: Pill,
    roles: ALL,
  },
  {
    to: '/billing',
    label: 'Billing',
    icon: Receipt,
    roles: ['admin', 'receptionist', 'patient'],
  },
  {
    to: '/departments',
    label: 'Departments',
    icon: Building2,
    roles: ['admin'],
  },
  {
    to: '/users',
    label: 'User accounts',
    icon: UserCog,
    roles: ['admin'],
  },
  {
    to: '/profile',
    label: 'My profile',
    icon: UserRound,
    roles: ALL,
  },
]

/** Roles allowed on a given path, derived from the nav table. */
export function rolesFor(path) {
  return NAV_ITEMS.find((item) => item.to === path)?.roles ?? ALL
}

export function navFor(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
