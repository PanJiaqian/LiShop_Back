/*
 * 模块: 分类管理接口
 * 作用: 提供管理端商品分类的列表、创建、更新、状态变更、删除与图片上传请求封装
 */
import { api } from './admin'

/**
 * 获取分类列表
 */
export const listCategories = (params) => {
  return api.get('/admin/categories', { params })
    .then(res => res.data)
}

/**
 * 创建分类
 */
export const createCategory = (data) => {
  return api.post('/admin/categories', data)
    .then(res => res.data)
}

/**
 * 更新分类信息
 */
export const updateCategory = (data) => {
  return api.post('/admin/categories/update', data)
    .then(res => res.data)
}

/**
 * 更新分类状态（启用/停用等）
 */
export const updateCategoryStatus = (data) => {
  return api.post('/admin/categories/status', data)
    .then(res => res.data)
}

/**
 * 删除分类（multipart/form-data）
 */
export const deleteCategory = (formData) => {
  return api.post('/admin/categories/delete', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

/**
 * 上传分类图片（multipart/form-data）
 */
export const uploadCategoryImage = (formData) => {
  return api.post('/admin/categories/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}
