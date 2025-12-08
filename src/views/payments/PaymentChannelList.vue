<template>
  <div>
    <div class="page-title">支付渠道管理</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="渠道名称" v-model="filter.name" />
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm primary" style="margin-left: auto;" @click="createChannel">新增渠道</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>渠道名称</th>
            <th>类型</th>
            <th>商户号</th>
            <th>费率</th>
            <th>状态</th>
            <th>最后更新</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="channel in channels" :key="channel.id">
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="channel-icon" :style="{ backgroundColor: channel.color }">{{ channel.name[0] }}</div>
                {{ channel.name }}
              </div>
            </td>
            <td>{{ channel.type }}</td>
            <td>{{ channel.merchantId }}</td>
            <td>{{ channel.rate }}</td>
            <td>
              <span class="status-tag" :class="channel.status === 'enabled' ? 'success' : 'warning'">
                {{ channel.status === 'enabled' ? '已启用' : '已禁用' }}
              </span>
            </td>
            <td>{{ channel.updatedAt }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="configChannel(channel)">配置</button>
                <button class="btn-link" v-if="channel.status === 'enabled'" @click="toggleStatus(channel)">禁用</button>
                <button class="btn-link success" v-else @click="toggleStatus(channel)">启用</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 3 条记录</span>
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
  name: ''
})

const channels = ref([
  { 
    id: 1, 
    name: '微信支付', 
    type: '移动支付', 
    merchantId: '1500000001', 
    rate: '0.6%', 
    status: 'enabled', 
    updatedAt: '2025-12-01 10:00:00',
    color: '#07C160'
  },
  { 
    id: 2, 
    name: '支付宝', 
    type: '移动支付', 
    merchantId: '2088000000000001', 
    rate: '0.55%', 
    status: 'enabled', 
    updatedAt: '2025-11-20 14:30:00',
    color: '#1677FF'
  },
  { 
    id: 3, 
    name: '银联支付', 
    type: '银行卡支付', 
    merchantId: '898000000000001', 
    rate: '0.5%', 
    status: 'disabled', 
    updatedAt: '2025-10-15 09:15:00',
    color: '#DD2F33'
  }
])

const handleSearch = () => {
  showToast('搜索结果已更新')
}

const createChannel = () => {
  showModal({
    title: '新增支付渠道',
    content: `
      <div class="form-group">
        <label>渠道名称</label>
        <input type="text" class="form-input" placeholder="如：微信支付">
      </div>
      <div class="form-group">
        <label>渠道类型</label>
        <select class="form-select">
          <option>移动支付</option>
          <option>银行卡支付</option>
          <option>其他</option>
        </select>
      </div>
      <div class="form-group">
        <label>商户号</label>
        <input type="text" class="form-input" placeholder="请输入商户号">
      </div>
      <div class="form-group">
        <label>费率</label>
        <input type="text" class="form-input" placeholder="如：0.6%">
      </div>
    `,
    onConfirm: () => {
      showToast('支付渠道已添加')
    }
  })
}

const configChannel = (channel) => {
  showModal({
    title: `配置 - ${channel.name}`,
    content: `
      <div class="form-group">
        <label>商户号 (AppID)</label>
        <input type="text" class="form-input" value="${channel.merchantId}">
      </div>
      <div class="form-group">
        <label>商户密钥 (AppSecret)</label>
        <input type="password" class="form-input" value="****************">
      </div>
      <div class="form-group">
        <label>回调地址</label>
        <input type="text" class="form-input" value="https://api.shop.com/notify/${channel.id}">
      </div>
      <div class="form-group">
        <label>证书上传</label>
        <div style="border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; font-size: 13px;">
          apiclient_cert.pem <span style="color: #10b981; float: right;">已上传</span>
        </div>
      </div>
    `,
    onConfirm: () => {
      showToast('配置已保存')
    }
  })
}

const toggleStatus = (channel) => {
  const action = channel.status === 'enabled' ? '禁用' : '启用'
  confirmDialog({
    title: `${action}渠道`,
    content: `确定要${action} "${channel.name}" 吗？`,
    onConfirm: () => {
      channel.status = channel.status === 'enabled' ? 'disabled' : 'enabled'
      showToast(`渠道已${action}`)
    }
  })
}
</script>

<style scoped lang="scss">
.channel-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  
  &.success {
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }
  
  &.warning {
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }
}

.btn-link.success {
  color: #10b981;
}
</style>
