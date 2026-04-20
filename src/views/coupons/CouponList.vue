<!--
  模块: 优惠券管理页
  作用: 管理端优惠券的查询、创建、编辑、状态更新与删除，以及发放记录查询
-->
<template>
  <div>
    <div class="page-title">优惠券管理</div>

    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <button class="btn-sm primary" @click="addCoupon">新增优惠券</button>
        <button class="btn-sm" @click="loadCoupons">刷新列表</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>优惠券列表</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>优惠券名称</th>
            <th>总金额</th>
            <th>抵扣方式</th>
            <th>使用门槛</th>
            <th>有效期</th>
            <th>发放方式</th>
            <th>状态</th>
            <th>创建时间</th>
            <th width="200">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in coupons" :key="c.coupon_id">
            <td>{{ c.name || '-' }}</td>
            <td>¥{{ c.total_amount?.toFixed(2) || '0.00' }}</td>
            <td>
              {{ c.rule?.discount_type === 1 ? '按比例 ' + c.rule?.discount_value + '%' : '按金额 ¥' + c.rule?.discount_value }}
            </td>
            <td>{{ c.rule?.min_order_amount > 0 ? '满 ¥' + c.rule?.min_order_amount : '无门槛' }}</td>
            <td>
              <div v-if="c.rule?.valid_type === 1">
                {{ formatDate(c.rule?.valid_start_time) }}<br/>至<br/>{{ formatDate(c.rule?.valid_end_time) }}
              </div>
              <div v-else>
                领取后 {{ c.rule?.valid_days }} 天有效
              </div>
            </td>
            <td>
              {{ c.rule?.trigger_type === 1 ? '新用户注册' : '定时发放' }}
              <div v-if="c.rule?.trigger_type === 2 && c.rule?.trigger_time" style="font-size: 12px; color: #6b7280;">
                {{ formatDate(c.rule?.trigger_time) }}
              </div>
            </td>
            <td>
              <span class="badge" :class="String(c.status)==='1'?'success':'gray'">{{ String(c.status)==='1'?'启用':'停用' }}</span>
            </td>
            <td>{{ formatDate(c.created_at) }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="viewCouponRecords(c)">领取记录</button>
                <button class="btn-link" @click="updateCouponBtn(c)">编辑</button>
                <button class="btn-link" @click="toggleStatus(c)">{{ String(c.status)==='1'?'停用':'启用' }}</button>
                <button class="btn-link danger" @click="removeCoupon(c)">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="!coupons.length">
            <td colspan="9" style="color:#6b7280;">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import { listCoupons, createCoupon, updateCoupon, deleteCoupon, updateCouponStatus, listCouponRecords } from '@/api/coupon'
import { listCategories } from '@/api/category'

const showModal = inject('showModal')
const showToast = inject('showToast')

const coupons = ref([])
const categoryOptions = ref([])

const loadCategories = async () => {
  try {
    const res = await listCategories({ page: 1, page_size: 100 })
    if (res && res.success && res.data && res.data.items) {
      categoryOptions.value = [
        { label: '全部产品系列 (ALL)', value: 'ALL' },
        ...res.data.items.map(c => ({ label: c.name, value: c.categories_id }))
      ]
    }
  } catch (e) {
    console.error('获取类目失败', e)
  }
}

const loadCoupons = async () => {
  try {
    const res = await listCoupons({ page: 1, page_size: 50 })
    if (res && res.success && res.data && Array.isArray(res.data.items)) {
      coupons.value = res.data.items
    } else {
      coupons.value = []
      showToast((res && res.message) || '获取优惠券失败')
    }
  } catch (e) {
    coupons.value = []
    showToast('获取优惠券请求失败')
  }
}

const formatDate = (isoStr) => {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  return d.toLocaleString('zh-CN', { hour12: false })
}

const addCoupon = () => {
  showModal({
    type: 'form',
    title: '新增优惠券',
    fields: {
      name: { label: '优惠券名称', type: 'text', value: '' },
      total_amount: { label: '总金额', type: 'number', value: '1000' },
      discount_type: { label: '抵扣模式', type: 'select', value: '2', options: [{ label: '按固定金额', value: '2' }, { label: '按比例', value: '1' }] },
      discount_value: { label: '抵扣数值', type: 'number', value: '10' },
      min_order_amount: { label: '使用门槛', type: 'number', value: '100' },
      valid_type: { 
        label: '有效期模式', 
        type: 'select', 
        value: '1', 
        options: [{ label: '固定起止日期', value: '1' }, { label: '领取后N天', value: '2' }],
        onChange: (e, fields) => {
          const isFixed = String(fields.valid_type.value) === '1'
          fields.valid_end_time.hidden = !isFixed
          fields.valid_days.hidden = isFixed
        }
      },
      valid_start_time: { label: '起始时间 (必填)', type: 'datetime-local', value: '' },
      valid_end_time: { label: '结束时间', type: 'datetime-local', value: '' },
      valid_days: { label: '有效天数', type: 'number', value: '30', hidden: true },
      trigger_type: { 
        label: '发放触发条件', 
        type: 'select', 
        value: '1', 
        options: [{ label: '新用户注册', value: '1' }, { label: '定时发放', value: '2' }],
        onChange: (e, fields) => {
          fields.trigger_time.hidden = String(fields.trigger_type.value) !== '2'
        }
      },
      trigger_time: { label: '定时发放时间', type: 'datetime-local', value: '', hidden: true },
      applicable_categories: { label: '适用产品系列 (不选默认全部适用)', type: 'checkbox-group', value: [], options: categoryOptions.value.filter(o => o.value !== 'ALL') },
      applicable_time_periods: { 
        label: '可用时间段 (周一到周日)', 
        type: 'checkbox-group', 
        value: [1, 2, 3, 4, 5, 6, 7], 
        options: [
          { label: '周一', value: 1 },
          { label: '周二', value: 2 },
          { label: '周三', value: 3 },
          { label: '周四', value: 4 },
          { label: '周五', value: 5 },
          { label: '周六', value: 6 },
          { label: '周日', value: 7 }
        ]
      }
    },
    onConfirm: async (fields) => {
      try {
        const body = {
          name: fields.name.value,
          total_amount: parseFloat(fields.total_amount.value),
          discount_type: parseInt(fields.discount_type.value),
          discount_value: parseFloat(fields.discount_value.value),
          min_order_amount: parseFloat(fields.min_order_amount.value),
          valid_type: parseInt(fields.valid_type.value),
          trigger_type: parseInt(fields.trigger_type.value),
          applicable_categories: Array.isArray(fields.applicable_categories.value) && fields.applicable_categories.value.length > 0 ? fields.applicable_categories.value : ['ALL'],
          applicable_time_periods: Array.isArray(fields.applicable_time_periods.value) && fields.applicable_time_periods.value.length > 0 ? fields.applicable_time_periods.value.map(Number) : [1, 2, 3, 4, 5, 6, 7]
        }
        
        if (!fields.valid_start_time.value) {
          return showToast('必须填写起始时间')
        }
        body.valid_start_time = new Date(fields.valid_start_time.value).toISOString()

        if (body.valid_type === 1) {
          if (!fields.valid_end_time.value) {
            return showToast('固定日期模式必须填写结束时间')
          }
          body.valid_end_time = new Date(fields.valid_end_time.value).toISOString()
        } else {
          body.valid_days = parseInt(fields.valid_days.value)
        }
        
        if (body.trigger_type === 2) {
          if (!fields.trigger_time.value) return showToast('定时发放必须填写发放时间')
          body.trigger_time = new Date(fields.trigger_time.value).toISOString()
        }

        const res = await createCoupon(body)
        if (res && res.success) {
          showToast('创建优惠券成功')
          await loadCoupons()
        } else {
          showToast((res && res.message) || '创建优惠券失败')
        }
      } catch (e) { 
        showToast('请求失败') 
      }
    }
  })
}

const updateCouponBtn = (c) => {
  const rule = c.rule || {}
  const toLocalStr = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  }
  
  showModal({
    type: 'form',
    title: '更新优惠券',
    fields: {
      name: { label: '优惠券名称', type: 'text', value: c.name || '' },
      total_amount: { label: '总金额', type: 'number', value: String(c.total_amount || 0) },
      discount_type: { label: '抵扣模式', type: 'select', value: String(rule.discount_type || 2), options: [{ label: '按固定金额', value: '2' }, { label: '按比例', value: '1' }] },
      discount_value: { label: '抵扣数值', type: 'number', value: String(rule.discount_value || 0) },
      min_order_amount: { label: '使用门槛', type: 'number', value: String(rule.min_order_amount || 0) },
      valid_type: { 
        label: '有效期模式', 
        type: 'select', 
        value: String(rule.valid_type || 1), 
        options: [{ label: '固定起止日期', value: '1' }, { label: '领取后N天', value: '2' }],
        onChange: (e, fields) => {
          const isFixed = String(fields.valid_type.value) === '1'
          fields.valid_end_time.hidden = !isFixed
          fields.valid_days.hidden = isFixed
        }
      },
      valid_start_time: { label: '起始时间 (必填)', type: 'datetime-local', value: toLocalStr(rule.valid_start_time) },
      valid_end_time: { label: '结束时间', type: 'datetime-local', value: toLocalStr(rule.valid_end_time), hidden: String(rule.valid_type) !== '1' },
      valid_days: { label: '有效天数', type: 'number', value: String(rule.valid_days || 30), hidden: String(rule.valid_type) === '1' },
      trigger_type: { 
        label: '发放触发条件', 
        type: 'select', 
        value: String(rule.trigger_type || 1), 
        options: [{ label: '新用户注册', value: '1' }, { label: '定时发放', value: '2' }],
        onChange: (e, fields) => {
          fields.trigger_time.hidden = String(fields.trigger_type.value) !== '2'
        }
      },
      trigger_time: { label: '定时发放时间', type: 'datetime-local', value: toLocalStr(rule.trigger_time), hidden: String(rule.trigger_type) !== '2' },
      applicable_categories: { label: '适用产品系列 (不选默认全部适用)', type: 'checkbox-group', value: rule.applicable_categories && !rule.applicable_categories.includes('ALL') ? rule.applicable_categories : [], options: categoryOptions.value.filter(o => o.value !== 'ALL') },
      applicable_time_periods: { 
        label: '可用时间段 (周一到周日)', 
        type: 'checkbox-group', 
        value: Array.isArray(rule.applicable_time_periods) ? rule.applicable_time_periods.map(Number) : [1, 2, 3, 4, 5, 6, 7], 
        options: [
          { label: '周一', value: 1 },
          { label: '周二', value: 2 },
          { label: '周三', value: 3 },
          { label: '周四', value: 4 },
          { label: '周五', value: 5 },
          { label: '周六', value: 6 },
          { label: '周日', value: 7 }
        ]
      }
    },
    onConfirm: async (fields) => {
      try {
        const body = {
          coupon_id: c.coupon_id,
          name: fields.name.value,
          total_amount: parseFloat(fields.total_amount.value),
          discount_type: parseInt(fields.discount_type.value),
          discount_value: parseFloat(fields.discount_value.value),
          min_order_amount: parseFloat(fields.min_order_amount.value),
          valid_type: parseInt(fields.valid_type.value),
          trigger_type: parseInt(fields.trigger_type.value),
          applicable_categories: Array.isArray(fields.applicable_categories.value) && fields.applicable_categories.value.length > 0 ? fields.applicable_categories.value : ['ALL'],
          applicable_time_periods: Array.isArray(fields.applicable_time_periods.value) && fields.applicable_time_periods.value.length > 0 ? fields.applicable_time_periods.value.map(Number) : [1, 2, 3, 4, 5, 6, 7]
        }
        
        if (!fields.valid_start_time.value) {
          return showToast('必须填写起始时间')
        }
        body.valid_start_time = new Date(fields.valid_start_time.value).toISOString()

        if (body.valid_type === 1) {
          if (!fields.valid_end_time.value) {
            return showToast('固定日期模式必须填写结束时间')
          }
          body.valid_end_time = new Date(fields.valid_end_time.value).toISOString()
        } else {
          body.valid_days = parseInt(fields.valid_days.value)
        }
        
        if (body.trigger_type === 2) {
          if (!fields.trigger_time.value) return showToast('定时发放必须填写发放时间')
          body.trigger_time = new Date(fields.trigger_time.value).toISOString()
        }

        const res = await updateCoupon(body)
        if (res && res.success) {
          showToast('更新优惠券成功')
          await loadCoupons()
        } else {
          showToast((res && res.message) || '更新优惠券失败')
        }
      } catch (e) { 
        showToast('请求失败') 
      }
    }
  })
}

