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
        <div class="tab-item" :class="{ active: activeTab === 'abnormal' }" @click="activeTab = 'abnormal'">异常订单</div>
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

    <div class="card" v-if="activeTab !== 'abnormal'">
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
                <button class="btn-link" @click="editStatus(order)">编辑状态</button>
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
          <!-- <button class="btn-sm">2</button>
          <button class="btn-sm">3</button> -->
          <button class="btn-sm">下一页</button>
        </div>
      </div>
    </div>
    <div class="card" v-else>
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户名</th>
            <th>手机号</th>
            <th>错误信息</th>
            <th width="180">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in abnormalOrders" :key="o.order_id">
            <td>{{ o.order_id }}</td>
            <td>{{ o.user_name }}</td>
            <td>{{ o.user_phone }}</td>
            <td style="max-width: 360px; overflow: hidden; text-overflow: ellipsis;">{{ o.error_message }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="viewAbnormalDetail(o)">详情</button>
                <button class="btn-link primary" @click="retrySubscribe(o)">重新订阅</button>
              </div>
            </td>
          </tr>
          <tr v-if="!(abnormalOrders && abnormalOrders.length)">
            <td colspan="5" style="text-align:center;color:#999;">暂无异常订单</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { inject, reactive, ref, computed, onMounted, watch } from 'vue'
import { listAdminOrdersDetail, updateOrderStatus, updateTrackingNumber, listAbnormalOrders, subscribeRetry } from '@/api/order.js'

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
    const abnormalOrders = ref([])

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
    if (res && res.success) {
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
    } else {
      orders.splice(0, orders.length)
      const msg = (res && (res.data || res.message)) || '获取订单失败'
      showToast(String(msg))
    }
  } catch (e) {
    showToast('获取订单失败')
  }
}

