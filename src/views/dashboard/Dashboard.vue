<template>
  <div>
    <div class="page-title">
      <span>仪表盘</span>
      <div class="date-range">2025-12-04</div>
    </div>
    
    <!-- KPI Cards -->
    <div class="grid">
      <div class="card kpi-card" style="grid-column: span 3;">
        <div class="kpi">
          <div class="kpi-header">
            <span class="kpi-label">今日销售额</span>
            <span class="icon-bg">💰</span>
          </div>
          <div class="kpi-value">¥ 12,450.00</div>
          <div class="kpi-trend up">
            <span>↑ 12.5%</span>
            <span class="trend-label">较昨日</span>
          </div>
        </div>
      </div>
      <div class="card kpi-card" style="grid-column: span 3;">
        <div class="kpi">
          <div class="kpi-header">
            <span class="kpi-label">订单数</span>
            <span class="icon-bg">📦</span>
          </div>
          <div class="kpi-value">156</div>
          <div class="kpi-trend up">
            <span>↑ 8.2%</span>
            <span class="trend-label">较昨日</span>
          </div>
        </div>
      </div>
      <div class="card kpi-card" style="grid-column: span 3;">
        <div class="kpi">
          <div class="kpi-header">
            <span class="kpi-label">客单价</span>
            <span class="icon-bg">📊</span>
          </div>
          <div class="kpi-value">¥ 79.80</div>
          <div class="kpi-trend down">
            <span>↓ 2.1%</span>
            <span class="trend-label">较昨日</span>
          </div>
        </div>
      </div>
      <div class="card kpi-card" style="grid-column: span 3;">
        <div class="kpi">
          <div class="kpi-header">
            <span class="kpi-label">新增用户</span>
            <span class="icon-bg">👥</span>
          </div>
          <div class="kpi-value">45</div>
          <div class="kpi-trend up">
            <span>↑ 15.3%</span>
            <span class="trend-label">较昨日</span>
          </div>
        </div>
      </div>

      <!-- Main Chart Area -->
      <div class="card" style="grid-column: span 8; min-height: 400px;">
        <div class="card-header">
          <h3>销售趋势</h3>
          <div class="card-actions">
            <button class="btn-sm" :class="{ active: chartPeriod === '7d' }" @click="chartPeriod = '7d'">近7天</button>
            <button class="btn-sm" :class="{ active: chartPeriod === '30d' }" @click="chartPeriod = '30d'">近30天</button>
          </div>
        </div>
        <div class="chart-placeholder">
          <!-- Simulated Chart Bars -->
          <div class="bar-chart">
            <div class="bar-group" v-for="(h, i) in chartData" :key="i">
              <div class="bar" :style="{ height: h + '%' }"></div>
              <div class="label">12-{{ (i + 1).toString().padStart(2, '0') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Products -->
      <div class="card" style="grid-column: span 4; min-height: 400px;">
        <div class="card-header">
          <h3>热销商品 Top 5</h3>
        </div>
        <div class="product-list">
          <div class="product-item" v-for="(item, i) in topProducts" :key="i">
            <div class="rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</div>
            <div class="product-info">
              <div class="product-name">{{ item.name }}</div>
              <div class="product-sales">{{ item.sales }} 件</div>
            </div>
            <div class="product-price">¥ {{ item.price }}</div>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="card" style="grid-column: span 12;">
        <div class="card-header">
          <h3>最新订单</h3>
          <a href="javascript:;" class="view-all" @click="$router.push('/orders')">查看全部 ></a>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>商品</th>
              <th>金额</th>
              <th>状态</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in recentOrders" :key="order.id">
              <td>{{ order.id }}</td>
              <td>
                <div class="user-cell">
                  <div class="avatar-sm">{{ order.user[0] }}</div>
                  <span>{{ order.user }}</span>
                </div>
              </td>
              <td>{{ order.product }}</td>
              <td>¥ {{ order.amount }}</td>
              <td><span class="badge" :class="order.statusClass">{{ order.status }}</span></td>
              <td>{{ order.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardPage',
  data () {
    return {
      chartPeriod: '7d',
      topProducts: [
        { name: '无线蓝牙耳机 Pro', sales: 1240, price: 299 },
        { name: '智能运动手表 Gen 5', sales: 856, price: 599 },
        { name: '超薄移动电源 10000mAh', sales: 645, price: 99 },
        { name: 'Type-C 快充数据线', sales: 532, price: 29 },
        { name: '人体工学机械键盘', sales: 420, price: 399 }
      ],
      recentOrders: [
        { id: 'ORD-20251204-001', user: 'Alice Smith', product: '无线蓝牙耳机 Pro x 1', amount: '299.00', status: '已支付', statusClass: 'success', time: '10分钟前' },
        { id: 'ORD-20251204-002', user: 'Bob Jones', product: '智能运动手表 Gen 5 x 1', amount: '599.00', status: '待发货', statusClass: 'warning', time: '25分钟前' },
        { id: 'ORD-20251204-003', user: 'Charlie Brown', product: 'Type-C 快充数据线 x 2', amount: '58.00', status: '已完成', statusClass: 'info', time: '1小时前' },
        { id: 'ORD-20251204-004', user: 'David Wilson', product: '人体工学机械键盘 x 1', amount: '399.00', status: '已支付', statusClass: 'success', time: '2小时前' },
        { id: 'ORD-20251204-005', user: 'Eva Davis', product: '超薄移动电源 x 1', amount: '99.00', status: '已取消', statusClass: 'danger', time: '3小时前' }
      ]
    }
  },
  computed: {
    chartData() {
      return this.chartPeriod === '7d' 
        ? [40, 65, 45, 80, 55, 90, 70]
        : [50, 60, 55, 70, 65, 80, 75, 60, 50, 70, 80, 90, 85, 75, 65, 55, 60, 70, 80, 75, 65, 60, 55, 65, 75, 80, 85, 90, 95, 85]
    }
  }
}
</script>

<style lang="scss" scoped>
.date-range {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon-bg {
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.trend-label {
  color: #9ca3af;
  margin-left: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }
}

.card-actions {
  display: flex;
  gap: 8px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
  overflow-x: auto;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 0 20px;
  min-width: 300px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  justify-content: flex-end;
  
  .bar {
    width: 60%;
    background: var(--primary-color);
    border-radius: 4px 4px 0 0;
    transition: height 0.5s ease;
    opacity: 0.8;
    
    &:hover {
      opacity: 1;
      transform: scaleX(1.1);
    }
  }
  
  .label {
    margin-top: 8px;
    font-size: 12px;
    color: #6b7280;
  }
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-item {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
  
  &:last-child {
    border-bottom: none;
  }
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  
  &.rank-1 { background: #fef3c7; color: #d97706; }
  &.rank-2 { background: #f3f4f6; color: #4b5563; }
  &.rank-3 { background: #ffedd5; color: #c2410c; }
}

.product-info {
  flex: 1;
  
  .product-name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 2px;
  }
  
  .product-sales {
    font-size: 12px;
    color: #9ca3af;
  }
}

.product-price {
  font-weight: 600;
  color: #111827;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: 12px 16px;
    color: #6b7280;
    font-size: 12px;
    font-weight: 500;
    background: #f9fafb;
    &:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
    &:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
  }
  
  td {
    padding: 16px;
    font-size: 14px;
    color: #1f2937;
    border-bottom: 1px solid #f3f4f6;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #dbeafe;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.badge {
  padding: 4px 8px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  
  &.success { background: #dcfce7; color: #166534; }
  &.warning { background: #fef9c3; color: #854d0e; }
  &.info { background: #dbeafe; color: #1e40af; }
  &.danger { background: #fee2e2; color: #991b1b; }
}

.view-all {
  font-size: 14px;
  color: var(--primary-color);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

@media (max-width: 768px) {
  .kpi-card {
    grid-column: span 6 !important;
  }
  .card {
    grid-column: span 12 !important;
  }
}
</style>