<template>
  <div>
    <div class="page-title">分组管理</div>

    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <select class="form-select" v-model="filter.status">
          <option value="">全部状态</option>
          <option value="active">启用</option>
          <option value="inactive">停用</option>
        </select>
        <select class="form-select" v-model="filter.sort_order">
          <option value="desc">创建时间倒序</option>
          <option value="asc">创建时间正序</option>
        </select>
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm" @click="resetFilter">重置</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="left">
          <button class="btn-sm primary" @click="addGroup">添加分组</button>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>分组ID</th>
            <th>分组名称</th>
            <th>状态</th>
            <th>创建时间</th>
            <th width="200">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in groups" :key="group.group_id">
            <td>{{ group.group_id }}</td>
            <td>{{ group.group_name }}</td>
            <td>
              <span class="status-dot" :class="group.status === 'active' ? 'active' : 'inactive'"></span>
              {{ group.status === 'active' ? '启用' : '停用' }}
            </td>
            <td>{{ formatTime(group.created_at) }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="viewBindings(group)">绑定详情</button>
                <button class="btn-link" @click="editGroup(group)">编辑</button>
                <button class="btn-link danger" @click="removeGroup(group)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 绑定详情弹窗 -->
    <div class="modal-overlay" v-if="bindingVisible" @click.self="bindingVisible = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3>分组绑定详情 - {{ bindingGroup?.group_name }}</h3>
          <button class="btn-link" @click="bindingVisible = false">关闭</button>
        </div>
        <div class="modal-body">
          <div class="binding-section">
            <h4>绑定用户 ({{ bindingData.bound_users?.length || 0 }})</h4>
            <table class="data-table" v-if="bindingData.bound_users?.length">
              <thead><tr><th>用户名</th><th>手机号</th></tr></thead>
              <tbody>
                <tr v-for="u in bindingData.bound_users" :key="u.user_id">
                  <td>{{ u.username }}</td><td>{{ u.phone }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="empty-text">暂无绑定用户</p>
          </div>
          <div class="binding-section">
            <h4>绑定分类 ({{ bindingData.categories?.length || 0 }})</h4>
            <table class="data-table" v-if="bindingData.categories?.length">
              <thead><tr><th>分类名称</th><th>分类ID</th></tr></thead>
              <tbody>
                <tr v-for="c in bindingData.categories" :key="c.categories_id">
                  <td>{{ c.name }}</td><td>{{ c.categories_id }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="empty-text">暂无绑定分类</p>
          </div>
          <div class="binding-section">
            <h4>关联母商品 ({{ bindingData.available_products?.length || 0 }})</h4>
            <table class="data-table" v-if="bindingData.available_products?.length">
              <thead><tr><th>商品名称</th><th>可见范围</th></tr></thead>
              <tbody>
                <tr v-for="p in bindingData.available_products" :key="p.available_product_id">
                  <td>{{ p.name }}</td>
                  <td>{{ p.visible_scope === 'all' ? '不限制' : '白名单' }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="empty-text">暂无关联母商品</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { listGroups, createGroup, updateGroup, deleteGroup, getGroupBindings } from '@/api/group'

const showModal = inject('showModal')
const showToast = inject('showToast')
const confirmDialog = inject('confirmDialog')

const filter = reactive({ status: '', sort_by: 'created_at', sort_order: 'desc' })
const groups = ref([])
const bindingVisible = ref(false)
const bindingGroup = ref(null)
const bindingData = ref({})

const formatTime = (t) => t ? t.replace('T', ' ').split('.')[0] : ''

const fetchGroups = async () => {
  try {
    const params = { group_id: '', sort_by: filter.sort_by, sort_order: filter.sort_order }
    if (filter.status) params.status = filter.status
    const res = await listGroups(params)
    if (res && res.success) {
      groups.value = res.data?.items || res.data || []
    } else {
      showToast(res?.message || '获取分组列表失败')
    }
  } catch (e) {
    showToast('获取分组列表失败')
  }
}

const handleSearch = () => fetchGroups()
const resetFilter = () => {
  filter.status = ''
  filter.sort_order = 'desc'
  fetchGroups()
}

const addGroup = () => {
  showModal({
    type: 'form',
    title: '添加分组',
    fields: {
      group_name: { label: '分组名称', type: 'text', value: '' },
      status: {
        label: '状态', type: 'select', value: 'active',
        options: [{ label: '启用', value: 'active' }, { label: '停用', value: 'inactive' }]
      }
    },
    onConfirm: async (fields) => {
      try {
        const res = await createGroup({
          group_name: fields.group_name.value,
          status: fields.status.value
        })
        if (res && res.success) {
          showToast(res.message || '创建分组成功')
          fetchGroups()
        } else {
          showToast(res?.message || res?.data || '创建分组失败')
        }
      } catch (e) {
        showToast('创建分组失败')
      }
    }
  })
}
const editGroup = (group) => {
  showModal({
    type: 'form',
    title: '编辑分组',
    fields: {
      group_name: { label: '分组名称', type: 'text', value: group.group_name },
      status: {
        label: '状态', type: 'select', value: group.status,
        options: [{ label: '启用', value: 'active' }, { label: '停用', value: 'inactive' }]
      }
    },
    onConfirm: async (fields) => {
      try {
        const res = await updateGroup({
          group_id: group.group_id,
          group_name: fields.group_name.value,
          status: fields.status.value
        })
        if (res && res.success) {
          showToast(res.message || '更新成功')
          fetchGroups()
          window.dispatchEvent(new CustomEvent('shopback-group-changed', { detail: { action: 'updated', group_id: group.group_id } }))
        } else {
          showToast(res?.message || res?.data || '更新失败')
        }
      } catch (e) {
        showToast('更新失败')
      }
    }
  })
}

const removeGroup = (group) => {
  confirmDialog({
    title: '确认删除',
    content: `确定要删除分组 "${group.group_name}" 吗？删除后将自动解绑关联的用户、分类和母商品白名单。`,
    onConfirm: async () => {
      try {
        const res = await deleteGroup({ group_id: group.group_id })
        if (res && res.success) {
          showToast(res.message || '删除成功')
          fetchGroups()
          window.dispatchEvent(new CustomEvent('shopback-group-changed', { detail: { action: 'deleted', group_id: group.group_id } }))
        } else {
          showToast(res?.message || res?.data || '删除失败')
        }
      } catch (e) {
        showToast('删除失败')
      }
    }
  })
}

const viewBindings = async (group) => {
  bindingGroup.value = group
  try {
    const res = await getGroupBindings({ group_id: group.group_id })
    if (res && res.success) {
      bindingData.value = res.data || {}
    } else {
      bindingData.value = {}
      showToast(res?.message || '获取绑定详情失败')
    }
  } catch (e) {
    bindingData.value = {}
    showToast('获取绑定详情失败')
  }
  bindingVisible.value = true
}

onMounted(() => { fetchGroups() })
</script>

<style scoped lang="scss">
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
}
.data-table tr:hover td { background-color: #f9fafb; }
.status-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  background: #ccc;
  &.active { background: #52c41a; }
  &.inactive { background: #ff4d4f; }
}
.actions { display: flex; gap: 12px; justify-content: center; }
.btn-link {
  padding: 0; border: none; background: none;
  color: #3b82f6; cursor: pointer; font-size: 14px;
  &:hover { text-decoration: underline; }
  &.danger { color: #ef4444; }
}
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-box {
  background: #fff; border-radius: 12px; width: 720px;
  max-height: 80vh; overflow-y: auto; padding: 24px;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
.binding-section { margin-bottom: 24px; }
.binding-section h4 { margin-bottom: 12px; color: #333; }
.empty-text { color: #999; font-size: 14px; }
</style>
