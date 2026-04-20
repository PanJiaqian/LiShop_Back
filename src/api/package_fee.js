import { api } from './admin'

export const createPackageFee = (data) => {
  return api.post('/admin/package-fees', data).then(res => res.data)
}

export const updatePackageFee = (data) => {
  return api.put('/admin/package-fees', data).then(res => res.data)
}

export const deletePackageFee = (id) => {
  return api.delete(`/admin/package-fees/${id}`).then(res => res.data)
}

export const listPackageFees = (params) => {
  return api.get('/admin/package-fees', { params }).then(res => res.data)
}

export const listPackageFeeOptions = () => {
  return api.get('/admin/package-fees/options').then(res => res.data)
}
