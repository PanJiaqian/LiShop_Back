<template>
  <div>
    <div class="page-title">角色权限管理</div>
    
    <div class="grid">
      <!-- 左侧角色列表 -->
      <div class="card role-list-card">
        <div class="card-header">
          <h3>角色列表</h3>
          <button class="btn-sm primary" @click="addRole">添加角色</button>
        </div>
        <div class="role-list">
          <div 
            class="role-item" 
            v-for="role in roles" 
            :key="role.id"
            :class="{ active: activeRole.id === role.id }"
            @click="activeRole = role"
          >
            <div class="role-info">
              <div class="role-name">{{ role.name }}</div>
              <div class="role-desc">{{ role.description }}</div>
            </div>
            <div class="role-actions">
              <button class="btn-icon" title="编辑" @click.stop="editRole(role)"><i class="edit-icon">✎</i></button>
              <button class="btn-icon danger" title="删除" v-if="!role.isSystem" @click.stop="deleteRole(role)"><i class="delete-icon">×</i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧权限配置 -->
      <div class="card permission-card">
        <div class="card-header">
          <h3>权限配置 - {{ activeRole.name }}</h3>
          <button class="btn-sm primary" @click="savePermissions">保存权限</button>
        </div>
        <div class="permission-tree">
          <div class="tree-group" v-for="group in permissions" :key="group.id">
            <div class="group-header">
              <label class="checkbox-wrapper">
                <input type="checkbox" :checked="group.checked" @change="toggleGroup(group, $event.target.checked)" />
                <span class="label-text">{{ group.name }}</span>
              </label>
            </div>
            <div class="group-items">
              <label class="checkbox-wrapper" v-for="perm in group.items" :key="perm.id">
                <input type="checkbox" v-model="perm.checked" />
                <span class="label-text">{{ perm.name }}</span>
              </label>
            </div>
          </div>
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

const roles = ref([
  { id: 1, name: '超级管理员', description: '拥有系统所有权限', isSystem: true },
  { id: 2, name: '内容编辑', description: '负责商品和文章管理', isSystem: false },
  { id: 3, name: '客服专员', description: '处理订单和售后', isSystem: false },
  { id: 4, name: '财务专员', description: '查看订单和财务报表', isSystem: false }
])

const activeRole = ref(roles.value[0])

const permissions = ref([
  {
    id: 'p1',
    name: '商品管理',
    checked: true,
    items: [
      { id: 'p1-1', name: '查看商品', checked: true },
      { id: 'p1-2', name: '添加商品', checked: true },
      { id: 'p1-3', name: '编辑商品', checked: true },
      { id: 'p1-4', name: '删除商品', checked: true }
    ]
  },
  {
    id: 'p2',
    name: '订单管理',
    checked: true,
    items: [
      { id: 'p2-1', name: '查看订单', checked: true },
      { id: 'p2-2', name: '订单发货', checked: true },
      { id: 'p2-3', name: '修改订单', checked: true },
      { id: 'p2-4', name: '导出订单', checked: true }
    ]
  },
  {
    id: 'p3',
    name: '用户管理',
    checked: true,
    items: [
      { id: 'p3-1', name: '查看用户', checked: true },
      { id: 'p3-2', name: '编辑用户', checked: true },
      { id: 'p3-3', name: '禁用用户', checked: true }
    ]
  },
  {
    id: 'p4',
    name: '系统设置',
    checked: true,
    items: [
      { id: 'p4-1', name: '基本设置', checked: true },
      { id: 'p4-2', name: '权限管理', checked: true },
      { id: 'p4-3', name: '操作日志', checked: true }
    ]
  }
])

const toggleGroup = (group, checked) => {
  group.checked = checked
  group.items.forEach(item => item.checked = checked)
}

const addRole = () => {
  showModal({
    type: 'form',
    title: '添加角色',
    fields: {
      name: { label: '角色名称', type: 'text', value: '' },
      description: { label: '角色描述', type: 'textarea', value: '' }
    },
    onConfirm: (fields) => {
      const newRole = {
        id: Date.now(),
        name: fields.name.value,
        description: fields.description.value,
        isSystem: false
      }
      roles.value.push(newRole)
      showToast('角色添加成功')
    }
  })
}

const editRole = (role) => {
  showModal({
    type: 'form',
    title: '编辑角色',
    fields: {
      name: { label: '角色名称', type: 'text', value: role.name },
      description: { label: '角色描述', type: 'textarea', value: role.description }
    },
    onConfirm: (fields) => {
      role.name = fields.name.value
      role.description = fields.description.value
      showToast('角色信息已更新')
    }
  })
}

const deleteRole = (role) => {
  confirmDialog({
    title: '确认删除',
    content: `确定要删除角色 "${role.name}" 吗？`,
    onConfirm: () => {
      const index = roles.value.findIndex(r => r.id === role.id)
      if (index !== -1) {
        roles.value.splice(index, 1)
        if (activeRole.value.id === role.id && roles.value.length > 0) {
          activeRole.value = roles.value[0]
        }
        showToast('角色已删除')
      }
    }
  })
}

const savePermissions = () => {
  showToast('权限保存成功')
}
</script>

<style scoped lang="scss">
.grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  align-items: start;
}

.role-list-card {
  padding: 0;
  overflow: hidden;
  
  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 { margin: 0; font-size: 16px; }
  }
}

.role-list {
  .role-item {
    padding: 15px 20px;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s;
    
    &:hover {
      background: #f9f9f9;
    }
    
    &.active {
      background: var(--bg-color-active, #eff6ff);
      border-right: 3px solid var(--primary-color);
      
      .role-name {
        color: var(--primary-color);
      }
    }
    
    .role-info {
      .role-name {
        font-weight: 500;
        margin-bottom: 4px;
        color: #333;
      }
      
      .role-desc {
        font-size: 12px;
        color: #999;
      }
    }
    
    .role-actions {
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:hover .role-actions {
    opacity: 1;
  }
}
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  color: #666;
  
  &:hover {
    color: var(--primary-color);
  }
  
  &.danger:hover {
    color: #ff4d4f;
  }
}

.permission-tree {
  padding: 20px 0;
  
  .tree-group {
    margin-bottom: 24px;
    
    .group-header {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
      font-weight: bold;
    }
    
    .group-items {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
      padding-left: 12px;
    }
  }
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  
  input {
    margin-right: 8px;
    accent-color: var(--primary-color);
  }
  
  .label-text {
    color: #333;
  }
}
</style>