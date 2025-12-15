import { createRouter, createWebHashHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/products' },
        { path: 'products', name: 'products', component: () => import('@/views/products/ProductList.vue') },
        { path: 'products/create', name: 'product-create', component: () => import('@/views/products/ProductCreate.vue') },
        { path: 'products/:id/detail', name: 'product-detail', component: () => import('@/views/products/ProductDetail.vue') },
        { path: 'products/:id/edit', name: 'product-edit', component: () => import('@/views/products/ProductEdit.vue') },
        { path: 'categories', name: 'categories', component: () => import('@/views/categories/CategoryList.vue') },
        { path: 'orders', name: 'orders', component: () => import('@/views/orders/OrderList.vue') },
        { path: 'orders/:id', name: 'order-detail', component: () => import('@/views/orders/OrderDetail.vue') },
        { path: 'users', name: 'users', component: () => import('@/views/users/UserList.vue') },
        { path: 'admins', name: 'admins', component: () => import('@/views/admins/AdminList.vue') },
        { path: 'pricing/strategies', name: 'pricing-strategies', component: () => import('@/views/pricing/PricingStrategy.vue') },
        { path: 'content/carousel', name: 'carousel', component: () => import('@/views/content/CarouselAdmin.vue') },
        { path: 'content/recommendations', name: 'recommendations', component: () => import('@/views/content/RecommendationAdmin.vue') },
        { path: 'content/announcements', name: 'announcements', component: () => import('@/views/announcements/AnnouncementList.vue') },
        { path: 'analytics/transaction-stats', name: 'transaction-stats', component: () => import('@/views/analytics/TransactionStats.vue') },
        { path: 'messages', name: 'messages', component: () => import('@/views/messages/Messages.vue') }
      ]
    }
  ]
})

export default router
