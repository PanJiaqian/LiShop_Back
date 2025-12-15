import { api } from './admin'

export const createAnnouncement = (data) => {
  return api.post('/admin/announcements', data)
    .then(res => res.data)
}

export const updateAnnouncement = (data) => {
  return api.post('/admin/announcements/update', data)
    .then(res => res.data)
}

export const updateAnnouncementStatus = (data) => {
  return api.post('/admin/announcements/status', data)
    .then(res => res.data)
}

export const listAnnouncements = (params) => {
  return api.get('/admin/announcements', { params })
    .then(res => res.data)
}

export const deleteAnnouncement = (formData) => {
  return api.post('/admin/announcements/delete', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}
