import { api } from './admin'

export const createPriceStrategy = (data) => {
  return api.post('/admin/products/prices', data)
    .then(res => res.data)
}

export const updatePriceStrategy = (data) => {
  return api.post('/admin/prices/update', data)
    .then(res => res.data)
}

export const resetPriceStrategy = (data) => {
  return api.post('/admin/prices/reset', data)
    .then(res => res.data)
}

export const listPriceStrategies = (params) => {
  return api.get('/admin/products/prices/get', { params })
    .then(res => res.data)
}

export const deletePriceStrategy = (formData) => {
  return api.post('/admin/prices/delete', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}

