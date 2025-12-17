import { api } from './admin'

export const createAvailableProduct = (formData) => {
  return api.post('/admin/available_products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const importAvailableProductsExcel = (formData) => {
  return api.post('/admin/available_products/import_excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const importAvailableProductsVideosZip = (formData) => {
  return api.post('/admin/available_products/import_videos_zip', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const importAvailableProductsImagesZip = (formData) => {
  return api.post('/admin/available_products/import_images_zip', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const updateAvailableProduct = (formData) => {
  return api.post('/admin/available_products/update', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const updateAvailableProductStatus = (data) => {
  return api.post('/admin/available_products/status', data).then(res => res.data)
}

export const listAvailableProducts = (params) => {
  return api.get('/admin/available_products', { params }).then(res => res.data)
}

export const searchAvailableProducts = (params) => {
  return api.get('/admin/available_products/search', { params }).then(res => res.data)
}
