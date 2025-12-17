<template>
  <div class="order-detail">
    <div class="page-header">
      <div class="title-row">
        <h2 class="page-title">订单详情</h2>
        <button class="btn-sm" @click="$router.back()">返回列表</button>
      </div>
    </div>

    <!-- 状态步骤条 -->
        <div class="card mb-4">
          <div class="steps">
            <div class="step" :class="{ active: isStepActive(1) }">
              <div class="step-icon">1</div>
              <div class="step-title">提交订单</div>
              <div class="step-time">{{ order.created_at || '—' }}</div>
            </div>
            <div class="step" :class="{ active: isStepActive(2) }">
              <div class="step-icon">2</div>
              <div class="step-title">完成支付</div>
              <div class="step-time">{{ '—' }}</div>
            </div>
            <div class="step" :class="{ active: isStepActive(3) }">
              <div class="step-icon">3</div>
              <div class="step-title">商家发货</div>
              <div class="step-time">{{ order.tracking_number ? '—' : '—' }}</div>
            </div>
            <div class="step" :class="{ active: isStepActive(4) }">
              <div class="step-icon">4</div>
              <div class="step-title">确认收货</div>
              <div class="step-time">{{ '—' }}</div>
            </div>
          </div>
        </div>

    <div class="detail-grid">
      <!-- 左侧：订单信息 -->
      <div class="left-col">
        <div class="card mb-4">
          <div class="card-header">
            <h3>基本信息</h3>
            <span class="badge" :class="statusClass">{{ statusText }}</span>
          </div>
          <div class="info-list">
            <div class="info-item">
              <span class="label">订单编号：</span>
              <span class="value">{{ order.order_id }}</span>
            </div>
            <div class="info-item">
              <span class="label">下单时间：</span>
              <span class="value">{{ order.created_at }}</span>
            </div>
            <div class="info-item">
              <span class="label">用户ID：</span>
              <span class="value">{{ order.user_id }}</span>
            </div>
            <div class="info-item">
              <span class="label">收货地址：</span>
              <span class="value">{{ order.address_id }}</span>
            </div>
            <div class="info-item">
              <span class="label">运单号：</span>
              <span class="value">{{ order.tracking_number || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="label">物流公司：</span>
              <span class="value">{{ order.logistics_company || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="label">备注：</span>
              <span class="value">{{ order.note || '' }}</span>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <h3>收货人信息</h3>
            <!-- <button class="btn-link">修改</button> -->
          </div>
          <div class="info-list">
            <div class="info-item">
              <span class="label">收货人：</span>
              <span class="value">{{ order.user_id }}</span>
            </div>
            <!-- <div class="info-item">
              <span class="label">联系电话：</span>
              <span class="value">138****1234</span>
            </div> -->
            <div class="info-item">
              <span class="label">收货地址：</span>
              <span class="value">{{ order.address_id }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：商品信息 & 费用 -->
      <div class="right-col">
        <div class="card mb-4">
          <div class="card-header">
            <h3>商品信息</h3>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>房间</th>
                <th>色温</th>
                <th>长度</th>
                <th>数量</th>
                <th>单位价格</th>
                <th>备注</th>
                <th>小计</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in orderItems" :key="item.id">
                <td>{{ item.room_name }}</td>
                <td>{{ item.color_temperature }}</td>
                <td>{{ item.length }}</td>
                <td>{{ item.quantity }}</td>
                <td>¥ {{ Number(item.unit_price || 0).toFixed(2) }}</td>
                <td>{{ item.note }}</td>
                <td>¥ {{ (Number(item.unit_price || 0) * Number(item.quantity || 0)).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="order-total">
            <div class="total-row">
              <span class="label">商品总额：</span>
              <span class="value">¥ {{ itemsTotal.toFixed(2) }}</span>
            </div>
            <div class="total-row">
              <span class="label">运费：</span>
              <span class="value">+ ¥ 0.00</span>
            </div>
            <div class="total-row">
              <span class="label">优惠：</span>
              <span class="value">- ¥ 0.00</span>
            </div>
            <div class="total-row grand-total">
              <span class="label">实付款：</span>
              <span class="value">¥ {{ Number(order.total_amount || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <h3>物流信息</h3>
          </div>
          <div class="info-list">
            <div class="info-item">
              <span class="label">物流状态：</span>
              <span class="value">{{ (order.logistics_data && order.logistics_data.status) || '—' }} {{ (order.logistics_data && order.logistics_data.message) ? '(' + order.logistics_data.message + ')' : '' }}</span>
            </div>
            <div class="info-item">
              <span class="label">揽收状态：</span>
              <span class="value">{{ (order.logistics_data && order.logistics_data.billstatus) || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="label">公司代码：</span>
              <span class="value">{{ ((order.logistics_data && order.logistics_data.lastResult && order.logistics_data.lastResult.com) || order.logistics_company || '—') }}</span>
            </div>
            <div class="info-item">
              <span class="label">运单号：</span>
              <span class="value">{{ ((order.logistics_data && order.logistics_data.lastResult && order.logistics_data.lastResult.nu) || order.tracking_number || '—') }}</span>
            </div>
            <div class="info-item" v-if="order.logistics_data && order.logistics_data.lastResult && order.logistics_data.lastResult.trailUrl">
              <span class="label">轨迹地图：</span>
              <span class="value"><a :href="order.logistics_data.lastResult.trailUrl" target="_blank">{{ order.logistics_data.lastResult.trailUrl }}</a></span>
            </div>
            <div class="info-item" v-if="order.logistics_data && order.logistics_data.lastResult && order.logistics_data.lastResult.routeInfo && order.logistics_data.lastResult.routeInfo.to">
              <span class="label">目的地：</span>
              <span class="value">{{ order.logistics_data.lastResult.routeInfo.to.name }} ({{ order.logistics_data.lastResult.routeInfo.to.number }})</span>
            </div>
            <div class="info-item" v-if="order.logistics_data && order.logistics_data.lastResult && order.logistics_data.lastResult.routeInfo && order.logistics_data.lastResult.routeInfo.cur">
              <span class="label">当前：</span>
              <span class="value">{{ order.logistics_data.lastResult.routeInfo.cur.name }} ({{ order.logistics_data.lastResult.routeInfo.cur.number }})</span>
            </div>
            <div class="info-item" v-if="order.logistics_data && order.logistics_data.lastResult && order.logistics_data.lastResult.routeInfo && order.logistics_data.lastResult.routeInfo.from">
              <span class="label">始发地：</span>
              <span class="value">{{ order.logistics_data.lastResult.routeInfo.from.name }} ({{ order.logistics_data.lastResult.routeInfo.from.number }})</span>
            </div>
            <div class="info-item" v-if="order.logistics_data && order.logistics_data.lastResult && (order.logistics_data.lastResult.totalTime || order.logistics_data.lastResult.remainTime || order.logistics_data.lastResult.arrivalTime)">
              <span class="label">时效：</span>
              <span class="value">总时长 {{ order.logistics_data.lastResult.totalTime || '—' }}；剩余 {{ order.logistics_data.lastResult.remainTime || '—' }}；预计到达 {{ order.logistics_data.lastResult.arrivalTime || '—' }}</span>
            </div>
          </div>
          <div class="card-header" style="margin-top: 8px;">
            <h3>物流轨迹</h3>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>状态</th>
                <th>详情</th>
                <th>地区</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(log, idx) in ((order.logistics_data && order.logistics_data.lastResult && order.logistics_data.lastResult.data) || [])" :key="idx">
                <td>{{ log.ftime || log.time }}</td>
                <td>{{ log.status }}</td>
                <td style="white-space: normal; text-align: left;">{{ log.context }}</td>
                <td>{{ log.areaName }}</td>
              </tr>
              <tr v-if="!(order.logistics_data && order.logistics_data.lastResult && order.logistics_data.lastResult.data && order.logistics_data.lastResult.data.length)">
                <td colspan="4" style="text-align: center; color: #999;">暂无轨迹数据</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>操作记录</h3>
          </div>
          <ul class="timeline">
            <li class="timeline-item" v-for="(rec, idx) in operationRecords" :key="idx">
              <div class="time">{{ rec.time || '—' }}</div>
              <div class="content">{{ rec.text }}</div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <!-- <div class="action-footer">
      <button class="btn-sm">打印订单</button>
      <button class="btn-sm">修改备注</button>
      <button class="btn-sm primary">发货</button>
    </div> -->
  </div>
</template>

<script>
import { listAdminOrdersDetail } from '@/api/order.js'

export default {
  name: 'OrderDetail',
  data () {
    return {
      order: {
        order_id: '',
        user_id: '',
        address_id: '',
        total_amount: 0,
        status: '',
        tracking_number: '',
        logistics_company: '',
        note: '',
        created_at: ''
      },
      orderItems: [],
      operationRecords: []
    }
  },
  computed: {
    itemsTotal () {
      return this.orderItems.reduce((sum, it) => sum + (Number(it.unit_price || 0) * Number(it.quantity || 0)), 0)
    },
    statusText () {
      const k = String(this.order.status || '').toUpperCase()
      const map = { PENDING: '待付款', CONFIRMED: '待发货', SHIPPED: '待收货', COMPLETED: '已收货', CANCELLED: '已取消' }
      return map[k] || this.order.status
    },
    statusClass () {
      const t = this.statusText
      const map = { '待付款': 'warning', '待发货': 'info', '待收货': 'primary', '已收货': 'success', '已取消': 'gray' }
      return map[t] || 'gray'
    }
  },
  methods: {
    isStepActive (idx) {
      const k = String(this.order.status || '').toUpperCase()
      const countMap = { PENDING: 1, CONFIRMED: 2, SHIPPED: 3, COMPLETED: 4, CANCELLED: 1 }
      const cnt = countMap[k] || 1
      return idx <= cnt
    }
  },
  mounted: async function () {
    const id = this.$route && this.$route.params && this.$route.params.id
    try {
      const res = await listAdminOrdersDetail({ order_id: id, page: 1, page_size: 20, sort_by: 'price', sort_order: 'desc' })
      let o = {}
      let items = []
      if (res && res.data && res.data.order) {
        o = res.data.order
        items = res.data.items || []
      } else {
        const arr = (res && res.data && Array.isArray(res.data.orders)) ? res.data.orders : []
        const found = arr.find(e => e.order && e.order.order_id === id) || arr[0]
        o = (found && found.order) || {}
        items = (found && Array.isArray(found.items)) ? found.items : []
      }
      this.order = {
        order_id: o.order_id || '',
        user_id: o.user_id || '',
        address_id: o.address_id || '',
        total_amount: o.total_amount || 0,
        status: o.status || '',
        tracking_number: o.tracking_number || '',
        logistics_company: o.logistics_company || '',
        logistics_data: o.logistics_data || null,
        note: o.note || '',
        created_at: o.created_at ? String(o.created_at).replace('T', ' ').split('.')[0] : ''
      }
      this.orderItems = items
      this.operationRecords = [
        { time: this.order.created_at, text: '用户提交订单' },
        ...(String(this.order.status || '').toUpperCase() !== 'PENDING' ? [{ time: '', text: '用户完成支付' }] : []),
        ...(String(this.order.status || '').toUpperCase() === 'SHIPPED' || String(this.order.status || '').toUpperCase() === 'COMPLETED' ? [{ time: '', text: '商家发货' }] : []),
        ...(String(this.order.status || '').toUpperCase() === 'COMPLETED' ? [{ time: '', text: '用户确认收货' }] : []),
        ...(String(this.order.status || '').toUpperCase() === 'CANCELLED' ? [{ time: '', text: '订单已取消' }] : [])
      ]
    } catch (e) {
      // silent
    }
  }
}
</script>

<style scoped lang="scss">
.order-detail {
  padding-bottom: 60px;
}

.page-header {
  margin-bottom: 20px;
  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.mb-4 {
  margin-bottom: 20px;
}

/* Steps */
.steps {
  display: flex;
  justify-content: space-between;
  padding: 20px 40px;
  
  .step {
    flex: 1;
    text-align: center;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      top: 15px;
      left: 50%;
      width: 100%;
      height: 2px;
      background: #eee;
      z-index: 0;
    }
    
    &:last-child::after {
      display: none;
    }
    
    &.active {
      .step-icon {
        background: #1890ff;
        color: white;
        border-color: #1890ff;
      }
      .step-title {
        color: #333;
        font-weight: 500;
      }
      &::after {
        background: #1890ff;
      }
    }

    .step-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #ddd;
      color: #999;
      line-height: 28px;
      margin: 0 auto 10px;
      position: relative;
      z-index: 1;
      font-weight: bold;
    }
    
    .step-title {
      font-size: 14px;
      color: #999;
      margin-bottom: 5px;
    }
    
    .step-time {
      font-size: 12px;
      color: #999;
    }
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
}

.info-list {
  .info-item {
    display: flex;
    margin-bottom: 12px;
    font-size: 14px;
    
    .label {
      color: #666;
      width: 80px;
      flex-shrink: 0;
    }
    
    .value {
      color: #333;
    }
  }
}

.product-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  
  .product-img-placeholder {
    width: 40px;
    height: 40px;
    background: #f0f2f5;
    border-radius: 4px;
    margin-right: 10px;
  }
  
  .name {
    font-size: 14px;
    color: #333;
  }
  
  .sku {
    font-size: 12px;
    color: #999;
  }
}

.data-table th, .data-table td {
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
}

.order-total {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  
  .total-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
    font-size: 14px;
    
    .label {
      color: #666;
      margin-right: 10px;
    }
    
    .value {
      color: #333;
      width: 100px;
      text-align: right;
    }
    
    &.grand-total {
      font-weight: bold;
      font-size: 16px;
      margin-top: 10px;
      
      .value {
        color: #f5222d;
      }
    }
  }
}

.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  
  .timeline-item {
    position: relative;
    padding-left: 20px;
    padding-bottom: 20px;
    border-left: 2px solid #f0f0f0;
    
    &::before {
      content: '';
      position: absolute;
      left: -5px;
      top: 0;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #1890ff;
    }
    
    &:last-child {
      border-left: none;
    }
    
    .time {
      font-size: 12px;
      color: #999;
      margin-bottom: 4px;
    }
    
    .content {
      font-size: 14px;
      color: #333;
    }
  }
}

.action-footer {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 250px; /* Sidebar width */
  background: #fff;
  padding: 15px 30px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  z-index: 10;
}
</style>
