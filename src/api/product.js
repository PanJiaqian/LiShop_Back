import { api } from './admin'

export const createProduct = (formData, config = {}) => {
  return api.post('/admin/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

export const importProductsExcel = (formData, config = {}) => {
  return api.post('/admin/products/import_excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

export const importProductsImagesZip = (formData, config = {}) => {
  return api.post('/admin/products/import_images_zip', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

export const updateProduct = (formData, config = {}) => {
  return api.post('/admin/products/update', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}

export const updateProductStatus = (data) => {
  return api.post('/admin/products/status', data).then(res => res.data)
}

export const listProducts = (params) => {
  return api.get('/admin/products', { params }).then(res => res.data)
}

export const searchProducts = (params) => {
  return api.get('/admin/products/search', { params }).then(res => res.data)
}

export const listProductsByAvailableProduct = (params) => {
  return api.get('/admin/available_products/products', { params }).then(res => res.data)
}
