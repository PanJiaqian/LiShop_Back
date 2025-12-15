<template>
  <header class="header">
    <button class="menu-btn" @click="$emit('toggle')">☰</button>
    <!-- <div class="brand">Shop Admin</div> -->
     <img style="height: 25px;width: 130px;" mode="aspectFit" src="/logo.png" alt="">
    <div class="header-spacer"></div>
    <div class="actions">
      <input class="search" type="text" placeholder="搜索" />
      <button v-if="!isLoggedIn" class="login-text-btn" @click="openLogin">登录</button>
      <div v-else class="avatar-wrapper">
        <div class="avatar" @click="toggleDropdown">A</div>
        <div class="avatar-menu" v-if="showDropdown">
          <div class="menu-title">{{ roleText }}</div>
          <button class="menu-item danger" @click.stop="logout">退出登录</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { inject } from 'vue'
import { loginAdmin, listAdmins, useAuthStore } from '@/api/admin.js'

export default {
  name: 'LayoutHeader',
  inject: ['showModal'],
  data () {
    return {
      showDropdown: false
    }
  },
  computed: {
    isLoggedIn () {
      const auth = useAuthStore()
      return auth.isLoggedIn
    },
    roleText () {
      const auth = useAuthStore()
      const role = auth.user && auth.user.role
      return role === 'SUPER' ? '超级管理员' : '管理员'
    }
  },
  mounted () {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      this.openLogin()
    }
  },
  methods: {
    toggleDropdown () {
      this.showDropdown = !this.showDropdown
    },
    openLogin () {
      this.showModal({
        type: 'form',
        title: '管理员登录',
        className: 'login-modal',
        fields: {
          phone: { label: '账号', type: 'text', value: '' },
          password: { label: '密码', type: 'password', value: '' }
        },
        onConfirm: async (fields) => {
          const phone = (fields.phone && fields.phone.value) || ''
          const password = (fields.password && fields.password.value) || ''
          try {
            const res = await loginAdmin({ phone, password })
            const msg = (res && res.message) || '登录成功'
            this.showModal({ type: 'confirm', title: '提示', message: msg })
            this.showDropdown = false
            try {
              const auth = useAuthStore()
              const listRes = await listAdmins({ admin_id: '', page: 1, page_size: 20, sort_by: 'id', sort_order: '' })
              const items = (listRes && listRes.data && listRes.data.items) || []
              const self = items.find(i => i.phone === (auth.user && auth.user.phone))
              if (self && self.role) {
                const normalized = String(self.role).toUpperCase().trim()
                if (normalized === 'SUPER') {
                  auth.user = { ...(auth.user || {}), role: 'SUPER' }
                  localStorage.setItem('shopback_admin_user', JSON.stringify(auth.user))
                }
              }
            } catch (e) {}
          } catch (e) {
            this.showModal({ type: 'confirm', title: '提示', message: '登录失败' })
          }
        }
      })
    },
    logout () {
      const auth = useAuthStore()
      auth.logout()
      this.showDropdown = false
      this.openLogin()
    }
  }
}
</script>

<style lang="scss">
.header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #ffffff;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  z-index: 10;
  position: relative;
}
.menu-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  margin-right: 16px;
  color: #4b5563;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  
  &:hover {
    background: #f3f4f6;
  }
}
.brand {
  font-weight: 800;
  font-size: 20px;
  background: linear-gradient(to right, var(--primary-color), #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}
.header-spacer {
  flex: 1;
}
.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.search {
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 99px;
  padding: 0 16px;
  width: 240px;
  font-size: 14px;
  background: #f9fafb;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, #60a5fa 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}
.avatar-wrapper {
  position: relative;
}
.avatar-menu {
  position: absolute;
  right: 0;
  top: 48px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  min-width: 160px;
  padding: 8px;
}
.avatar-menu .menu-title {
  font-size: 14px;
  color: #374151;
  font-weight: 600;
  padding: 8px;
}
.avatar-menu .menu-item {
  width: 100%;
  border: none;
  background: #f9fafb;
  color: #111827;
  border-radius: 6px;
  padding: 8px 12px;
  margin: 4px 0;
  cursor: pointer;
}
.avatar-menu .menu-item:hover {
  background: #eef2ff;
}
.avatar-menu .menu-item.danger {
  color: #ef4444;
}
.avatar-menu .menu-item.danger:hover {
  background: #fef2f2;
}
.login-text-btn {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}
.login-text-btn:hover {
  background: var(--primary-color);
  color: #fff;
}
@media (max-width: 576px) {
  .search {
    display: none;
  }
}
</style>
