/*
 * 模块: 轮播图管理接口
 * 作用: 提供管理端轮播图的创建、上下架、列表与删除相关请求封装
 */
import { api } from './admin'

/**
 * 创建轮播图（multipart/form-data）
 */
export const createCarousel = (formData) => {
  return api.post('/admin/carousel/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}

/**
 * 更新轮播图状态（上架/下架等，multipart/form-data）
 */
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

/**
 * 获取轮播图列表
 */
export const listCarousel = (params) => {
  return api.get('/admin/carousel/list', { params }).then(res => res.data)
}

/**
 * 删除轮播图（multipart/form-data）
 */
export const deleteCarousel = (formData) => {
  return api.post('/admin/carousel/delete', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}