const fetchAbnormalOrders = async () => {
  try {
    const res = await listAbnormalOrders({})
    if (res && res.success) {
      const arr = (res && res.data && Array.isArray(res.data.orders)) ? res.data.orders : []
      abnormalOrders.value = arr.map(o => ({
        order_id: o.order_id,
        user_name: o.user_name,
        user_phone: o.user_phone,
        order_items: Array.isArray(o.order_items) ? o.order_items : [],
        error_message: o.error_message || ''
      }))
    } else {
      abnormalOrders.value = []
      const msg = (res && (res.data || res.message)) || '获取异常订单失败'
      showToast(String(msg))
    }
  } catch (e) {
    abnormalOrders.value = []
    showToast('获取异常订单失败')
  }
}

    const filteredOrders = computed(() => {
      let res = orders
      if (activeTab.value !== 'all') {
        const statusMap = {
          unpaid: '待付款',
          unshipped: '待发货',
          shipped: '待收货',
          completed: '已收货',
          closed: '已取消'
        }
        res = res.filter(o => o.status === statusMap[activeTab.value])
      }
      if (filter.keyword) {
        res = res.filter(o => o.id.includes(filter.keyword) || (o.user_id || '').includes(filter.keyword))
      }
      const start = filter.startDate
      const end = filter.endDate
      if (start || end) {
        res = res.filter(o => {
          const t = o.created_at || ''
          const d = t.split(' ')[0]
          if (start && d < start) return false
          if (end && d > end) return false
          return true
        })
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

    const handleSearch = () => {}

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

    const editStatus = (order) => {
      const statusMap = [
        { label: '待付款', value: 'PENDING' },
        { label: '待发货', value: 'CONFIRMED' },
        { label: '已收货', value: 'COMPLETED' },
        { label: '已取消', value: 'CANCELLED' }
      ]
      const invert = {
        '待付款': 'PENDING',
        '待发货': 'CONFIRMED',
        '已收货': 'COMPLETED',
        '已取消': 'CANCELLED'
      }
      showModal({
        type: 'form',
        title: '编辑订单状态',
        fields: {
          status: { label: '状态', type: 'select', value: invert[order.status] || 'PENDING', options: statusMap }
        },
        onConfirm: async (fields) => {
          try {
            const status = fields.status.value
            const fd = new FormData()
            fd.append('order_id', order.id)
            fd.append('status', status)
            const res = await updateOrderStatus(fd)
            if (res && res.success) {
              showToast((res && res.message) || '状态更新成功')
              order.status = normalizeStatus(status)
            } else {
              const msg = (res && (res.data || res.message)) || '修改失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('修改失败')
          }
        }
      })
    }

    const shipOrder = (order) => {
      showModal({
        type: 'form',
        title: '订单发货',
        fields: {
          logisticsCompany: { label: '物流公司代码', type: 'text', value: '', link: '/company.xlsx', linkText: '公司代码列表' },
          trackingNumber: { label: '物流单号', type: 'text', value: '' },
          fromRegion: { label: '寄件地区', type: 'text', value: '', tooltip: '模板:广东省广州市黄埔区' },
          toRegion: { label: '收件地区', type: 'text', value: '', tooltip: '模板:广东省广州市黄埔区' },
          senderPhone: { label: '寄件人手机号', type: 'text', value: '', tooltip: '注意事项：\n 1.座机号码：如有分机号，无需传入分机号。\n 2.电商虚拟号码：需传入“-”后的后四位数字。\n 3.手机号验证：建议通过微信小程序验证号码是否正确。\n 例：\n 1.座机 0755-81234567 可传入：075581234567、81234567 或 4567\n 2.电商虚拟号码 13801380000-1234 可传入：1234\n 3.手机号 13801380000 可传入：13801380000 或 8000' }},
        onConfirm: async (fields) => {
          try {
            const fd = new FormData()
            fd.append('order_id', order.id)
            fd.append('tracking_number', fields.trackingNumber.value)
            fd.append('status', 'SHIPPED')
            if (fields.logisticsCompany.value) fd.append('logistics_company_code', fields.logisticsCompany.value)
            if (fields.fromRegion.value) fd.append('from_region', fields.fromRegion.value)
            if (fields.toRegion.value) fd.append('to_region', fields.toRegion.value)
            if (fields.senderPhone.value) fd.append('sender_phone', fields.senderPhone.value)
            const res = await updateOrderStatus(fd)
            if (res && res.success) {
              showToast((res && res.message) || '发货成功')
              order.status = '待收货'
            } else {
              const msg = (res && (res.data || res.message)) || '发货失败'
              showToast(String(msg))
            }
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
          trackingNumber: { label: '新运单号', type: 'text', value: '' },
          logisticsCompany: { label: '物流公司代码', type: 'text', value: '', link: '/company.xlsx', linkText: '公司代码列表' },
          fromRegion: { label: '寄件地区', type: 'text', value: '', tooltip: '模板:广东省广州市黄埔区' },
          toRegion: { label: '收件地区', type: 'text', value: '', tooltip: '模板:广东省广州市黄埔区' },
          senderPhone: { label: '寄件人手机号', type: 'text', value: '', tooltip: '注意事项：\n 1.座机号码：如有分机号，无需传入分机号。\n 2.电商虚拟号码：需传入“-”后的后四位数字。\n 3.手机号验证：建议通过微信小程序验证号码是否正确。\n 例：\n 1.座机 0755-81234567 可传入：075581234567、81234567 或 4567\n 2.电商虚拟号码 13801380000-1234 可传入：1234\n 3.手机号 13801380000 可传入：13801380000 或 8000' }
        },
        onConfirm: async (fields) => {
          try {
            const fd = new FormData()
            fd.append('order_id', order.id)
            fd.append('tracking_number', fields.trackingNumber.value)
            if (fields.logisticsCompany.value) fd.append('logistics_company_code', fields.logisticsCompany.value)
            if (fields.fromRegion.value) fd.append('from_region', fields.fromRegion.value)
            if (fields.toRegion.value) fd.append('to_region', fields.toRegion.value)
            if (fields.senderPhone.value) fd.append('sender_phone', fields.senderPhone.value)
            const res = await updateTrackingNumber(fd)
            if (res && res.success) {
              showToast((res && res.message) || '修改成功')
            } else {
              const msg = (res && (res.data || res.message)) || '修改失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('修改失败')
          }
        }
      })
    }

    const viewAbnormalDetail = (o) => {
      const base = [
        { label: '订单号', value: String(o.order_id || '') },
        { label: '用户名', value: String(o.user_name || '') },
        { label: '手机号', value: String(o.user_phone || '') },
        { label: '错误信息', value: String(o.error_message || '') }
      ]
      const items = Array.isArray(o.order_items) ? o.order_items : []
      const itemLines = items.map((it, idx) => {
        const parts = [
          `母商品名称: ${it.available_product_name || '-'}`,
          `子商品名称: ${it.product_name || '-'}`,
          `单位: ${it.unit || '-'}`,
          `长度: ${it.length != null ? it.length : '-'}`,
          `数量: ${it.quantity != null ? it.quantity : '-'}`,
          `色温: ${it.color_temperature || '-'}`,
          `单价: ${it.unit_price != null ? it.unit_price : '-'}`,
          `小计: ${it.detail_total_price != null ? it.detail_total_price : '-'}`,
          `型号: ${it.model || '-'}`,
          `房间名称: ${it.room_name || '-'}`,
          `备注: ${it.note || ''}`
        ]
        return `明细${idx + 1}: ` + parts.join(' / ')
      })
      const data = [...base]
      if (itemLines.length) {
        itemLines.forEach(line => data.push({ label: '明细', value: line }))
      }
      showModal({ type: 'detail', title: '异常订单详情', data })
    }

    const retrySubscribe = (o) => {
      const statusOptions = [
        { label: '待付款', value: 'PENDING' },
        { label: '待发货', value: 'CONFIRMED' },
        { label: '待收货', value: 'SHIPPED' },
        { label: '已签收', value: 'COMPLETED' },
        { label: '已取消', value: 'CANCELLED' }
      ]
      const fields = {
        status: { label: '状态', type: 'select', value: 'SHIPPED', options: statusOptions, onChange: (e) => {
          const v = e && e.target ? e.target.value : 'SHIPPED'
          const needShip = String(v).toUpperCase() === 'SHIPPED'
          fields.trackingNumber.hidden = !needShip
          fields.logisticsCompany.hidden = !needShip
          fields.fromRegion.hidden = !needShip
          fields.toRegion.hidden = !needShip
          fields.senderPhone.hidden = !needShip
        } },
        trackingNumber: { label: '物流单号', type: 'text', value: '' },
        logisticsCompany: { label: '物流公司代码', type: 'text', value: '', link: '/company.xlsx', linkText: '公司代码列表' },
        fromRegion: { label: '寄件地区', type: 'text', value: '', tooltip: '模板:广东省广州市黄埔区' },
        toRegion: { label: '收件地区', type: 'text', value: '', tooltip: '模板:广东省广州市黄埔区' },
        senderPhone: { label: '寄件人手机号', type: 'text', value: '', tooltip: '1、座机号码：如有分机号，无需传入分机号。\n\n2、电商虚拟号码：需传入“-”后的后四位数字。\n\n3、手机号验证：建议通过微信小程序验证号码是否正确。\n座机 0755-81234567 可传入：075581234567、81234567 或 4567\n手机 13801380000 可传入：13801380000 或 8000\n带分机号的手机 13801380000-1234 可传入：138013800001234 或 1234' }
      }
      // Initialize hidden state for non-SHIPPED default if needed
      const initNeedShip = String(fields.status.value).toUpperCase() === 'SHIPPED'
      fields.trackingNumber.hidden = !initNeedShip
      fields.logisticsCompany.hidden = !initNeedShip
      fields.fromRegion.hidden = !initNeedShip
      fields.toRegion.hidden = !initNeedShip
      fields.senderPhone.hidden = !initNeedShip
      showModal({
        type: 'form',
        title: '异常订单重新订阅',
        fields,
        onConfirm: async (f) => {
          try {
            const fd = new FormData()
            fd.append('order_id', o.order_id)
            const status = f.status.value
            fd.append('status', status)
            if (String(status).toUpperCase() === 'SHIPPED') {
              if (f.trackingNumber.value) fd.append('tracking_number', f.trackingNumber.value)
              if (f.logisticsCompany.value) fd.append('logistics_company_code', f.logisticsCompany.value)
              if (f.fromRegion.value) fd.append('from_region', f.fromRegion.value)
              if (f.toRegion.value) fd.append('to_region', f.toRegion.value)
              if (f.senderPhone.value) fd.append('sender_phone', f.senderPhone.value)
            }
            const res = await subscribeRetry(fd)
            if (res && res.success) {
              showToast((res && res.message) || '重新订阅成功')
            } else {
              const msg = (res && (res.data || res.message)) || '重新订阅失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('重新订阅失败')
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

    watch(activeTab, (val) => {
      if (val === 'abnormal') fetchAbnormalOrders()
    })

      return {
        activeTab,
        filter,
        orders,
        abnormalOrders,
        filteredOrders,
        getStatusClass,
        handleSearch,
        exportOrders,
        shipOrder,
        closeOrder,
        changeTracking,
        editStatus,
        viewAbnormalDetail,
        retrySubscribe
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
