<template>
  <div>
    <div class="page-title">数据分析</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <select class="form-select" style="width: 150px;">
          <option>最近7天</option>
          <option>最近30天</option>
          <option>本季度</option>
          <option>本年度</option>
        </select>
        <button class="btn-sm primary">生成报表</button>
        <button class="btn-sm" style="margin-left: auto;">导出数据</button>
      </div>
    </div>

    <div class="grid">
      <!-- Sales Trend -->
      <div class="card" style="grid-column: span 8;">
        <div class="card-header">
          <h3>销售趋势</h3>
        </div>
        <div class="chart-container">
          <div class="chart-y-axis">
            <span>10k</span>
            <span>8k</span>
            <span>6k</span>
            <span>4k</span>
            <span>2k</span>
            <span>0</span>
          </div>
          <div class="chart-bars">
            <div v-for="(item, index) in salesTrend" :key="index" class="chart-bar-wrapper">
              <div class="chart-bar" :style="{ height: item.percentage + '%' }">
                <div class="tooltip">¥{{ item.amount }}</div>
              </div>
              <span class="chart-label">{{ item.date }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Distribution -->
      <div class="card" style="grid-column: span 4;">
        <div class="card-header">
          <h3>品类占比</h3>
        </div>
        <div class="pie-chart-sim">
          <div class="pie-legend">
            <div v-for="item in categoryDist" :key="item.name" class="legend-item">
              <span class="dot" :style="{ backgroundColor: item.color }"></span>
              <span class="name">{{ item.name }}</span>
              <span class="value">{{ item.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Products -->
      <div class="card" style="grid-column: span 6;">
        <div class="card-header">
          <h3>商品销量排行</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th width="60">排名</th>
              <th>商品名称</th>
              <th>销量</th>
              <th>销售额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(product, index) in topProducts" :key="product.id">
              <td>
                <div class="rank-badge" :class="{ 'top-3': index < 3 }">{{ index + 1 }}</div>
              </td>
              <td>{{ product.name }}</td>
              <td>{{ product.sales }}</td>
              <td>¥{{ product.revenue }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- User Growth -->
      <div class="card" style="grid-column: span 6;">
        <div class="card-header">
          <h3>用户增长</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>新增用户</th>
              <th>活跃用户</th>
              <th>付费用户</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stat in userStats" :key="stat.date">
              <td>{{ stat.date }}</td>
              <td>{{ stat.newUsers }}</td>
              <td>{{ stat.activeUsers }}</td>
              <td>{{ stat.paidUsers }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnalyticsPage',
  data() {
    return {
      salesTrend: [
        { date: '12-01', amount: 4500, percentage: 45 },
        { date: '12-02', amount: 6200, percentage: 62 },
        { date: '12-03', amount: 5800, percentage: 58 },
        { date: '12-04', amount: 8900, percentage: 89 },
        { date: '12-05', amount: 7100, percentage: 71 },
        { date: '12-06', amount: 6500, percentage: 65 },
        { date: '12-07', amount: 9200, percentage: 92 }
      ],
      categoryDist: [
        { name: '电子产品', percentage: 40, color: '#2563eb' },
        { name: '服装服饰', percentage: 25, color: '#10B981' },
        { name: '家居生活', percentage: 20, color: '#F59E0B' },
        { name: '其他', percentage: 15, color: '#9CA3AF' }
      ],
      topProducts: [
        { id: 1, name: '无线蓝牙耳机 Pro', sales: 128, revenue: '38,272' },
        { id: 2, name: '智能运动手表', sales: 96, revenue: '28,704' },
        { id: 3, name: '机械键盘 K8', sales: 85, revenue: '25,415' },
        { id: 4, name: 'Type-C 数据线', sales: 342, revenue: '6,840' },
        { id: 5, name: '手机支架', sales: 210, revenue: '4,200' }
      ],
      userStats: [
        { date: '2025-12-07', newUsers: 145, activeUsers: 2300, paidUsers: 89 },
        { date: '2025-12-06', newUsers: 132, activeUsers: 2150, paidUsers: 76 },
        { date: '2025-12-05', newUsers: 128, activeUsers: 2200, paidUsers: 82 },
        { date: '2025-12-04', newUsers: 156, activeUsers: 2450, paidUsers: 95 },
        { date: '2025-12-03', newUsers: 118, activeUsers: 2100, paidUsers: 68 }
      ]
    }
  }
}
</script>

<style scoped>
.chart-container {
  height: 240px;
  display: flex;
  position: relative;
  padding-left: 40px;
}

.chart-y-axis {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}

.chart-bars {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0;
}

.chart-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  height: 100%;
  justify-content: flex-end;
  position: relative;
}

.chart-bar {
  width: 24px;
  background-color: var(--primary-color);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  position: relative;
}

.chart-bar:hover .tooltip {
  display: block;
}

.tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  margin-bottom: 4px;
  z-index: 10;
}

.chart-label {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.pie-chart-sim {
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-legend {
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 6px;
  background-color: #f9fafb;
}

.legend-item .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 12px;
}

.legend-item .name {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.legend-item .value {
  font-weight: 600;
  color: #111827;
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.rank-badge.top-3 {
  background-color: #FEF3C7;
  color: #D97706;
}

/* Grid adjustments for analytics */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}
</style>
