import { createRouter, createWebHashHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/dashboard/Dashboard.vue') },
        { path: 'products', name: 'products', component: () => import('@/views/products/ProductList.vue') },
        { path: 'products/create', name: 'product-create', component: () => import('@/views/products/ProductCreate.vue') },
        { path: 'products/:id/edit', name: 'product-edit', component: () => import('@/views/products/ProductEdit.vue') },
        { path: 'categories', name: 'categories', component: () => import('@/views/categories/CategoryList.vue') },
        { path: 'inventory', name: 'inventory', component: () => import('@/views/inventory/Inventory.vue') },
        { path: 'orders', name: 'orders', component: () => import('@/views/orders/OrderList.vue') },
        { path: 'orders/:id', name: 'order-detail', component: () => import('@/views/orders/OrderDetail.vue') },
        { path: 'users', name: 'users', component: () => import('@/views/users/UserList.vue') },
        { path: 'admins', name: 'admins', component: () => import('@/views/admins/AdminList.vue') },
        { path: 'admins/roles', name: 'roles', component: () => import('@/views/admins/RoleList.vue') },
        { path: 'marketing/coupons', name: 'coupons', component: () => import('@/views/marketing/CouponList.vue') },
        { path: 'marketing/campaigns', name: 'campaigns', component: () => import('@/views/marketing/CampaignList.vue') },
        { path: 'content/banners', name: 'banners', component: () => import('@/views/content/BannerList.vue') },
        { path: 'shipping/templates', name: 'shipping-templates', component: () => import('@/views/shipping/ShippingTemplateList.vue') },
        { path: 'payments/channels', name: 'payment-channels', component: () => import('@/views/payments/PaymentChannelList.vue') },
        { path: 'analytics', name: 'analytics', component: () => import('@/views/analytics/Analytics.vue') },
        { path: 'settings', name: 'settings', component: () => import('@/views/settings/Settings.vue') },
        { path: 'system/audit', name: 'audit', component: () => import('@/views/system/AuditLog.vue') },
        { path: 'messages', name: 'messages', component: () => import('@/views/messages/Messages.vue') }
      ]
    }
  ]
})

export default router
