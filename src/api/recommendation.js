/*
 * 模块: 推荐位管理接口
 * 作用: 提供管理端推荐内容的创建、上下架、列表与删除请求封装
 */
import { api } from './admin'

/**
 * 创建推荐内容（multipart/form-data）
 */
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

/**
 * 更新推荐内容状态（上架/下架等，multipart/form-data）
 */
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

/**
 * 获取推荐内容列表
 */
export const listRecommendations = (params) => {
  return api.get('/admin/recommendation/list', { params }).then(res => res.data)
}

/**
 * 删除推荐内容（multipart/form-data）
 */
export const deleteRecommendation = (formData) => {
  return api.post('/admin/recommendation/delete', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}
