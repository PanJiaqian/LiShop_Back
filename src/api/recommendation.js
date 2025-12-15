import { api } from './admin'

export const createRecommendation = (payload) => {
  let fd = payload instanceof FormData ? payload : null
  if (!fd) {
    fd = new FormData()
    const obj = payload || {}
    Object.keys(obj).forEach(k => {
      if (obj[k] !== undefined && obj[k] !== null) fd.append(k, String(obj[k]))
    })
  }
  return api.post('/admin/recommendation/create', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}

export const updateRecommendationStatus = (payload) => {
  let fd = payload instanceof FormData ? payload : null
  if (!fd) {
    fd = new FormData()
    const obj = payload || {}
    Object.keys(obj).forEach(k => {
      if (obj[k] !== undefined && obj[k] !== null) fd.append(k, String(obj[k]))
    })
  }
  return api.post('/admin/recommendation/update_status', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}

export const listRecommendations = (params) => {
  return api.get('/admin/recommendation/list', { params }).then(res => res.data)
}

export const deleteRecommendation = (formData) => {
  return api.post('/admin/recommendation/delete', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}
