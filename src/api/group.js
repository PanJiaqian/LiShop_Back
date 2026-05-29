import { api } from './admin'

export const listGroups = (params) => {
  return api.get('/admin/groups', { params }).then(res => res.data)
}

export const createGroup = (data) => {
  return api.post('/admin/groups', data).then(res => res.data)
}

export const updateGroup = (data) => {
  return api.post('/admin/groups/update', data).then(res => res.data)
}

export const deleteGroup = (data) => {
  return api.post('/admin/groups/delete', data).then(res => res.data)
}

export const getGroupBindings = (params) => {
  return api.get('/admin/groups/bindings', { params }).then(res => res.data)
}

export const getGroupActiveUsers = (params) => {
  return api.get('/admin/groups/active_users', { params }).then(res => res.data)
}
