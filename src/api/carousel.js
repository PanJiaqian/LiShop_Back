import { api } from './admin'

export const createCarousel = (formData) => {
  return api.post('/admin/carousel/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}

export const updateCarouselStatus = (payload) => {
  let fd = payload instanceof FormData ? payload : null
  if (!fd) {
    fd = new FormData()
    const obj = payload || {}
    Object.keys(obj).forEach(k => {
      if (obj[k] !== undefined && obj[k] !== null) fd.append(k, String(obj[k]))
    })
  }
  return api.post('/admin/carousel/update_status', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}

export const listCarousel = (params) => {
  return api.get('/admin/carousel/list', { params }).then(res => res.data)
}

export const deleteCarousel = (formData) => {
  return api.post('/admin/carousel/delete', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}
