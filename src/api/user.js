/*
 * 模块: 用户管理接口
 * 作用: 提供管理端用户的列表、创建、更新、状态变更、导入、删除与头像更新请求封装
 */
import { api } from './admin'

/**
 * 获取用户列表
 */
export const listUsers = (params) => {
  return api.get('/admin/users', { params })
    .then(res => res.data)
}

/**
 * 创建用户
 */
export const createUser = (data) => {
  return api.post('/admin/users', data)
    .then(res => res.data)
}

/**
 * 更新用户信息
 */
export const updateUser = (data) => {
  return api.post('/admin/users/update', data)
    .then(res => res.data)
}

/**
 * 更新用户状态（启用/停用等）
 */
export const updateUserStatus = (data) => {
  return api.post('/admin/users/status', data)
    .then(res => res.data)
}

/**
 * 批量导入用户（Excel）
 */
export const importUsersExcel = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/admin/users/import_excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

/**
 * 删除用户（multipart/form-data）
 */
export const deleteUser = (formData) => {
  return api.post('/admin/users/delete', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => res.data)
}

/**
 * 更新用户头像（multipart/form-data）
 */
export const updateUserAvatar = (formData, config = {}) => {
  return api.post('/admin/users/update/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...config
  }).then(res => res.data)
}
