<template>
  <div>
    <div class="page-title">优惠券管理</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="优惠券名称" v-model="filter.keyword" />
        <select class="form-select" v-model="filter.type">
          <option value="">优惠券类型</option>
          <option value="cash">满减券</option>
          <option value="discount">折扣券</option>
        </select>
        <select class="form-select" v-model="filter.status">
          <option value="">状态</option>
          <option value="active">进行中</option>
          <option value="ended">已结束</option>
        </select>
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm primary" style="margin-left: auto;" @click="createCoupon">新建优惠券</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>优惠券名称</th>
            <th>面值/折扣</th>
            <th>使用门槛</th>
            <th>有效期</th>
            <th>发行量</th>
            <th>已领取</th>
            <th>已使用</th>
            <th>状态</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="coupon in coupons" :key="coupon.id">
            <td>
              <div class="coupon-name">{{ coupon.name }}</div>
              <div class="coupon-type">{{ coupon.typeText }}</div>
            </td>
            <td class="value">{{ coupon.value }}</td>
            <td>{{ coupon.condition }}</td>
            <td>
              <div class="time-range">
                <div>{{ coupon.startTime }}</div>
                <div class="separator">至</div>
                <div>{{ coupon.endTime }}</div>
              </div>
            </td>
            <td>{{ coupon.total }}</td>
            <td>{{ coupon.received }}</td>
            <td>{{ coupon.used }}</td>
            <td>
              <span class="badge" :class="getStatusClass(coupon.status)">{{ coupon.status }}</span>
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="editCoupon(coupon)">编辑</button>
                <button class="btn-link" @click="viewData(coupon)">数据</button>
                <button class="btn-link danger" v-if="coupon.status === '进行中'" @click="stopCoupon(coupon)">停止</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 12 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" disabled>上一页</button>
          <button class="btn-sm active">1</button>
          <button class="btn-sm">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'

const showModal = inject('showModal')
const showToast = inject('showToast')
const confirmDialog = inject('confirmDialog')

const filter = ref({
  keyword: '',
  type: '',
  status: ''
})

const coupons = ref([
  { id: 1, name: '新人专享礼券', typeText: '满减券', value: '¥ 50', condition: '满 299 可用', startTime: '2025-01-01', endTime: '2025-12-31', total: 10000, received: 5230, used: 1200, status: '进行中' },
  { id: 2, name: '618大促折扣券', typeText: '折扣券', value: '8.5 折', condition: '无门槛', startTime: '2025-06-01', endTime: '2025-06-20', total: 5000, received: 5000, used: 4800, status: '已结束' },
  { id: 3, name: '数码品类券', typeText: '满减券', value: '¥ 100', condition: '满 999 可用', startTime: '2025-12-01', endTime: '2025-12-12', total: 2000, received: 150, used: 10, status: '进行中' },
  { id: 4, name: '会员生日礼', typeText: '满减券', value: '¥ 20', condition: '无门槛', startTime: '2025-01-01', endTime: '2025-12-31', total: '不限', received: 850, used: 600, status: '进行中' }
])

const getStatusClass = (status) => {
  if (status === '进行中') return 'success'
  if (status === '已结束') return 'gray'
  return 'info'
}

const handleSearch = () => {
  showToast('搜索已更新')
}

const createCoupon = () => {
  showModal({
    title: '新建优惠券',
    content: `
      <div class="form-group">
        <label>优惠券名称</label>
        <input type="text" class="form-input" placeholder="请输入优惠券名称">
      </div>
      <div class="form-group">
        <label>优惠券类型</label>
        <select class="form-select">
          <option>满减券</option>
          <option>折扣券</option>
        </select>
      </div>
      <div class="form-group">
        <label>面值/折扣</label>
        <input type="text" class="form-input" placeholder="请输入面值或折扣">
      </div>
      <div class="form-group">
        <label>使用门槛</label>
        <input type="text" class="form-input" placeholder="满多少可用">
      </div>
      <div class="form-group">
        <label>有效期</label>
        <div style="display: flex; gap: 10px;">
          <input type="date" class="form-input">
          <span style="line-height: 32px;">至</span>
          <input type="date" class="form-input">
        </div>
      </div>
      <div class="form-group">
        <label>发行量</label>
        <input type="number" class="form-input" placeholder="请输入发行数量">
      </div>
    `,
    width: '600px',
    onConfirm: () => {
      showToast('优惠券创建成功')
    }
  })
}

const editCoupon = (coupon) => {
  showModal({
    title: '编辑优惠券',
    content: `
      <div class="form-group">
        <label>优惠券名称</label>
        <input type="text" class="form-input" value="${coupon.name}">
      </div>
      <div class="form-group">
        <label>发行量</label>
        <input type="number" class="form-input" value="${coupon.total === '不限' ? '' : coupon.total}" placeholder="请输入发行数量">
      </div>
    `,
    onConfirm: () => {
      showToast('优惠券信息已更新')
    }
  })
}

const viewData = (coupon) => {
  showModal({
    title: '优惠券数据',
    content: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; margin-bottom: 20px;">
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
          <div style="font-size: 12px; color: #666;">领取率</div>
          <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">
            ${coupon.total === '不限' ? 'N/A' : Math.round(coupon.received / coupon.total * 100) + '%'}
          </div>
        </div>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
          <div style="font-size: 12px; color: #666;">使用率</div>
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">
            ${Math.round(coupon.used / coupon.received * 100)}%
          </div>
        </div>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
          <div style="font-size: 12px; color: #666;">带动销售</div>
          <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">¥ ${(coupon.used * 200).toLocaleString()}</div>
        </div>
      </div>
    `,
    onConfirm: () => {}
  })
}

const stopCoupon = (coupon) => {
  confirmDialog({
    title: '确认停止',
    content: `确定要停止发放优惠券 "${coupon.name}" 吗？已领取的优惠券仍可使用。`,
    onConfirm: () => {
      showToast('优惠券已停止发放')
    }
  })
}
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  gap: 12px;
}
.form-input, .form-select {
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: var(--primary-color); }
}
.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  &.primary {
    background: var(--primary-color);
    color: #fff;
    &:hover { opacity: 0.9; }
  }
  &.active {
    background: var(--primary-color);
    color: #fff;
  }
  &:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }
}
.btn-link {
  border: none;
  background: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 13px;
  margin-right: 8px;
  padding: 0;
  &:hover { text-decoration: underline; }
  &.danger { color: #ef4444; }
}

.coupon-name {
  font-weight: 500;
  color: #333;
}

.coupon-type {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.value {
  color: #f5222d;
  font-weight: bold;
}

.time-range {
  font-size: 12px;
  color: #666;
  
  .separator {
    color: #ccc;
    margin: 2px 0;
    text-align: center;
  }
}
</style>