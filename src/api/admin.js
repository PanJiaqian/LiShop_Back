import axios from 'axios'
import { createPinia, setActivePinia, defineStore } from 'pinia'

const pinia = createPinia()
setActivePinia(pinia)

const BASE_URL = 'https://www.nuomi-light.com:6149/api'
const TOKEN_KEY = 'shopback_admin_token'
const EXPIRES_KEY = 'shopback_admin_token_expires_at'
const USER_KEY = 'shopback_admin_user'

let logoutTimer

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
    }
    return Promise.reject(err)
  }
)

export const loginAdmin = payload => {
  const auth = useAuthStore()
  return auth.login(payload)
}

export const createAdmin = body => api.post('/admin/admins', body).then(r => r.data)

export const updateAdmin = body => api.post('/admin/admins/update', body).then(r => r.data)

export const updateAdminPermissions = body => api.post('/admin/admins/permissions', body).then(r => r.data)

export const updateAdminStatus = body => api.post('/admin/admins/status', body).then(r => r.data)

export const listAdmins = params => api.get('/admin/admins', { params }).then(r => r.data)

const authInit = useAuthStore()
authInit.ensureTimer()

export const deleteAdmin = body => api.post('/admin/admins/delete', body).then(r => r.data)

export const bindResponsibleUsers = body => api.post('/admin/admins/bind_users/add', body).then(r => r.data)

export const updateResponsibleUsers = body => api.post('/admin/admins/bind_users/update', body).then(r => r.data)


