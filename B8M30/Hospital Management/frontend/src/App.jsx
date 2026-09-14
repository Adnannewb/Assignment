import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import { rolesFor } from './auth/roles'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Doctors from './pages/Doctors'
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import Prescriptions from './pages/Prescriptions'
import Medicines from './pages/Medicines'
import Billing from './pages/Billing'
import Departments from './pages/Departments'
import Users from './pages/Users'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

/**
 * Each protected page declares the roles it accepts by looking them up in
 * the same table the sidebar is built from — so a link is never shown to a
 * role that would be turned away, and a hand-typed URL is still checked.
 */
const PAGES = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/appointments', element: <Appointments /> },
  { path: '/doctors', element: <Doctors /> },
  { path: '/patients', element: <Patients /> },
  { path: '/prescriptions', element: <Prescriptions /> },
  { path: '/medicines', element: <Medicines /> },
  { path: '/billing', element: <Billing /> },
  { path: '/departments', element: <Departments /> },
  { path: '/users', element: <Users /> },
  { path: '/profile', element: <Profile /> },
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {PAGES.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute allow={rolesFor(path)}>{element}</ProtectedRoute>
            }
          />
        ))}
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
