import { api } from './admin'

export const createProduct = (formData) => {
  return api.post('/admin/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const importProductsExcel = (formData) => {
  return api.post('/admin/products/import_excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const importProductsImagesZip = (formData) => {
  return api.post('/admin/products/import_images_zip', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const updateProduct = (formData) => {
  return api.post('/admin/products/update', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const updateProductStatus = (data) => {
  return api.post('/admin/products/status', data).then(res => res.data)
}

export const listProducts = (params) => {
  return api.get('/admin/products', { params }).then(res => res.data)
}
