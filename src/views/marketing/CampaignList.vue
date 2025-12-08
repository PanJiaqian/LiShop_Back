<template>
  <div>
    <div class="page-title">营销活动</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="活动名称" v-model="filter.name" />
        <select class="form-select" v-model="filter.type">
          <option value="">活动类型</option>
          <option value="seckill">秒杀</option>
          <option value="group">拼团</option>
          <option value="discount">限时折扣</option>
        </select>
        <select class="form-select" v-model="filter.status">
          <option value="">状态</option>
          <option value="active">进行中</option>
          <option value="upcoming">未开始</option>
          <option value="ended">已结束</option>
        </select>
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm primary" style="margin-left: auto;" @click="createCampaign">创建活动</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>活动名称</th>
            <th>活动类型</th>
            <th>活动时间</th>
            <th>参与商品</th>
            <th>订单数</th>
            <th>销售额</th>
            <th>状态</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="campaign in campaigns" :key="campaign.id">
            <td>
              <div class="campaign-name">{{ campaign.name }}</div>
            </td>
            <td>
              <span class="tag">{{ campaign.type }}</span>
            </td>
            <td>
              <div class="time-range">
                <div>{{ campaign.startTime }}</div>
                <div class="separator">至</div>
                <div>{{ campaign.endTime }}</div>
              </div>
            </td>
            <td>{{ campaign.productCount }}</td>
            <td>{{ campaign.orderCount }}</td>
            <td>¥ {{ campaign.revenue }}</td>
            <td>
              <span class="badge" :class="getStatusClass(campaign.status)">{{ campaign.status }}</span>
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="editCampaign(campaign)">编辑</button>
                <button class="btn-link" @click="viewData(campaign)">数据</button>
                <button class="btn-link danger" v-if="campaign.status === '未开始'" @click="deleteCampaign(campaign)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 4 条记录</span>
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
  name: '',
  type: '',
  status: ''
})

const campaigns = ref([
  { id: 1, name: '双12年终盛典', type: '限时折扣', startTime: '2025-12-10 00:00:00', endTime: '2025-12-12 23:59:59', productCount: 500, orderCount: 0, revenue: '0.00', status: '未开始' },
  { id: 2, name: '每日必抢秒杀', type: '秒杀', startTime: '2025-12-04 10:00:00', endTime: '2025-12-04 12:00:00', productCount: 10, orderCount: 120, revenue: '12,500.00', status: '进行中' },
  { id: 3, name: '冬季保暖拼团', type: '拼团', startTime: '2025-11-20 00:00:00', endTime: '2025-12-01 00:00:00', productCount: 50, orderCount: 350, revenue: '45,800.00', status: '已结束' },
  { id: 4, name: '新品首发预售', type: '预售', startTime: '2025-12-15 10:00:00', endTime: '2025-12-20 10:00:00', productCount: 5, orderCount: 0, revenue: '0.00', status: '未开始' }
])

const getStatusClass = (status) => {
  if (status === '进行中') return 'success'
  if (status === '未开始') return 'warning'
  if (status === '已结束') return 'gray'
  return 'info'
}

const handleSearch = () => {
  showToast('搜索结果已更新')
}

const createCampaign = () => {
  showModal({
    title: '创建营销活动',
    content: `
      <div class="form-group">
        <label>活动名称</label>
        <input type="text" class="form-input" placeholder="请输入活动名称">
      </div>
      <div class="form-group">
        <label>活动类型</label>
        <select class="form-select">
          <option>限时折扣</option>
          <option>秒杀</option>
          <option>拼团</option>
        </select>
      </div>
      <div class="form-group">
        <label>开始时间</label>
        <input type="datetime-local" class="form-input">
      </div>
      <div class="form-group">
        <label>结束时间</label>
        <input type="datetime-local" class="form-input">
      </div>
    `,
    onConfirm: () => {
      showToast('活动创建成功')
    }
  })
}

const editCampaign = (campaign) => {
  showModal({
    title: '编辑活动',
    content: `
      <div class="form-group">
        <label>活动名称</label>
        <input type="text" class="form-input" value="${campaign.name}">
      </div>
      <div class="form-group">
        <label>活动类型</label>
        <select class="form-select" disabled>
          <option selected>${campaign.type}</option>
        </select>
      </div>
      <div class="form-group">
        <label>开始时间</label>
        <input type="text" class="form-input" value="${campaign.startTime}">
      </div>
      <div class="form-group">
        <label>结束时间</label>
        <input type="text" class="form-input" value="${campaign.endTime}">
      </div>
    `,
    onConfirm: () => {
      showToast('活动修改成功')
    }
  })
}

const viewData = (campaign) => {
  showModal({
    title: '活动数据',
    content: `
      <div class="data-summary" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
        <div class="summary-item" style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 12px; color: #64748b;">总销售额</div>
          <div style="font-size: 20px; font-weight: bold; color: var(--primary-color);">¥ ${campaign.revenue}</div>
        </div>
        <div class="summary-item" style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 12px; color: #64748b;">总订单数</div>
          <div style="font-size: 20px; font-weight: bold; color: #333;">${campaign.orderCount}</div>
        </div>
        <div class="summary-item" style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
          <div style="font-size: 12px; color: #64748b;">参与商品</div>
          <div style="font-size: 20px; font-weight: bold; color: #333;">${campaign.productCount}</div>
        </div>
      </div>
      <div style="text-align: center; color: #94a3b8; font-size: 13px;">
        详细数据报表请前往【报表分析】查看
      </div>
    `,
    onConfirm: () => {}
  })
}

const deleteCampaign = (campaign) => {
  confirmDialog({
    title: '删除活动',
    content: `确定要删除活动 "${campaign.name}" 吗？此操作不可恢复。`,
    onConfirm: () => {
      showToast('活动已删除')
    }
  })
}
</script>

<style scoped lang="scss">
.campaign-name {
  font-weight: 500;
  color: #333;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  background: #eff6ff;
  color: var(--primary-color);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 4px;
  font-size: 12px;
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
