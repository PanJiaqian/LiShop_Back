<template>
  <aside class="sidebar" :class="{ collapsed }">
    <nav class="menu">
      <div class="menu-group">
        <router-link class="menu-item" to="/dashboard">
          <span class="icon">🏠</span>
          <span class="text">仪表盘</span>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">商品</div>
        <router-link class="menu-item" to="/products">
          <span class="icon">📦</span>
          <span class="text">商品列表</span>
        </router-link>
        <router-link class="menu-item" to="/products/create">
          <span class="icon">➕</span>
          <span class="text">新建商品</span>
        </router-link>
        <router-link class="menu-item" to="/categories">
          <span class="icon">🗂️</span>
          <span class="text">类目管理</span>
        </router-link>
        <router-link class="menu-item" to="/inventory">
          <span class="icon">📊</span>
          <span class="text">库存管理</span>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">交易</div>
        <router-link class="menu-item" to="/orders">
          <span class="icon">🧾</span>
          <span class="text">订单管理</span>
        </router-link>
        <router-link class="menu-item" to="/users">
          <span class="icon">👥</span>
          <span class="text">用户管理</span>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">权限</div>
        <router-link class="menu-item" to="/admins">
          <span class="icon">🛡️</span>
          <span class="text">管理员</span>
        </router-link>
        <router-link class="menu-item" to="/admins/roles">
          <span class="icon">🔑</span>
          <span class="text">角色权限</span>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">营销</div>
        <router-link class="menu-item" to="/marketing/coupons">
          <span class="icon">🎟️</span>
          <span class="text">优惠券</span>
        </router-link>
        <router-link class="menu-item" to="/marketing/campaigns">
          <span class="icon">📣</span>
          <span class="text">活动管理</span>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">内容</div>
        <router-link class="menu-item" to="/content/banners">
          <span class="icon">🖼️</span>
          <span class="text">Banner</span>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">物流与支付</div>
        <router-link class="menu-item" to="/shipping/templates">
          <span class="icon">🚚</span>
          <span class="text">运费模板</span>
        </router-link>
        <router-link class="menu-item" to="/payments/channels">
          <span class="icon">💳</span>
          <span class="text">支付渠道</span>
        </router-link>
      </div>
      <div class="menu-group">
        <div class="menu-group-title">统计与系统</div>
        <router-link class="menu-item" to="/analytics">
          <span class="icon">📈</span>
          <span class="text">报表分析</span>
        </router-link>
        <router-link class="menu-item" to="/settings">
          <span class="icon">⚙️</span>
          <span class="text">系统设置</span>
        </router-link>
        <router-link class="menu-item" to="/system/audit">
          <span class="icon">📝</span>
          <span class="text">审计日志</span>
        </router-link>
        <router-link class="menu-item" to="/messages">
          <span class="icon">✉️</span>
          <span class="text">消息工单</span>
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<script>
export default {
  name: 'LayoutSidebar',
  props: {
    collapsed: {
      type: Boolean,
      default: false
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
