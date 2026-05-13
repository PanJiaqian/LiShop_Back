/*
 * 模块: 管理端认证与通用 API 客户端
 * 作用: 维护管理员登录态(token/过期时间/用户信息)，并提供自动携带 Authorization 的 axios 实例；当接口返回 401 时自动清理登录态
 */
import axios from 'axios'
import { createPinia, setActivePinia, defineStore } from 'pinia'

const pinia = createPinia()
setActivePinia(pinia)

const BASE_URL = 'https://www.nuomi-light.com:6149/api'
const TOKEN_KEY = 'shopback_admin_token'
const EXPIRES_KEY = 'shopback_admin_token_expires_at'
const USER_KEY = 'shopback_admin_user'

let logoutTimer

/**
 * 判断文本是否为可展示的有效内容。
 * @param {unknown} value 待判断内容
 * @returns {boolean} 是否可用于错误提示展示
 */
const hasUsefulText = (value) => {
  if (value == null) return false
  const text = String(value).trim()
  if (!text) return false
  return !['[object Object]', 'undefined', 'null'].includes(text)
}

/**
 * 将接口返回的 data/detail 字段格式化为可直接展示的文本。
 * @param {unknown} payload 接口返回的详细数据
 * @returns {string} 格式化后的说明文本
 */
const stringifyApiPayload = (payload) => {
  if (payload == null) return ''
  if (typeof payload === 'string' || typeof payload === 'number' || typeof payload === 'boolean') {
    return String(payload).trim()
  }
  if (Array.isArray(payload)) {
    return payload
      .map(item => stringifyApiPayload(item))
      .filter(hasUsefulText)
      .join('；')
  }
  if (typeof payload === 'object') {
    if (Array.isArray(payload.failures) && payload.failures.length) {
      return payload.failures
        .map(item => {
          const row = hasUsefulText(item && item.row) ? `第${item.row}行` : ''
          const name = hasUsefulText(item && (item.name || item.username)) ? `${item.name || item.username}` : ''
          const reason = hasUsefulText(item && item.reason) ? `${item.reason}` : ''
          return [row, name, reason].filter(Boolean).join(' ')
        })
        .filter(hasUsefulText)
        .join('；')
    }
    return Object.keys(payload)
      .map(key => {
        const value = stringifyApiPayload(payload[key])
        return hasUsefulText(value) ? `${key}: ${value}` : ''
      })
      .filter(Boolean)
      .join('；')
  }
  return ''
}

/**
 * 组合接口主提示与详细说明，避免丢失后端返回的 data 错误原因。
 * @param {unknown} message 主提示信息
 * @param {unknown} detail 详细原因
 * @param {string} fallback 兜底文案
 * @returns {string} 最终展示文案
 */
export const buildApiMessage = (message, detail, fallback = '请求失败') => {
  const summary = hasUsefulText(message) ? String(message).trim() : ''
  const detailText = stringifyApiPayload(detail)
  if (summary && detailText) {
    if (summary === detailText || detailText.startsWith(summary)) return detailText
    return `${summary}：${detailText}`
  }
  if (summary) return summary
  if (detailText) return detailText
  return fallback
}

/**
 * 从接口成功/失败返回包体中提取统一提示文本。
 * @param {unknown} result 接口返回包体
 * @param {string} fallback 兜底文案
 * @returns {string} 解析后的提示文本
 */
export const resolveApiResultMessage = (result, fallback = '操作失败') => {
  if (!result || typeof result !== 'object') return fallback
  const detail = result.data != null ? result.data : result.detail
  return buildApiMessage(result.message, detail, fallback)
}

/**
 * 从 axios 错误对象或普通异常中提取统一提示文本。
 * @param {unknown} error 异常对象
 * @param {string} fallback 兜底文案
 * @returns {string} 解析后的错误提示
 */
export const resolveApiErrorMessage = (error, fallback = '请求失败') => {
  const payload = error && error.response && error.response.data
  if (payload && typeof payload === 'object') {
    return resolveApiResultMessage(payload, fallback)
  }
  const rawMessage = error && hasUsefulText(error.message) ? String(error.message).trim() : ''
  if (rawMessage && !/^Request failed with status code \d+$/i.test(rawMessage)) {
    return rawMessage
  }
  return fallback
}

/**
 * 向全局派发接口错误事件，供布局层统一展示更具体的后端错误提示。
 * @param {string} message 需要展示的错误文案
 */
const emitApiErrorMessage = (message) => {
  if (!hasUsefulText(message)) return
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return
  try {
    window.dispatchEvent(new CustomEvent('shopback-api-error', { detail: { message } }))
  } catch (e) {}
}

