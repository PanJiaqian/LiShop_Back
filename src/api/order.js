import { api } from './admin'

export const listAdminOrdersDetail = (params) => {
  return api.get('/admin/orders/detail', { params }).then(res => res.data)
}

export const updateOrderStatus = (formData) => {
  return api.post('/admin/orders/status', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const updateTrackingNumber = (formData) => {
  return api.post('/admin/orders/change_id', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}
