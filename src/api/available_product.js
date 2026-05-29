/*
 * 模块: 可售商品（available_products）管理接口
 * 作用: 提供管理端可售商品的创建/更新/上下架/列表与批量导入相关请求封装
 */
import { api } from './admin'

/**
 * 创建可售商品（multipart/form-data）
 */
export const createAvailableProduct = (formData, config = {}) => {
  return api.post('/admin/available_products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

/**
 * 批量导入可售商品（Excel）
 */
export const importAvailableProductsExcel = (formData, config = {}) => {
  return api.post('/admin/available_products/import_excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

/**
 * 批量导入可售商品视频（Zip）
 */
export const importAvailableProductsVideosZip = (formData, config = {}) => {
  return api.post('/admin/available_products/import_videos_zip', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

/**
 * 批量导入可售商品图片（Zip）
 */
export const importAvailableProductsImagesZip = (formData, config = {}) => {
  return api.post('/admin/available_products/import_images_zip', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

/**
 * 更新可售商品（multipart/form-data）
 */
export const updateAvailableProduct = (formData, config = {}) => {
  return api.post('/admin/available_products/update', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

/**
 * 更新可售商品状态（上架/下架等）
 */
export const updateAvailableProductStatus = (data) => {
  return api.post('/admin/available_products/status', data).then(res => res.data)
}

/**
 * 获取可售商品列表
 */
export const listAvailableProducts = (params) => {
  return api.get('/admin/available_products', { params }).then(res => res.data)
}

/**
 * 搜索可售商品
 */
export const searchAvailableProducts = (params) => {
  return api.get('/admin/available_products/search', { params }).then(res => res.data)
}

/**
 * 删除可售商品（multipart/form-data）
 *
 * @param {FormData} formData 请求表单，需包含商品 ID
 * @returns {Promise<Object>} 删除结果
 * @example
 * const formData = new FormData()
 * formData.append('product_id', 'AP001')
 * await deleteAvailableProduct(formData)
 */
export const deleteAvailableProduct = (formData) => {
  return api.post('/admin/available_products/delete', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

/**
 * 查询母商品可选分组范围（含绑定状态）
 */
export const getVisibleUsers = (params) => {
  return api.get('/admin/available_products/visible_users', { params }).then(res => res.data)
}

/**
 * 母商品改分类影响预览
 */
export const previewCategoryChange = (data) => {
  return api.post('/admin/available_products/category_change/preview', data).then(res => res.data)
}
