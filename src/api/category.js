import { api } from './admin'

export const listCategories = (params) => {
  return api.get('/admin/categories', { params })
    .then(res => res.data)
}

export const createCategory = (data) => {
  return api.post('/admin/categories', data)
    .then(res => res.data)
}

export const updateCategory = (data) => {
  return api.post('/admin/categories/update', data)
    .then(res => res.data)
}

export const updateCategoryStatus = (data) => {
  return api.post('/admin/categories/status', data)
    .then(res => res.data)
}

export const deleteCategory = (formData) => {
  return api.post('/admin/categories/delete', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

export const uploadCategoryImage = (formData) => {
  return api.post('/admin/categories/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}
