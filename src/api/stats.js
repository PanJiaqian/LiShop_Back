import { api } from './admin'

export const getOrderStats = (params) => {
  return api.get('/admin/orders/stats', { params }).then(res => res.data)
}

export const getAvailableProductSalesStats = (params) => {
  return api.get('/admin/available_products/sales_stats', { params }).then(res => res.data)
}

export const getProductSalesStats = (params) => {
  return api.get('/admin/products/sales_stats', { params }).then(res => res.data)
}
