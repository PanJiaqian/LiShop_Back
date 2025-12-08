<template>
  <div>
    <div class="page-title">管理员列表</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="用户名/姓名" v-model="filter.keyword" />
        <select class="form-select" v-model="filter.role">
          <option value="">所属角色</option>
          <option value="admin">超级管理员</option>
          <option value="editor">内容编辑</option>
          <option value="service">客服专员</option>
        </select>
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm primary" style="margin-left: auto;" @click="addAdmin">添加管理员</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>姓名</th>
            <th>角色</th>
            <th>最后登录时间</th>
            <th>最后登录IP</th>
            <th>状态</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in admins" :key="admin.id">
            <td>{{ admin.username }}</td>
            <td>{{ admin.name }}</td>
            <td>
              <span class="tag">{{ admin.role }}</span>
            </td>
            <td>{{ admin.lastLoginTime }}</td>
            <td>{{ admin.lastLoginIp }}</td>
            <td>
              <span class="status-dot" :class="admin.status === '启用' ? 'active' : 'inactive'"></span>
              {{ admin.status }}
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="editAdmin(admin)">编辑</button>
                <button class="btn-link danger" v-if="admin.id !== 1" @click="deleteAdmin(admin)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 5 条记录</span>
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
  role: ''
})

const admins = ref([
  { id: 1, username: 'admin', name: '系统管理员', role: '超级管理员', lastLoginTime: '2025-12-04 09:00:00', lastLoginIp: '192.168.1.10', status: '启用' },
  { id: 2, username: 'editor01', name: '张三', role: '内容编辑', lastLoginTime: '2025-12-03 14:20:00', lastLoginIp: '192.168.1.12', status: '启用' },
  { id: 3, username: 'service01', name: '李四', role: '客服专员', lastLoginTime: '2025-12-04 08:30:00', lastLoginIp: '192.168.1.15', status: '启用' },
  { id: 4, username: 'finance', name: '王五', role: '财务专员', lastLoginTime: '2025-12-02 17:00:00', lastLoginIp: '192.168.1.20', status: '禁用' },
  { id: 5, username: 'test', name: '测试员', role: '普通管理员', lastLoginTime: '2025-11-30 10:00:00', lastLoginIp: '192.168.1.30', status: '启用' }
])

const handleSearch = () => {
  showToast('搜索已更新')
}

const addAdmin = () => {
  showModal({
    title: '添加管理员',
    content: `
      <div class="form-group">
        <label>用户名</label>
        <input type="text" class="form-input" placeholder="请输入用户名">
      </div>
      <div class="form-group">
        <label>姓名</label>
        <input type="text" class="form-input" placeholder="请输入真实姓名">
      </div>
      <div class="form-group">
        <label>角色</label>
        <select class="form-select">
          <option>请选择角色</option>
          <option>超级管理员</option>
          <option>内容编辑</option>
          <option>客服专员</option>
          <option>财务专员</option>
        </select>
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" class="form-input" placeholder="请输入密码">
      </div>
    `,
    onConfirm: () => {
      showToast('管理员添加成功')
    }
  })
}

const editAdmin = (admin) => {
  showModal({
    title: '编辑管理员',
    content: `
      <div class="form-group">
        <label>用户名</label>
        <input type="text" class="form-input" value="${admin.username}" disabled>
      </div>
      <div class="form-group">
        <label>姓名</label>
        <input type="text" class="form-input" value="${admin.name}">
      </div>
      <div class="form-group">
        <label>角色</label>
        <select class="form-select">
          <option ${admin.role === '超级管理员' ? 'selected' : ''}>超级管理员</option>
          <option ${admin.role === '内容编辑' ? 'selected' : ''}>内容编辑</option>
          <option ${admin.role === '客服专员' ? 'selected' : ''}>客服专员</option>
          <option ${admin.role === '财务专员' ? 'selected' : ''}>财务专员</option>
        </select>
      </div>
      <div class="form-group">
        <label>状态</label>
        <select class="form-select">
          <option ${admin.status === '启用' ? 'selected' : ''}>启用</option>
          <option ${admin.status === '禁用' ? 'selected' : ''}>禁用</option>
        </select>
      </div>
    `,
    onConfirm: () => {
      showToast('管理员信息已更新')
    }
  })
}

const deleteAdmin = (admin) => {
  confirmDialog({
    title: '确认删除',
    content: `确定要删除管理员 "${admin.username}" 吗？`,
    onConfirm: () => {
      showToast('管理员已删除')
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

.tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  
  &.active {
    background: #52c41a;
  }
  
  &.inactive {
    background: #ff4d4f;
  }
}
</style>