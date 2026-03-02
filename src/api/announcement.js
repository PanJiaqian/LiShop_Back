/*
 * 模块: 公告管理接口
 * 作用: 提供管理端公告的增删改查与上下架相关请求封装
 */
import { api } from './admin'

/**
 * 创建公告
 */
export const createAnnouncement = (data) => {
  return api.post('/admin/announcements', data)
    .then(res => res.data)
}

/**
 * 更新公告内容
 */
export const updateAnnouncement = (data) => {
  return api.post('/admin/announcements/update', data)
    .then(res => res.data)
}

/**
 * 更新公告状态（上架/下架等）
 */
export const updateAnnouncementStatus = (data) => {
  return api.post('/admin/announcements/status', data)
    .then(res => res.data)
}

/**
 * 获取公告列表
 */
export const listAnnouncements = (params) => {
  return api.get('/admin/announcements', { params })
    .then(res => res.data)
}

/**
 * 删除公告（multipart/form-data）
 */
export const deleteAnnouncement = (formData) => {
  return api.post('/admin/announcements/delete', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}
