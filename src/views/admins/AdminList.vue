<template>
  <div>
    <div class="page-title">管理员列表</div>


    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="用户名/姓名" v-model="filter.keyword" />
        <select class="form-select" v-model="filter.role">
          <option value="">所属角色</option>
          <option value="SUPER">超级管理员</option>
          <option value="SUB">子管理员</option>
        </select>
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm primary" style="margin-left: auto;" @click="addAdmin">添加管理员</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>管理员ID</th>
            <th>用户名</th>
            <th>姓名</th>
            <th>手机号</th>
            <th>角色</th>
            <th>状态</th>
            <!-- <th>负责用户</th> -->
            <th>创建时间</th>
            <th width="220">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in filteredAdmins" :key="admin.id">
            <td>{{ admin.admins_id }}</td>
            <td>{{ admin.username }}</td>
            <td>{{ admin.name }}</td>
            <td>{{ admin.phone }}</td>
            <td>
              <span class="tag">{{ admin.role_display }}</span>
            </td>
            <td>
              <span class="badge" :class="admin.status === 1 ? 'success' : 'gray'">{{ admin.status === 1 ? '启用' : '禁用' }}</span>
            </td>
            <!-- <td>
              <div v-if="admin.responsible_user_ids && admin.responsible_user_ids.length" style="max-width: 200px; overflow-x: auto; white-space: nowrap;">
                <span v-for="uid in admin.responsible_user_ids" :key="uid" class="tag" style="margin-right: 4px; font-size: 10px;">{{ uid }}</span>
              </div>
              <span v-else style="color: #999;">-</span>
            </td> -->
            <td>{{ admin.created_at }}</td>
            <td>
            <div class="actions">
              <button class="btn-link" @click="viewAdmin(admin)">详情</button>
              <button class="btn-link" @click="editAdmin(admin)">编辑</button>
              <button class="btn-link" @click="editPermissions(admin)">权限</button>
              <button class="btn-link" @click="handleBindUsers(admin)">绑定用户</button>
              <button class="btn-link danger" v-if="admin.id !== 1" @click="deleteAdmin(admin)">删除</button>
            </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 {{ filteredAdmins.length }} 条记录</span>
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
import { ref, inject, onMounted, computed } from 'vue'
import { listAdmins, createAdmin, updateAdmin, updateAdminStatus, updateAdminPermissions, useAuthStore, deleteAdmin as deleteAdminApi, bindResponsibleUsers, updateResponsibleUsers } from '@/api/admin.js'

const showModal = inject('showModal')
const showToast = inject('showToast')
const confirmDialog = inject('confirmDialog')

const filter = ref({
  keyword: '',
  role: ''
})

const admins = ref([])
const filteredAdmins = computed(() => {
  const kw = String(filter.value.keyword || '').trim()
  const role = String(filter.value.role || '').trim()
  let arr = admins.value || []
  if (kw) {
    arr = arr.filter(a => String(a.username || '').includes(kw) || String(a.name || '').includes(kw))
  }
  if (role) {
    arr = arr.filter(a => String(a.role || '').toLowerCase().includes(role.toLowerCase()))
  }
  return arr
})
const permissionCount = ref(42)

