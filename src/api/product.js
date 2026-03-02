/*
 * 模块: 商品管理接口
 * 作用: 提供管理端商品的创建/更新/上下架/列表/搜索，以及批量导入与附件删除等请求封装
 */
import { api } from './admin'

/**
 * 创建商品（multipart/form-data）
 */
export const createProduct = (formData, config = {}) => {
  return api.post('/admin/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

/**
 * 批量导入商品（Excel）
 */
export const importProductsExcel = (formData, config = {}) => {
  return api.post('/admin/products/import_excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

/**
 * 批量导入商品图片（Zip）
 */
export const importProductsImagesZip = (formData, config = {}) => {
  return api.post('/admin/products/import_images_zip', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

/**
 * 更新商品（multipart/form-data）
 */
export const updateProduct = (formData, config = {}) => {
  return api.post('/admin/products/update', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

/**
 * 更新商品状态（上架/下架等）
 */
export const updateProductStatus = (data) => {
  return api.post('/admin/products/status', data).then(res => res.data)
}

/**
 * 获取商品列表
 */
export const listProducts = (params) => {
  return api.get('/admin/products', { params }).then(res => res.data)
}

/**
 * 搜索商品
 */
export const searchProducts = (params) => {
  return api.get('/admin/products/search', { params }).then(res => res.data)
}

/**
 * 按可售商品查询其关联商品列表
 */
export const listProductsByAvailableProduct = (params) => {
  return api.get('/admin/available_products/products', { params }).then(res => res.data)
}

/**
 * 删除商品附件（图片/视频等，multipart/form-data）
 */
export const deleteProductFile = (formData) => {
  return api.post('/admin/products/file/delete', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}