/**
 * 管理员认证状态仓库
 * - token / expiresAt / user 持久化到 localStorage
 * - login 成功后启动自动登出计时器
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || null,
    expiresAt: parseInt(localStorage.getItem(EXPIRES_KEY) || '0', 10),
    user: JSON.parse(localStorage.getItem(USER_KEY) || '{}')
  }),
  getters: {
    isExpired: state => !state.token || Date.now() >= state.expiresAt,
    isLoggedIn: state => !!state.token && Date.now() < state.expiresAt
  },
  actions: {
    async login ({ phone, password }) {
      const res = await axios.post(`${BASE_URL}/auth/login/admin`, { phone, password }, { headers: { 'Content-Type': 'application/json' } })
      const envelope = res.data || {}
      const body = (envelope && typeof envelope === 'object' && envelope.data && typeof envelope.data === 'object') ? envelope.data : envelope
      const receivedToken = body.token || body.accessToken || body.access_token || body.Authorization || body.authToken || body.bearer
      if (receivedToken) {
        const expiresAt = Date.now() + 5 * 24 * 60 * 60 * 1000
        this.token = receivedToken
        this.expiresAt = expiresAt
        localStorage.setItem(TOKEN_KEY, receivedToken)
        localStorage.setItem(EXPIRES_KEY, String(expiresAt))
        const roleRaw = (body.user_role || body.role || (body.user && body.user.role) || body.role_code || 'SUB')
        const normalizedRole = String(roleRaw).toUpperCase().trim() === 'SUPER' ? 'SUPER' : 'SUB'
        this.user = { phone: body.phone || phone, role: normalizedRole }
        localStorage.setItem(USER_KEY, JSON.stringify(this.user))
        if (logoutTimer) clearTimeout(logoutTimer)
        logoutTimer = setTimeout(() => { this.logout() }, expiresAt - Date.now())
      }
      return envelope
    },
    logout () {
      this.token = null
      this.expiresAt = 0
      this.user = {}
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(EXPIRES_KEY)
      localStorage.removeItem(USER_KEY)
      if (logoutTimer) {
        clearTimeout(logoutTimer)
        logoutTimer = null
      }
    },
    ensureTimer () {
      if (this.isLoggedIn) {
        const delay = this.expiresAt - Date.now()
        if (delay > 0) {
          if (logoutTimer) clearTimeout(logoutTimer)
          logoutTimer = setTimeout(() => { this.logout() }, delay)
        }
      }
    }
  }
})

/**
 * 统一的后台 API 客户端
 * - 请求拦截器：自动附加 Bearer token
 * - 响应拦截器：401 触发登出
 */
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const auth = useAuthStore()
  if (auth.token && Date.now() < auth.expiresAt) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    const status = err.response && err.response.status
    if (status === 401) {
      const auth = useAuthStore()
      auth.logout()
    } else {
      const apiMessage = resolveApiErrorMessage(err, '')
      if (hasUsefulText(apiMessage)) {
        err.apiMessage = apiMessage
        err.message = apiMessage
        emitApiErrorMessage(apiMessage)
      }
    }
    return Promise.reject(err)
  }
)

/**
 * 管理员登录
 * @param {{phone: string, password: string}} payload 登录参数
 */
export const loginAdmin = payload => {
  const auth = useAuthStore()
  return auth.login(payload)
}

/**
 * 创建管理员
 */
export const createAdmin = body => api.post('/admin/admins', body).then(r => r.data)

/**
 * 更新管理员信息
 */
export const updateAdmin = body => api.post('/admin/admins/update', body).then(r => r.data)

/**
 * 更新管理员权限
 */
export const updateAdminPermissions = body => api.post('/admin/admins/permissions', body).then(r => r.data)

/**
 * 更新管理员启用状态
 */
export const updateAdminStatus = body => api.post('/admin/admins/status', body).then(r => r.data)

/**
 * 管理员列表（支持分页/筛选等查询参数）
 */
export const listAdmins = params => api.get('/admin/admins', { params }).then(r => r.data)

const authInit = useAuthStore()
authInit.ensureTimer()

/**
 * 删除管理员
 */
export const deleteAdmin = body => api.post('/admin/admins/delete', body).then(r => r.data)

/**
 * 为管理员绑定负责的用户（新增绑定）
 */
export const bindResponsibleUsers = body => api.post('/admin/admins/bind_users/add', body).then(r => r.data)

/**
 * 为管理员绑定负责的用户（更新绑定）
 */
export const updateResponsibleUsers = body => api.post('/admin/admins/bind_users/update', body).then(r => r.data)
