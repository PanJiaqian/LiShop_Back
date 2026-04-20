import { api } from './admin.js'

/**
 * 获取优惠券列表
 */
export const listCoupons = params => api.get('/admin/coupons', { params }).then(r => r.data)

/**
 * 创建优惠券
 */
export const createCoupon = body => api.post('/admin/coupons', body).then(r => r.data)

/**
 * 更新优惠券
 */
export const updateCoupon = body => api.put('/admin/coupons', body).then(r => r.data)

/**
 * 删除优惠券
 */
export const deleteCoupon = coupon_id => api.delete(`/admin/coupons/${coupon_id}`).then(r => r.data)

/**
 * 更新优惠券状态
 */
export const updateCouponStatus = (coupon_id, status) => api.put(`/admin/coupons/${coupon_id}/status`, null, { params: { status } }).then(r => r.data)

/**
 * 获取优惠券领取记录
 */
export const listCouponRecords = (coupon_id, params) => api.get(`/admin/coupons/${coupon_id}/records`, { params }).then(r => r.data)
