/*
 * 模块: 数据统计接口
 * 作用: 提供管理端订单与销量等统计类请求封装，用于看板/报表展示
 */
import { api } from './admin'

/**
 * 获取订单统计数据
 */
export const getOrderStats = (params) => {
  return api.get('/admin/orders/stats', { params }).then(res => res.data)
}

/**
 * 获取可售商品销量统计数据
 */
export const getAvailableProductSalesStats = (params) => {
  return api.get('/admin/available_products/sales_stats', { params }).then(res => res.data)
}

/**
 * 获取商品销量统计数据
 */
export const getProductSalesStats = (params) => {
  return api.get('/admin/products/sales_stats', { params }).then(res => res.data)
}