const toggleStatus = async (c) => {
  try {
    const newStatus = String(c.status) === '1' ? 0 : 1
    const res = await updateCouponStatus(c.coupon_id, newStatus)
    if (res && res.success) {
      showToast(newStatus === 1 ? '启用成功' : '停用成功')
      await loadCoupons()
    } else {
      showToast((res && res.message) || '状态更新失败')
    }
  } catch (e) {
    showToast('请求失败')
  }
}

const removeCoupon = (c) => {
  showModal({
    type: 'confirm',
    title: '删除优惠券',
    message: '确定删除该优惠券吗？(若已有用户领取将无法删除)',
    onConfirm: async () => {
      try {
        const res = await deleteCoupon(c.coupon_id)
        if (res && res.success) {
          showToast('删除成功')
          await loadCoupons()
        } else {
          showToast((res && res.message) || '删除失败')
        }
      } catch (e) {
        showToast('删除失败')
      }
    }
  })
}

const viewCouponRecords = async (c) => {
  try {
    const res = await listCouponRecords(c.coupon_id, { page: 1, page_size: 50 })
    if (res && res.success) {
      const records = res.data.items || []
      const rows = records.map(r => ({
        label: `用户: ${r.username || r.user_id}`,
        value: `余额: ¥${r.balance?.toFixed(2) || '0.00'} | 状态: ${r.status === 1 ? '有效' : r.status === 2 ? '已用完' : '已过期'} | 有效期: ${formatDate(r.valid_start_time)} 至 ${formatDate(r.valid_end_time)}`
      }))
      
      if (rows.length === 0) {
        rows.push({ label: '暂无记录', value: '该优惠券尚未发放或领取' })
      }
      
      showModal({ type: 'detail', title: '优惠券发放/领取记录', data: rows })
    } else {
      showToast((res && res.message) || '获取记录失败')
    }
  } catch (e) {
    showToast('请求失败')
  }
}

onMounted(() => {
  loadCategories()
  loadCoupons()
})
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
  /* white-space: nowrap; */
}
.data-table tr:hover td {
  background-color: #f9fafb;
}
.actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
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
.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.badge.success {
  background-color: #d1fae5;
  color: #065f46;
}
.badge.gray {
  background-color: #f3f4f6;
  color: #4b5563;
}
</style>