const ALL_PERMISSIONS = [
  // 管理员管理
  { value: 'admin.list', label: '管理员列表' },
  { value: 'admin.create', label: '创建管理员' },
  { value: 'admin.message_update', label: '更新管理员基础信息' },
  { value: 'admin.update', label: '更新管理员权限集合' },
  { value: 'admin.status_update', label: '更改管理员启用状态' },
  // 用户管理
  { value: 'user.list', label: '用户列表' },
  { value: 'user.create', label: '创建用户' },
  { value: 'user.update', label: '更新用户信息' },
  { value: 'user.update_status', label: '更新用户状态' },
  // 商品管理（母商品）
  { value: 'products.list', label: '在售商品列表' },
  { value: 'products.create', label: '创建在售商品' },
  { value: 'products.update', label: '更新在售商品' },
  { value: 'products.publish', label: '上/下架在售商品' },
  // 明细商品（子商品）
  { value: 'product_details.create', label: '创建明细商品' },
  { value: 'product_details.update', label: '更新明细商品' },
  { value: 'product_details.status', label: '更改明细商品状态' },
  // 分类管理
  { value: 'categories.list', label: '分类列表' },
  { value: 'categories.create', label: '创建分类' },
  { value: 'categories.update', label: '更新分类' },
  { value: 'categories.status', label: '更改分类状态' },
  // 价格策略
  { value: 'prices.view', label: '查看价格策略' },
  { value: 'prices.create', label: '创建价格策略' },
  { value: 'prices.update', label: '更新价格策略' },
  { value: 'prices.status', label: '更改价格策略状态' },
  // 订单管理
  { value: 'orders.detail', label: '订单详情/订单列表' },
  { value: 'orders.update_status', label: '更新订单状态' },
  { value: 'orders.update_logistics', label: '更新订单物流' },
  { value: 'orders.export', label: '导出订单' },
  // 客服与工单
  { value: 'customer_service.create', label: '创建客服账号' },
  { value: 'customer_service.update', label: '更新客服信息' },
  { value: 'customer_service.update_status', label: '更改客服状态' },
  { value: 'customer_service.list', label: '客服列表' },
  { value: 'work_orders.update', label: '更新工单标题' },
  // 公告管理
  { value: 'announcements.list', label: '公告列表' },
  { value: 'announcements.create', label: '发布公告' },
  { value: 'announcements.update', label: '更新公告' },
  { value: 'announcements.status', label: '更改公告状态' },
  // 轮播与推荐
  { value: 'banners.create', label: '创建轮播内容' },
  { value: 'banners.update', label: '更新轮播内容状态' },
  { value: 'banners.list', label: '轮播内容列表' },
  { value: 'available_products.create', label: '创建推荐内容' },
  { value: 'available_products.update', label: '更新推荐状态' },
  { value: 'available_products.list', label: '推荐内容列表' }
]

permissionCount.value = ALL_PERMISSIONS.length // 展示实际数量

const auth = useAuthStore()

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const fetchAdmins = async () => {
  try {
    const res = await listAdmins({ admin_id: '', page: 1, page_size: 20, sort_by: 'id', sort_order: '' })
    if (res && res.success) {
      const items = (res && res.data && res.data.items) || []
      admins.value = items.map((it, idx) => ({
        id: idx + 1,
        admins_id: it.admins_id,
        username: it.username,
        name: it.real_name,
        role: it.role,
        role_display: it.role === 'SUB' ? '子管理员' : (it.role === 'SUPER' ? '超级管理员' : it.role),
        created_at: formatTime(it.created_at),
        status: it.status,
        phone: it.phone,
        permissions: it.permissions || [],
        responsible_user_ids: it.responsible_user_ids || []
      }))
    } else {
      const msg = (res && (res.data || res.message)) || '获取管理员列表失败'
      showToast(String(msg))
      admins.value = []
    }
  } catch (e) {
    showToast('获取管理员列表失败')
  }
}

const handleSearch = async () => {}

const viewAdmin = (admin) => {
  const rows = [
    { label: '管理员ID', value: admin.admins_id },
    { label: '用户名', value: admin.username },
    { label: '手机号', value: admin.phone },
    { label: '姓名', value: admin.name },
    { label: '角色', value: admin.role_display },
    { label: '状态', value: admin.status === 1 ? '启用' : '禁用' },
    { label: '创建时间', value: admin.created_at },
    { label: '权限', value: admin.permissions.join(', ') || '无' },
    { label: '负责用户', value: (admin.responsible_user_ids && admin.responsible_user_ids.length) ? admin.responsible_user_ids.join(', ') : '无' }
  ]
  showModal({ type: 'detail', title: '管理员详情', data: rows })
}

const addAdmin = () => {
  showModal({
    type: 'form',
    title: '添加管理员',
    fields: {
      username: { label: '用户名', type: 'text', value: '' },
      real_name: { label: '姓名', type: 'text', value: '' },
      phone: { label: '手机号', type: 'text', value: '' },
      password: { label: '密码', type: 'password', value: '' },
      role: { label: '角色', type: 'select', value: 'SUB', options: [
        { label: '普通管理员', value: 'SUB' },
        { label: '超级管理员', value: 'SUPER' }
      ]}
    },
    onConfirm: async (fields) => {
      try {
        const res = await createAdmin({
          username: fields.username.value,
          phone: fields.phone.value,
          password: fields.password.value,
          real_name: fields.real_name.value,
          role: fields.role.value,
          permissions: ['user.create', 'categories.update', 'user.list'] // Default permissions
        })
        if (res && res.success) {
          const msg = (res && res.message) || '管理员添加成功'
          showToast(msg)
          await fetchAdmins()
        } else {
          const msg = (res && (res.data || res.message)) || '管理员添加失败'
          showToast(String(msg))
        }
      } catch (e) {
        showToast('管理员添加失败')
      }
    }
  })
}

