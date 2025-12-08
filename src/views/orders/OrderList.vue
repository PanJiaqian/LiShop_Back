<template>
  <div>
    <div class="page-title">订单管理</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="tabs">
        <div class="tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部订单</div>
        <div class="tab-item" :class="{ active: activeTab === 'unpaid' }" @click="activeTab = 'unpaid'">待付款</div>
        <div class="tab-item" :class="{ active: activeTab === 'unshipped' }" @click="activeTab = 'unshipped'">待发货</div>
        <div class="tab-item" :class="{ active: activeTab === 'shipped' }" @click="activeTab = 'shipped'">已发货</div>
        <div class="tab-item" :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">已完成</div>
        <div class="tab-item" :class="{ active: activeTab === 'closed' }" @click="activeTab = 'closed'">已关闭</div>
      </div>
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="订单号/买家姓名/手机号" v-model="filter.keyword" />
        <input type="date" class="form-input" v-model="filter.startDate" />
        <span class="separator">-</span>
        <input type="date" class="form-input" v-model="filter.endDate" />
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm" @click="exportOrders">导出</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>买家</th>
            <th>订单金额</th>
            <th>下单时间</th>
            <th>状态</th>
            <th>支付方式</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td>
              <div class="order-id">{{ order.id }}</div>
              <div class="order-source" v-if="order.source">{{ order.source }}</div>
            </td>
            <td>
              <div class="user-info">
                <div class="name">{{ order.user }}</div>
                <div class="phone">{{ order.phone }}</div>
              </div>
            </td>
            <td>
              <div class="amount">¥ {{ order.amount }}</div>
              <div class="shipping-fee">运费: ¥ {{ order.shipping }}</div>
            </td>
            <td>{{ order.time }}</td>
            <td>
              <span class="badge" :class="getStatusClass(order.status)">{{ order.status }}</span>
            </td>
            <td>{{ order.payment }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="$router.push(`/orders/detail`)">详情</button>
                <button class="btn-link" v-if="order.status === '待发货'" @click="shipOrder(order)">发货</button>
                <button class="btn-link danger" v-if="order.status === '待付款'" @click="closeOrder(order)">关闭</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <span class="page-info">共 {{ filteredOrders.length }} 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" disabled>上一页</button>
          <button class="btn-sm active">1</button>
          <button class="btn-sm">2</button>
          <button class="btn-sm">3</button>
          <button class="btn-sm">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, reactive, ref, computed } from 'vue'

export default {
  name: 'OrderList',
  setup() {
    const showModal = inject('showModal')
    const activeTab = ref('all')
    const filter = reactive({
      keyword: '',
      startDate: '',
      endDate: ''
    })

    const orders = reactive([
        { id: 'ORD-20251204-001', user: 'Alice Smith', phone: '138****1234', amount: '299.00', shipping: '0.00', time: '2025-12-04 10:30:00', status: '待发货', payment: '微信支付' },
        { id: 'ORD-20251204-002', user: 'Bob Jones', phone: '139****5678', amount: '599.00', shipping: '10.00', time: '2025-12-04 09:15:20', status: '待付款', payment: '未支付' },
        { id: 'ORD-20251204-003', user: 'Charlie Brown', phone: '150****9876', amount: '58.00', shipping: '6.00', time: '2025-12-03 18:20:15', status: '已完成', payment: '支付宝' },
        { id: 'ORD-20251204-004', user: 'David Wilson', phone: '136****4321', amount: '399.00', shipping: '0.00', time: '2025-12-03 14:10:05', status: '已发货', payment: '微信支付' },
        { id: 'ORD-20251204-005', user: 'Eva Davis', phone: '189****6789', amount: '99.00', shipping: '0.00', time: '2025-12-03 11:05:00', status: '已关闭', payment: '未支付' }
    ])

    const filteredOrders = computed(() => {
      let res = orders
      if (activeTab.value !== 'all') {
        const statusMap = {
          'unpaid': '待付款',
          'unshipped': '待发货',
          'shipped': '已发货',
          'completed': '已完成',
          'closed': '已关闭'
        }
        res = res.filter(o => o.status === statusMap[activeTab.value])
      }
      // Simple keyword filter
      if (filter.keyword) {
        res = res.filter(o => o.id.includes(filter.keyword) || o.user.includes(filter.keyword))
      }
      return res
    })

    const getStatusClass = (status) => {
      const map = {
        '待付款': 'warning',
        '待发货': 'info',
        '已发货': 'primary',
        '已完成': 'success',
        '已关闭': 'gray'
      }
      return map[status] || 'gray'
    }

    const handleSearch = () => {
      console.log('Search:', filter)
    }

    const exportOrders = () => {
      showModal({
        type: 'confirm',
        title: '导出订单',
        message: '确定要导出当前筛选的订单数据吗？',
        onConfirm: () => {
          console.log('Exporting...')
        }
      })
    }

    const shipOrder = (order) => {
      showModal({
        type: 'form',
        title: '订单发货',
        fields: {
          logisticsCompany: { label: '物流公司', type: 'select', value: '顺丰速运', options: [
            { label: '顺丰速运', value: '顺丰速运' },
            { label: '中通快递', value: '中通快递' },
            { label: '圆通速递', value: '圆通速递' }
          ]},
          trackingNumber: { label: '物流单号', type: 'text', value: '' }
        },
        onConfirm: (fields) => {
          order.status = '已发货'
          console.log('Shipped:', fields)
        }
      })
    }

    const closeOrder = (order) => {
      showModal({
        type: 'confirm',
        title: '关闭订单',
        message: '确定要关闭该订单吗？关闭后无法恢复。',
        onConfirm: () => {
          order.status = '已关闭'
        }
      })
    }

    return {
      activeTab,
      filter,
      orders,
      filteredOrders,
      getStatusClass,
      handleSearch,
      exportOrders,
      shipOrder,
      closeOrder
    }
  }
}
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 20px;
  margin-left: -24px;
  margin-right: -24px;
  padding: 0 24px;
}
.tab-item {
  padding: 12px 24px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  
  &:hover { color: var(--primary-color); }
  &.active { color: var(--primary-color); border-bottom-color: var(--primary-color); font-weight: 500; }
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.form-input {
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: var(--primary-color); }
}
.separator {
  color: #9ca3af;
}
.order-id {
  font-weight: 500;
  color: #111827;
}
.user-info {
  .name { font-weight: 500; }
  .phone { font-size: 12px; color: #6b7280; }
}
.amount {
  font-weight: 600;
  color: #111827;
}
.shipping-fee {
  font-size: 12px;
  color: #9ca3af;
}
.actions {
  display: flex;
  gap: 8px;
}
.btn-link {
  border: none;
  background: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  
  &.danger { color: #ef4444; }
  &:hover { text-decoration: underline; }
}
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  
  .page-info { font-size: 13px; color: #6b7280; }
  .page-btns { display: flex; }
}
</style>