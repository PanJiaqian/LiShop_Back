<template>
  <aside class="sidebar" :class="{ collapsed }">
    <nav class="menu">
      <div class="menu-group">
        <div class="menu-group-title">商品</div>
        <router-link to="/products" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">📦</span>
            <span class="text">商品列表</span>
          </a>
        </router-link>
        <router-link to="/categories" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">🗂️</span>
            <span class="text">类目管理</span>
          </a>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">交易</div>
        <router-link to="/orders" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">🧾</span>
            <span class="text">订单管理</span>
          </a>
        </router-link>
        <router-link to="/analytics/transaction-stats" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">📊</span>
            <span class="text">交易统计</span>
          </a>
        </router-link>
        <router-link to="/users" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">👥</span>
            <span class="text">用户管理</span>
          </a>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">权限</div>
        <router-link to="/admins" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleAdminNavigate($event, navigate)">
            <span class="icon">🛡️</span>
            <span class="text">管理员</span>
          </a>
        </router-link>
        <router-link to="/admins/roles" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">🔑</span>
            <span class="text">角色权限</span>
          </a>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">营销</div>
        <router-link to="/pricing/strategies" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">💵</span>
            <span class="text">价格策略</span>
          </a>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">内容</div>
        <router-link to="/content/carousel" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">🎠</span>
            <span class="text">轮播管理</span>
          </a>
        </router-link>
        <router-link to="/content/recommendations" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">⭐</span>
            <span class="text">猜你喜欢</span>
          </a>
        </router-link>
        <router-link to="/content/announcements" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">📢</span>
            <span class="text">公告管理</span>
          </a>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">其他</div>
        <router-link to="/messages" custom v-slot="{ navigate, href, isActive }">
          <a :class="['menu-item', { 'router-link-active': isActive }]" :href="href" @click="handleLink($event, navigate)">
            <span class="icon">✉️</span>
            <span class="text">消息工单</span>
          </a>
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<script>
import { inject } from 'vue'
import { loginAdmin, listAdmins, useAuthStore } from '@/api/admin.js'

export default {
  name: 'LayoutSidebar',
  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const showModal = inject('showModal')
    return { showModal }
  },
  methods: {
    handleLink (e, navigate) {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) {
        e.preventDefault()
        this.openLogin()
        return
      }
      navigate(e)
    },
    handleAdminNavigate (e, navigate) {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) {
        e.preventDefault()
        this.openLogin()
        return
      }
      const role = String((auth.user && auth.user.role) || '').toUpperCase().trim()
      if (role !== 'SUPER') {
        e.preventDefault()
        this.showModal({
          type: 'confirm',
          title: '提示',
          message: '此账号没有权限'
        })
        return
      }
      navigate(e)
    },
    openLogin () {
      this.showModal({
        type: 'form',
        title: '管理员登录',
        className: 'login-modal',
        fields: {
          phone: { label: '手机号', type: 'text', value: '' },
          password: { label: '密码', type: 'password', value: '' }
        },
        onConfirm: async (fields) => {
          const phone = (fields.phone && fields.phone.value) || ''
          const password = (fields.password && fields.password.value) || ''
          try {
            const res = await loginAdmin({ phone, password })
            const msg = (res && res.message) || '登录成功'
            this.showModal({ type: 'confirm', title: '提示', message: msg })
            try {
              const auth = useAuthStore()
              const listRes = await listAdmins({ admin_id: '', page: 1, page_size: 20, sort_by: 'id', sort_order: '' })
              const items = (listRes && listRes.data && listRes.data.items) || []
              const self = items.find(i => i.phone === (auth.user && auth.user.phone))
              if (self && self.role) {
                auth.user = { ...(auth.user || {}), role: self.role }
                localStorage.setItem('shopback_admin_user', JSON.stringify(auth.user))
              }
            } catch (e) {}
          } catch (e) {
            this.showModal({ type: 'confirm', title: '提示', message: '登录失败' })
          }
        }
      })
    },
    handleNavClick (e) {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) {
        e.preventDefault()
        this.openLogin()
      }
    },
    handleAdminClick (e) {
      const auth = useAuthStore()
      if (!auth.isLoggedIn) {
        e.preventDefault()
        this.openLogin()
        return
      }
      if (auth.user && auth.user.role !== 'SUPER') {
        e.preventDefault()
        this.showModal({
          type: 'confirm',
          title: '提示',
          message: '此账号没有权限'
        })
      }
    }
  }
}
</script>

<style lang="scss">
.sidebar {
  width: 260px;
  background: #1e293b;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  border-right: 1px solid #334155;
}
.sidebar.collapsed {
  width: 64px;
  
  .menu-group-title {
    opacity: 0;
    height: 0;
    padding: 0;
    margin: 0;
  }
  
  .text {
    opacity: 0;
    display: none;
  }
  
  .menu-item {
    justify-content: center;
    padding: 12px 0;
    
    .icon {
      margin-right: 0;
    }
  }
}
.menu {
  padding: 16px 12px;
  overflow-y: auto;
  flex: 1;
}
.menu-group {
  margin-bottom: 24px;
}
.menu-group-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #64748b;
  padding: 0 12px;
  margin-bottom: 8px;
  font-weight: 600;
  transition: all 0.3s;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 4px;
  
  &:hover {
    background: #334155;
    color: #fff;
  }
  
  &.router-link-active {
    background: var(--primary-color);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
}
.icon {
  margin-right: 12px;
  font-size: 18px;
  min-width: 24px;
  text-align: center;
}
.text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: opacity 0.2s;
}

/* Custom Scrollbar for Sidebar */
.menu::-webkit-scrollbar {
  width: 4px;
}
.menu::-webkit-scrollbar-track {
  background: transparent;
}
.menu::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}
</style>
