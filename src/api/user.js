import { api } from './admin'

export const listUsers = (params) => {
  return api.get('/admin/users', { params })
    .then(res => res.data)
}

export const createUser = (data) => {
  return api.post('/admin/users', data)
    .then(res => res.data)
}

export const updateUser = (data) => {
  return api.post('/admin/users/update', data)
    .then(res => res.data)
}

export const updateUserStatus = (data) => {
  return api.post('/admin/users/status', data)
    .then(res => res.data)
}

export const importUsersExcel = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/admin/users/import_excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const deleteUser = (formData) => {
  return api.post('/admin/users/delete', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const updateUserAvatar = (formData, config = {}) => {
  return api.post('/admin/users/update/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}