const editAdmin = (admin) => {
  showModal({
    type: 'form',
    title: '编辑管理员',
    fields: {
      username: { label: '用户名', type: 'text', value: admin.username },
      admins_id: { label: '管理员ID', type: 'text', value: admin.admins_id },
      real_name: { label: '姓名', type: 'text', value: admin.name },
      phone: { label: '手机号', type: 'text', value: admin.phone },
      status: { label: '状态', type: 'select', value: admin.status === '启用' ? '1' : '0', options: [
        { label: '启用', value: '1' },
        { label: '禁用', value: '0' }
      ]}
    },
    onConfirm: async (fields) => {
      try {
        const res = await updateAdmin({
          username: fields.username.value,
          admin_id: fields.admins_id.value,
          phone: fields.phone.value,
          real_name: fields.real_name.value
        })
        const statusRes = await updateAdminStatus({
          admin_id: fields.admins_id.value,
          status: fields.status.value
        })
        if ((res && res.success) && (statusRes && statusRes.success)) {
          const msg = (res && res.message) || (statusRes && statusRes.message) || '管理员信息已更新'
          showToast(msg)
          await fetchAdmins()
        } else {
          const msg = (!res?.success ? (res?.data || res?.message) : (!statusRes?.success ? (statusRes?.data || statusRes?.message) : '管理员更新失败'))
          showToast(String(msg))
        }
      } catch (e) {
        showToast('管理员更新失败')
      }
    }
  })
}

const deleteAdmin = (admin) => {
  confirmDialog({
    title: '确认删除',
    content: `确定要删除管理员 "${admin.username}" 吗？`,
    onConfirm: async () => {
      try {
        const res = await deleteAdminApi({ admin_id: admin.admins_id })
        if (res && res.success) {
          const msg = (res && res.message) || '删除管理员成功'
          showToast(msg)
          await fetchAdmins()
        } else {
          const msg = (res && (res.data || res.message)) || '删除管理员失败'
          showToast(String(msg))
        }
      } catch (e) {
        showToast('删除管理员失败')
      }
    }
  })
}

const editPermissions = (admin) => {
  const initial = Array.isArray(admin.permissions) ? [...admin.permissions] : []
  showModal({
    type: 'form',
    title: '编辑管理员权限',
    fields: {
      admins_id: { label: '管理员ID', type: 'text', value: admin.admins_id },
      permissions: { label: '权限集合', type: 'checkbox-group', value: initial, options: ALL_PERMISSIONS }
    },
    onConfirm: async (fields) => {
      try {
        const res = await updateAdminPermissions({ admin_id: fields.admins_id.value, permissions: fields.permissions.value })
        if (res && res.success) {
          const msg = (res && res.message) || '权限更新成功'
          showToast(msg)
          await fetchAdmins()
        } else {
          const msg = (res && (res.data || res.message)) || '权限更新失败'
          showToast(String(msg))
        }
      } catch (e) {
        showToast('权限更新失败')
      }
    }
  })
}

const handleBindUsers = (admin) => {
  const initial = (admin.responsible_user_ids && admin.responsible_user_ids.length) ? admin.responsible_user_ids.join(',') : ''
  showModal({
    type: 'form',
    title: '绑定负责用户',
    fields: {
      admins_id: { label: '管理员ID', type: 'text', value: admin.admins_id },
      user_ids: { label: '用户ID集合(英文逗号分隔)', type: 'text', value: initial }
    },
    onConfirm: async (fields) => {
      try {
        const idsStr = String(fields.user_ids.value || '').trim()
        const ids = idsStr ? idsStr.split(',').map(s => s.trim()).filter(Boolean) : []
        
        // Decide whether to use bind (add) or update. Since this is a "set" operation from the UI perspective,
        // we'll assume we want to update the list to exactly what is entered.
        // However, the user provided both interfaces. If the list was empty, maybe 'add' is used?
        // But 'update' usually covers setting the state. Let's stick with updateResponsibleUsers as it's more robust for editing.
        const res = await updateResponsibleUsers({
          admin_id: fields.admins_id.value,
          user_ids: ids
        })
        
        if (res && res.success) {
          const msg = (res && res.message) || '绑定用户成功'
          showToast(msg)
          await fetchAdmins()
        } else {
          const msg = (res && (res.data || res.message)) || '绑定用户失败'
          showToast(String(msg))
        }
      } catch (e) {
        showToast('绑定用户失败')
      }
    }
  })
}

onMounted(async () => {
  if (auth.isLoggedIn) {
    await fetchAdmins()
  }
})
</script>

<style scoped lang="scss">
.tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.badge.success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
  padding: 2px 8px;
  border-radius: 4px;
}
.badge.gray {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
}

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

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
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
