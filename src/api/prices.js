/*
 * 模块: 定价策略接口
 * 作用: 提供管理端定价策略的创建、更新、重置、列表与删除请求封装
 */
import { api } from './admin'

/**
 * 创建定价策略
 */
export const createPriceStrategy = (data) => {
  return api.post('/admin/products/prices', data)
    .then(res => res.data)
}

/**
 * 更新定价策略
 */
export const updatePriceStrategy = (data) => {
  return api.post('/admin/prices/update', data)
    .then(res => res.data)
}

/**
 * 重置定价策略
 */
export const resetPriceStrategy = (data) => {
  return api.post('/admin/prices/reset', data)
    .then(res => res.data)
}

/**
 * 获取定价策略列表
 */
export const listPriceStrategies = (params) => {
  return api.get('/admin/products/prices/get', { params })
    .then(res => res.data)
}

/**
 * 删除定价策略（multipart/form-data）
 */
export const deletePriceStrategy = (formData) => {
  return api.post('/admin/prices/delete', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}
