<template>
  <div>
    <div class="page-title">价格策略</div>

    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="策略ID/关键词" v-model="filter.keyword" />
        <button class="btn-sm primary" @click="loadStrategies">查询</button>
        <button class="btn-sm" @click="addStrategy">新增策略</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>策略列表</h3>
        <button class="btn-sm" @click="loadStrategies">刷新</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>策略ID</th>
            <th>名称</th>
            <th>类型</th>
            <th>状态</th>
            <th width="200">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in strategies" :key="s.strategy_id || s.id">
            <td>{{ s.strategy_id || s.id }}</td>
            <td>{{ s.name || '-' }}</td>
            <td>{{ s.type || '-' }}</td>
            <td>
              <span class="badge" :class="String(s.status)==='1'?'success':'gray'">{{ String(s.status)==='1'?'启用':'停用' }}</span>
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="viewStrategy(s)">详情</button>
                <button class="btn-link" @click="updateStrategy(s)">编辑</button>
                <!-- <button class="btn-link danger" @click="resetStrategy(s)">重置</button> -->
                <button class="btn-link danger" @click="removeStrategy(s)">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="!strategies.length">
            <td colspan="5" style="color:#6b7280;">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import { listPriceStrategies, createPriceStrategy, updatePriceStrategy, resetPriceStrategy, deletePriceStrategy } from '@/api/prices'

const showModal = inject('showModal')
const showToast = inject('showToast')

const filter = ref({ keyword: '' })
const strategies = ref([])

const loadStrategies = async () => {
  try {
    const res = await listPriceStrategies({ strategy_id: filter.value.keyword || '', page: 1, page_size: 20, sort_by: '', sort_order: 'desc' })
    if (res && res.success && res.data && Array.isArray(res.data.items)) {
      strategies.value = res.data.items
    } else {
      strategies.value = []
    }
  } catch (e) {
    strategies.value = []
    showToast('获取价格策略失败')
  }
}

const viewStrategy = (s) => {
  const rows = []
  const toStr = v => v===null||v===undefined?'':(typeof v==='object'?JSON.stringify(v):String(v))
  const keyMap = {
    strategy_id: '策略ID',
    id: 'ID',
    name: '名称',
    type: '类型',
    status: '状态',
    description: '描述',
    created_at: '创建时间',
    updated_at: '更新时间',
    payload: '参数配置',
    formula:'公式',
    last_operator_id:'最后操作id'
  }
  Object.keys(s||{}).forEach(k => {
    const label = keyMap[k] || k
    rows.push({ label: label, value: toStr(s[k]) })
  })
  showModal({ type: 'detail', title: '策略详情', data: rows })
}

const addStrategy = () => {
  showModal({
    type: 'form',
    title: '新增价格策略',
    fields: {
      payload: { label: '参数(JSON)', type: 'text', value: '{}' }
    },
    onConfirm: async (fields) => {
      try {
        let body
        try { body = JSON.parse(fields.payload.value || '{}') } catch { body = {} }
        const res = await createPriceStrategy(body)
        if (res && res.success) {
          showToast(res.message || '创建成功')
          await loadStrategies()
        } else {
          showToast('创建失败')
        }
      } catch (e) { showToast('请求失败') }
    }
  })
}

const updateStrategy = (s) => {
  showModal({
    type: 'form',
    title: '更新价格策略',
    fields: {
      strategy_id: { label: '策略ID', type: 'text', value: s.strategy_id || s.id || '' },
      payload: { label: '参数(JSON)', type: 'text', value: '{}' }
    },
    onConfirm: async (fields) => {
      try {
        let body
        try { body = JSON.parse(fields.payload.value || '{}') } catch { body = {} }
        body.strategy_id = fields.strategy_id.value
        const res = await updatePriceStrategy(body)
        if (res && res.success) { showToast(res.message || '更新成功'); await loadStrategies() } else { showToast('更新失败') }
      } catch (e) { showToast('请求失败') }
    }
  })
}

const resetStrategy = async (s) => {
  try {
    const res = await resetPriceStrategy({ strategy_id: s.strategy_id || s.id })
    if (res && res.success) { showToast(res.message || '重置成功'); await loadStrategies() } else { showToast('重置失败') }
  } catch (e) { showToast('请求失败') }
}

const removeStrategy = (s) => {
  showModal({
    type: 'confirm',
    title: '删除价格策略',
    message: '确定删除该策略吗？',
    onConfirm: async () => {
      try {
        const fd = new FormData()
        fd.append('strategy_id', s.strategy_id || s.id)
        const res = await deletePriceStrategy(fd)
        const msg = (res && res.message) || '删除成功'
        showToast(msg)
        await loadStrategies()
      } catch (e) {
        showToast('删除失败')
      }
    }
  })
}

onMounted(() => { loadStrategies() })
</script>

<style scoped>
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.data-table th {
  background: #f9fafb;
  padding: 12px 16px;
  text-align: center;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}
.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  text-align: center;
  white-space: nowrap;
}
.data-table tr:hover td {
  background-color: #f9fafb;
}
.actions { display: flex; gap: 8px; justify-content: center; }
.btn-link {
  padding: 0;
  border: none;
  background: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 14px;
}
.btn-link:hover {
  text-decoration: underline;
}
</style>
