/**
 * Every API route the app talks to, in one place, so a backend URL change
 * is a one-line edit rather than a hunt through the pages.
 */
import { api } from './client'

export const auth = {
  login: (credentials) => api.post('/token/', credentials, { auth: false }),
  register: (payload) => api.post('/users/register/', payload, { auth: false }),
  me: (options) => api.get('/users/me/', options),
  // Role and username are read-only server-side, so this only ever edits
  // the user's own name and email.
  updateMe: (payload) => api.patch('/users/me/', payload),
}

export const users = {
  list: (params, options) => api.get('/users/', { ...options, params }),
  // Admin-only. The only route by which an admin or receptionist account
  // can be created — public registration refuses those roles.
  create: (payload) => api.post('/users/', payload),
  update: (id, payload) => api.patch(`/users/${id}/`, payload),
  approve: (id) => api.patch(`/users/${id}/approve/`),
  revoke: (id) => api.patch(`/users/${id}/revoke/`),
  remove: (id) => api.del(`/users/${id}/`),
}

export const departments = {
  list: (params, options) => api.get('/departments/', { ...options, params }),
  create: (payload) => api.post('/departments/', payload),
  update: (id, payload) => api.patch(`/departments/${id}/`, payload),
  remove: (id) => api.del(`/departments/${id}/`),
}

export const doctors = {
  list: (params, options) => api.get('/doctors/', { ...options, params }),
  create: (payload) => api.post('/doctors/', payload),
  update: (id, payload) => api.patch(`/doctors/${id}/`, payload),
  remove: (id) => api.del(`/doctors/${id}/`),
}

export const patients = {
  list: (params, options) => api.get('/patients/', { ...options, params }),
  create: (payload) => api.post('/patients/', payload),
  update: (id, payload) => api.patch(`/patients/${id}/`, payload),
  remove: (id) => api.del(`/patients/${id}/`),
}

export const appointments = {
  list: (params, options) => api.get('/appointments/', { ...options, params }),
  create: (payload) => api.post('/appointments/', payload),
  update: (id, payload) => api.patch(`/appointments/${id}/`, payload),
  cancel: (id) => api.patch(`/appointments/${id}/cancel/`),
  approve: (id) => api.patch(`/appointments/${id}/approve/`),
  remove: (id) => api.del(`/appointments/${id}/`),
}

export const prescriptions = {
  list: (params, options) => api.get('/prescriptions/', { ...options, params }),
  create: (payload) => api.post('/prescriptions/', payload),
  update: (id, payload) => api.patch(`/prescriptions/${id}/`, payload),
  remove: (id) => api.del(`/prescriptions/${id}/`),
}

export const medicines = {
  list: (params, options) => api.get('/medicines/', { ...options, params }),
  create: (payload) => api.post('/medicines/', payload),
  update: (id, payload) => api.patch(`/medicines/${id}/`, payload),
  remove: (id) => api.del(`/medicines/${id}/`),
}

export const bills = {
  list: (params, options) => api.get('/billing/', { ...options, params }),
  create: (payload) => api.post('/billing/', payload),
  update: (id, payload) => api.patch(`/billing/${id}/`, payload),
  markPaid: (id) => api.patch(`/billing/${id}/mark-paid/`),
  remove: (id) => api.del(`/billing/${id}/`),
}
