import { api } from './admin'

export const listAdminOrdersDetail = (params) => {
  return api.get('/admin/orders/detail', { params }).then(res => res.data)
}

export const exportOrderDetails = (params, config = {}) => {
  return api.get('/admin/orders/export_details', { params, responseType: 'blob', ...config })
    .then(res => res.data)
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

export const listAbnormalOrders = (params) => {
  return api.get('/admin/orders/logistics_abnormal', { params }).then(res => res.data)
}

export const subscribeRetry = (formData) => {
  return api.post('/admin/orders/subscribe_retry', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}
