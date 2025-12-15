<template>
  <div>
    <div class="page-title">订单管理</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="tabs">
        <div class="tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部订单</div>
        <div class="tab-item" :class="{ active: activeTab === 'unpaid' }" @click="activeTab = 'unpaid'">待付款</div>
        <div class="tab-item" :class="{ active: activeTab === 'unshipped' }" @click="activeTab = 'unshipped'">待发货</div>
        <div class="tab-item" :class="{ active: activeTab === 'shipped' }" @click="activeTab = 'shipped'">待收货</div>
        <div class="tab-item" :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">已收货</div>
        <div class="tab-item" :class="{ active: activeTab === 'closed' }" @click="activeTab = 'closed'">已取消</div>
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
            <th>用户ID</th>
            <th>订单金额</th>
            <th>下单时间</th>
            <th>状态</th>
            <th>物流公司</th>
            <th>运单号</th>
            <th>备注</th>
            <th width="180">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td>
              <div class="order-id">{{ order.id }}</div>
              <div class="order-source" v-if="order.source">{{ order.source }}</div>
            </td>
            <td>{{ order.user_id }}</td>
            <td>
              <div class="amount">¥ {{ order.total_amount }}</div>
            </td>
            <td>{{ order.created_at }}</td>
            <td>
              <span class="badge" :class="getStatusClass(order.status)">{{ order.status }}</span>
            </td>
            <td>{{ order.logistics_company || '—' }}</td>
            <td>{{ order.tracking_number || '—' }}</td>
            <td style="max-width: 240px; overflow: hidden; text-overflow: ellipsis;">{{ order.note || '—' }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="$router.push(`/orders/${order.id}`)">详情</button>
                <button class="btn-link" v-if="order.status === '待发货'" @click="shipOrder(order)">发货</button>
                <button class="btn-link" v-if="order.status === '待收货'" @click="changeTracking(order)">改单号</button>
                <button class="btn-link danger" v-if="order.status === '待付款'" @click="closeOrder(order)">取消</button>
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
import { inject, reactive, ref, computed, onMounted } from 'vue'
import { listAdminOrdersDetail, updateOrderStatus, updateTrackingNumber } from '@/api/order.js'

export default {
  name: 'OrderList',
  setup() {
    const showModal = inject('showModal')
    const showToast = inject('showToast')
    const activeTab = ref('all')
    const filter = reactive({
      keyword: '',
      startDate: '',
      endDate: ''
    })

    const orders = reactive([])

    const normalizeStatus = (s) => {
      const k = String(s || '').toUpperCase()
      const map = {
        PENDING: '待付款',
        CONFIRMED: '待发货',
        SHIPPED: '待收货',
        COMPLETED: '已收货',
        CANCELLED: '已取消'
      }
      return map[k] || s
    }

    const fetchOrders = async () => {
      try {
        const res = await listAdminOrdersDetail({ order_id: '', page: 1, page_size: 20, sort_by: 'price', sort_order: 'desc' })
        const items = (res && res.data && Array.isArray(res.data.orders)) ? res.data.orders : []
        const mapped = items.map(e => {
          const o = e.order || {}
          return {
            id: o.order_id,
            user_id: o.user_id || '',
            address_id: o.address_id || '',
            total_amount: (o.total_amount != null ? Number(o.total_amount).toFixed(2) : '0.00'),
            created_at: (o.created_at ? String(o.created_at).replace('T', ' ').split('.')[0] : ''),
            status: normalizeStatus(o.status),
            tracking_number: o.tracking_number,
            logistics_company: o.logistics_company,
            note: o.note || ''
          }
        })
        orders.splice(0, orders.length, ...mapped)
      } catch (e) {
        showToast('获取订单失败')
      }
    }

    const filteredOrders = computed(() => {
      let res = orders
      if (activeTab.value !== 'all') {
        const statusMap = {
          'unpaid': '待付款',
          'unshipped': '待发货',
          'shipped': '待收货',
          'completed': '已收货',
          'closed': '已取消'
        }
        res = res.filter(o => o.status === statusMap[activeTab.value])
      }
      // Simple keyword filter
      if (filter.keyword) {
        res = res.filter(o => o.id.includes(filter.keyword) || (o.user_id || '').includes(filter.keyword))
      }
      return res
    })

    const getStatusClass = (status) => {
      const map = {
        '待付款': 'warning',
        '待发货': 'info',
        '待收货': 'primary',
        '已收货': 'success',
        '已取消': 'gray'
      }
      return map[status] || 'gray'
    }

    const handleSearch = () => {
      fetchOrders()
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
          logisticsCompany: { label: '物流公司', type: 'select', value: 'zhongtong', options: [
            { label: '中通快递', value: 'zhongtong' },
            { label: '顺丰速运', value: 'sf_express' },
            { label: '顺丰快运', value: 'sf_fast' }
          ]},
          trackingNumber: { label: '物流单号', type: 'text', value: '' },
          fromRegion: { label: '寄件地区', type: 'text', value: '' },
          toRegion: { label: '收件地区', type: 'text', value: '' },
          senderPhone: { label: '寄件人手机号', type: 'text', value: '' }
        },
        onConfirm: async (fields) => {
          try {
            if (!fields.trackingNumber.value) {
              showToast('请填写运单号')
              return
            }
            const fd = new FormData()
            fd.append('order_id', order.id)
            fd.append('tracking_number', fields.trackingNumber.value)
            fd.append('status', 'SHIPPED')
            if (fields.logisticsCompany.value) fd.append('logistics_company_code', fields.logisticsCompany.value)
            if (fields.fromRegion.value) fd.append('from_region', fields.fromRegion.value)
            if (fields.toRegion.value) fd.append('to_region', fields.toRegion.value)
            if (fields.senderPhone.value) fd.append('sender_phone', fields.senderPhone.value)
            const res = await updateOrderStatus(fd)
            showToast((res && res.message) || '发货成功')
            order.status = '待收货'
          } catch (e) {
            showToast('发货失败')
          }
        }
      })
    }

    const changeTracking = (order) => {
      showModal({
        type: 'form',
        title: '修改运单号',
        fields: {
          trackingNumber: { label: '新运单号', type: 'text', value: '' }
        },
        onConfirm: async (fields) => {
          try {
            const fd = new FormData()
            fd.append('order_id', order.id)
            fd.append('tracking_number', fields.trackingNumber.value)
            const res = await updateTrackingNumber(fd)
            showToast((res && res.message) || '修改成功')
          } catch (e) {
            showToast('修改失败')
          }
        }
      })
    }

    const closeOrder = (order) => {
      showModal({
        type: 'confirm',
        title: '取消订单',
        message: '确定要取消该订单吗？取消后无法恢复。',
        onConfirm: () => {
          order.status = '已取消'
        }
      })
    }

    onMounted(() => {
      fetchOrders()
    })

    return {
      activeTab,
      filter,
      orders,
      filteredOrders,
      getStatusClass,
      handleSearch,
      exportOrders,
      shipOrder,
      closeOrder,
      changeTracking
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

.data-table th, .data-table td {
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
