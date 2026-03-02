/*
 * 模块: 订单管理接口
 * 作用: 提供管理端订单详情、导出、发货/状态更新、异常物流与订阅重试等请求封装
 */
import { api } from './admin'

/**
 * 获取订单详情列表
 */
export const listAdminOrdersDetail = (params) => {
  return api.get('/admin/orders/detail', { params }).then(res => res.data)
}

/**
 * 导出订单明细（返回 blob 用于下载）
 */
export const exportOrderDetails = (params, config = {}) => {
  return api.get('/admin/orders/export_details', { params, responseType: 'blob', ...config })
    .then(res => res.data)
}

/**
 * 更新订单状态（multipart/form-data）
 */
export const updateOrderStatus = (formData) => {
  return api.post('/admin/orders/status', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

/**
 * 更新物流单号/追踪号（multipart/form-data）
 */
export const updateTrackingNumber = (formData) => {
  return api.post('/admin/orders/change_id', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

/**
 * 获取异常物流订单列表
 */
export const listAbnormalOrders = (params) => {
  return api.get('/admin/orders/logistics_abnormal', { params }).then(res => res.data)
}

/**
 * 物流订阅重试（multipart/form-data）
 */
export const subscribeRetry = (formData) => {
  return api.post('/admin/orders/subscribe_retry', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}
