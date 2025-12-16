<template>
  <div>
    <div class="page-title">交易统计</div>
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <div class="tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'mother' }]" 
            @click="activeTab = 'mother'"
          >
            母商品销量
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'child' }]" 
            @click="activeTab = 'child'"
          >
            子商品销量
          </button>
        </div>
      </div>
      <div class="filter-bar" style="margin-top: 16px;">
        <input 
          type="text" 
          class="form-input" 
          v-model="queryId" 
          :placeholder="activeTab === 'mother' ? 'aprodXXXXXXXXXXXX' : 'productXXXXXXXXXXXX'" 
        />
        <input type="date" class="form-input" v-model="start" />
        <span class="separator">-</span>
        <input type="date" class="form-input" v-model="end" />
        <select class="form-select" v-model="sortType">
          <option value="销量">销量</option>
          <option value="金额">金额</option>
        </select>
        <button class="btn-sm primary" @click="fetchStats">查询</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>统计结果</h3>
      </div>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-title">时间范围</div>
          <div class="stat-value">{{ start }} 至 {{ end }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">{{ activeTab === 'mother' ? '母商品ID' : '子商品ID' }}</div>
          <div class="stat-value">{{ queryId || '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">总销量</div>
          <div class="stat-value">{{ result.total_sales_volume || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">总金额</div>
          <div class="stat-value">{{ result.total_sales_amount || 0 }}</div>
        </div>
      </div>
      <div style="padding: 16px;">
        <table class="data-table" v-if="activeTab === 'mother'">
          <thead>
            <tr>
              <th>母商品ID</th>
              <th>母商品名称</th>
              <th>总销量</th>
              <th>总金额</th>
              <th>Top3子商品</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in (result.items || [])" :key="it.available_product_id">
              <td>{{ it.available_product_id }}</td>
              <td>{{ it.available_product_name }}</td>
              <td>{{ it.total_sales_volume }}</td>
              <td>{{ it.total_sales_amount }}</td>
              <td>
                <div v-for="c in (it.top3_children || [])" :key="c.product_id" class="child-line">
                  <span class="mono">{{ c.product_id }}</span>
                  <span> - {{ c.product_name }}</span>
                  <span> / 销量: {{ c.sales_volume }}</span>
                  <span> / 金额: {{ c.sales_amount }}</span>
                </div>
              </td>
            </tr>
            <tr v-if="!(result.items && result.items.length)">
              <td colspan="5" style="text-align:center;color:#999;">暂无数据</td>
            </tr>
          </tbody>
        </table>

        <table class="data-table" v-else>
          <thead>
            <tr>
              <th>子商品ID</th>
              <th>母商品名称</th>
              <th>子商品名称</th>
              <th>总销量</th>
              <th>总金额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in (result.items || [])" :key="it.product_id">
              <td>{{ it.product_id }}</td>
              <td>{{ it.available_product_name }}</td>
              <td>{{ it.product_name }}</td>
              <td>{{ it.total_sales_volume }}</td>
              <td>{{ it.total_sales_amount }}</td>
            </tr>
            <tr v-if="!(result.items && result.items.length)">
              <td colspan="5" style="text-align:center;color:#999;">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, ref, watch, onMounted } from 'vue'
import { getAvailableProductSalesStats, getProductSalesStats } from '@/api/stats'

export default {
  name: 'TransactionStats',
  setup() {
    const showToast = inject('showToast')
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const now = new Date()
    const endDefault = fmt(now)
    const startDefault = fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7))
    
    const activeTab = ref('mother')
    const queryId = ref('')
    const start = ref(startDefault)
    const end = ref(endDefault)
    const sortType = ref('金额')
    const result = ref({})

    const fetchStats = async () => {
      try {
        let res
        if (activeTab.value === 'mother') {
          res = await getAvailableProductSalesStats({ available_product_id: queryId.value, start_time: start.value, end_time: end.value, sort_type: sortType.value })
        } else {
          res = await getProductSalesStats({ product_id: queryId.value, start_time: start.value, end_time: end.value, sort_type: sortType.value })
        }
        if (res && res.success) {
          result.value = (res && res.data) || {}
          showToast('查询成功')
        } else {
          result.value = {}
          const msg = (res && (res.data || res.message)) || '获取统计失败'
          showToast(String(msg))
        }
      } catch (e) {
        result.value = {}
        showToast('获取统计失败')
      }
    }

    const applyFilters = () => {}

    watch(activeTab, () => {
      queryId.value = ''
      result.value = {}
      fetchStats()
    })

    onMounted(() => {
      fetchStats()
    })

    return { activeTab, queryId, start, end, sortType, result, fetchStats, applyFilters }
  }
}
</script>

<style scoped>
.filter-bar { display: flex; gap: 8px; align-items: center; }
.separator { padding: 0 4px; }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 16px; }
.stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
.stat-title { font-size: 13px; color: #6b7280; }
.stat-value { font-size: 18px; font-weight: 600; color: #111827; margin-top: 6px; }

.tabs {
  display: flex;
  gap: 16px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
  width: 100%;
}
.tab-btn {
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  padding: 8px 16px;
  border-bottom: 2px solid transparent;
}
.tab-btn.active {
  color: var(--primary-color, #2563eb);
  border-bottom-color: var(--primary-color, #2563eb);
}
.data-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.data-table th { background: #f9fafb; padding: 12px 16px; text-align: center; font-weight: 500; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
.data-table td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; text-align: left; }
.child-line { font-size: 12px; color: #374151; line-height: 1.6; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; color: #6b7280; }
</style>
