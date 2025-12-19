<template>
  <div>
    <div class="page-title">用户管理</div>
    
    <!-- 筛选栏 -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="用户名/手机号/邮箱" v-model="filter.user_id" />
        <select class="form-select" v-model="filter.status">
          <option value="">全部状态</option>
          <option value="1">正常</option>
          <option value="0">禁用</option>
        </select>
        <select class="form-select" v-model="filter.sort_order">
          <option value="desc">注册时间倒序</option>
          <option value="asc">注册时间正序</option>
        </select>
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm" @click="resetFilter">重置</button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="card">
      <div class="card-header">
        <div class="left">
          <button class="btn-sm primary" @click="addUser">添加用户</button>
          <button class="btn-sm success" @click="triggerImport">导入用户</button>
          <input type="file" ref="fileInput" style="display: none" accept=".xlsx, .xls" @change="handleImport" />
        </div>
        <div class="right">
          <!-- <button class="btn-sm" @click="exportUsers">导出数据</button> -->
        </div>
      </div>
      
      <table class="data-table">
        <thead>
          <tr>
            <!-- <th width="50"><input type="checkbox" /></th> -->
            <th>用户</th>
            <th>邮箱</th>
            <th>联系人</th>
            <th>公司</th>
            <th>手机号</th>
            <th>等级</th>
            <th>地区</th>
            <!-- <th>上级ID</th> -->
            <!-- <th>注册时间</th> -->
            <th>状态</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in displayUsers" :key="user.user_id">
            <!-- <td><input type="checkbox" /></td> -->
            <td>
              <div class="user-cell">
                <!-- <div class="avatar">{{ (user.username || '').charAt(0).toUpperCase() }}</div> -->
                <div class="info">{{ user.username }}</div>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>{{ user.contact_name }}</td>
            <td>{{ user.company_name }}</td>
            <td>{{ user.phone }}</td>
            <td>
              <span class="badge" :class="getLevelClass(user.level)">Level {{ user.level }}</span>
            </td>
            <td>{{ user.region }}</td>
            <!-- <td>{{ user.parent_id }}</td> -->
            <!-- <td>{{ formatTime(user.created_at) }}</td> -->
            <td>
              <span class="status-dot" :class="user.status === 1 ? 'active' : 'inactive'"></span>
              {{ user.status === 1 ? '正常' : '禁用' }}
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="viewUser(user)">详情</button>
                <button class="btn-link" @click="editUser(user)">编辑</button>
                <button class="btn-link danger" @click="removeUser(user)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination">
        <span class="page-info">共 {{ displayUsers.length }} 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" :disabled="page === 1" @click="changePage(page - 1)">上一页</button>
          <span style="margin: 0 10px;">{{ page }}</span>
          <button class="btn-sm" :disabled="users.length < pageSize" @click="changePage(page + 1)">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, reactive, ref, onMounted, computed } from 'vue'
import { listUsers, createUser, updateUser, updateUserStatus, importUsersExcel, deleteUser, updateUserAvatar } from '@/api/user.js'

export default {
  name: 'UserList',
  setup() {
    const showModal = inject('showModal')
    const showToast = inject('showToast')
    const hideToast = inject('hideToast')
    const setUploadProgress = inject('setUploadProgress')
    const endUploadProgress = inject('endUploadProgress')
    
    const filter = reactive({
      user_id: '',
      status: '',
      sort_by: 'id',
      sort_order: 'desc'
    })

    const users = ref([])
    const displayUsers = computed(() => {
      let arr = users.value || []
      const st = filter.status
      if (st !== '' && st != null) {
        arr = arr.filter(u => String(u.status) === String(st))
      }
      return arr
    })
    const total = ref(0)
    const page = ref(1)
    const pageSize = ref(20)
    const fileInput = ref(null)

    const formatTime = (t) => {
      if (!t) return ''
      return t.replace('T', ' ').split('.')[0]
    }

    const fetchUsers = async () => {
      try {
        const res = await listUsers({
          user_id: filter.user_id,
          page: page.value,
          page_size: pageSize.value,
          sort_by: filter.sort_by,
          sort_order: filter.sort_order
        })
        if (res && res.data) {
          users.value = res.data.items || []
          total.value = res.data.total || 0
        }
      } catch (e) {
        console.error(e)
        showToast('获取用户列表失败')
      }
    }

    const changePage = (p) => {
      if (p < 1) return
      page.value = p
      fetchUsers()
    }

    const getLevelClass = (level) => {
      if (level >= 3) return 'primary' // 钻石
      if (level === 2) return 'warning' // 黄金
      return 'info'
    }

    const handleSearch = () => {
      page.value = 1
    }

    const resetFilter = () => {
      filter.user_id = ''
      filter.status = ''
      filter.sort_order = 'desc'
      handleSearch()
    }

    const addUser = () => {
      showModal({
        type: 'form',
        title: '添加用户',
        fields: {
          username: { label: '用户名', type: 'text', value: '' },
          phone: { label: '手机号', type: 'text', value: '' },
          password: { label: '密码', type: 'password', value: '' },
          email: { label: '邮箱', type: 'email', value: '' },
          company_name: { label: '公司名称', type: 'text', value: '' },
          contact_name: { label: '联系人', type: 'text', value: '' },
          region: { label: '所在地区', type: 'text', value: '' },
          level: { label: '会员等级', type: 'number', value: '1' }
        },
        onConfirm: async (fields) => {
          try {
            const res = await createUser({
              username: fields.username.value,
              phone: fields.phone.value,
              password: fields.password.value,
              email: fields.email.value,
              company_name: fields.company_name.value,
              contact_name: fields.contact_name.value,
              region: fields.region.value,
              level: parseInt(fields.level.value) || 1,
              parent_id: 0
            })
            if (res && res.success) {
              showToast(res.message || '用户添加成功')
              fetchUsers()
            } else {
              const msg = (res && (res.data || res.message)) || '用户添加失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('用户添加失败')
          }
        }
      })
    }

    const triggerImport = () => {
      fileInput.value.click()
    }

    const handleImport = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      try {
        const res = await importUsersExcel(file)
        if (res && res.success) {
          const successCount = res.data.success_count || 0
          const failureCount = res.data.failure_count || 0
          let msg = `导入完成：成功 ${successCount} 条`
          if (failureCount > 0) {
            msg += `，失败 ${failureCount} 条`
          }
          showToast(msg)
          fetchUsers()
        } else {
          const msg = (res && (res.data || res.message)) || '导入失败'
          showToast(String(msg))
        }
      } catch (e) {
        showToast('导入出错')
      } finally {
        e.target.value = '' // Reset input
      }
    }

    const viewUser = (user) => {
      showModal({
        type: 'detail',
        title: '用户详情',
        data: [
          ...(function () {
            const u = String(user.avatar_url || '').trim().replace(/^`+|`+$/g, '').replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '')
            return u ? [{ label: '头像', value: u, type: 'image' }] : []
          })(),
          { label: '用户ID', value: user.user_id },
          { label: '用户名', value: user.username },
          { label: '手机号', value: user.phone },
          { label: '邮箱', value: user.email },
          { label: '公司名称', value: user.company_name },
          { label: '联系人', value: user.contact_name },
          { label: '地区', value: user.region },
          { label: '等级', value: user.level },
          { label: '状态', value: user.status === 1 ? '正常' : '禁用' },
          { label: '上级ID', value: user.parent_id },
          { label: '注册时间', value: user.created_at }
        ]
      })
    }

    const editUser = (user) => {
      showModal({
        type: 'form',
        title: '编辑用户',
        fields: {
          username: { label: '用户名', type: 'text', value: user.username },
          email: { label: '邮箱', type: 'email', value: user.email },
          phone: { label: '手机号', type: 'text', value: user.phone },
          company_name: { label: '公司名称', type: 'text', value: user.company_name },
          contact_name: { label: '联系人', type: 'text', value: user.contact_name },
          region: { label: '所在地区', type: 'text', value: user.region },
          level: { label: '会员等级', type: 'number', value: String(user.level || 1) },
          status: { label: '状态', type: 'select', value: String(user.status || 1), options: [
            { label: '正常', value: '1' },
            { label: '禁用', value: '0' }
          ]},
          avatar: { label: '头像(可选)', type: 'file', multiple: false, files: null }
        },
        onConfirm: async (fields) => {
          try {
            const res1 = await updateUser({
              user_id: user.user_id,
              username: fields.username.value,
              email: fields.email.value,
              phone: fields.phone.value,
              company_name: fields.company_name.value,
              contact_name: fields.contact_name.value,
              region: fields.region.value,
              level: parseInt(fields.level.value) || 1
            })
            const res2 = await updateUserStatus({
              user_id: user.user_id,
              status: fields.status.value
            })
            let ok = (res1 && res1.success) && (res2 && res2.success)
            if (fields.avatar.files && fields.avatar.files[0]) {
              const fd = new FormData()
              fd.append('user_id', user.user_id)
              fd.append('avatar', fields.avatar.files[0])
              const res3 = await updateUserAvatar(fd, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在上传头像') })
              ok = ok && !!(res3 && res3.success)
              endUploadProgress && endUploadProgress()
            }
            if (ok) {
              showToast('修改成功')
              fetchUsers()
            } else {
              const msg = (!res1?.success ? (res1?.data || res1?.message) : (res2?.data || res2?.message)) || '修改失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('修改失败')
          }
        }
      })
    }

    const removeUser = (user) => {
      showModal({
        type: 'confirm',
        title: '删除用户',
        message: `确定要删除用户 "${user.username}" 吗？`,
        onConfirm: async () => {
          try {
            const fd = new FormData()
            fd.append('user_id', user.user_id)
            const res = await deleteUser(fd)
            if (res && res.success) {
              const msg = (res && res.message) || '删除用户成功'
              showToast(msg)
              fetchUsers()
            } else {
              const msg = (res && (res.data || res.message)) || '删除用户失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('删除用户失败')
          }
        }
      })
    }

    onMounted(() => {
      fetchUsers()
    })

    return {
      filter,
      users,
      displayUsers,
      total,
      page,
      pageSize,
      fileInput,
      getLevelClass,
      handleSearch,
      resetFilter,
      addUser,
      triggerImport,
      handleImport,
      viewUser,
      editUser,
      removeUser,
      changePage,
      formatTime
    }
  }
}
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
  white-space: nowrap;
}
.data-table tr:hover td {
  background-color: #f9fafb;
}

.user-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  
  .avatar {
    width: 36px;
    height: 36px;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 16px;
    margin-right: 10px;
  }
  
  .info {
    text-align: left;
    .nickname {
      font-size: 14px;
      color: #333;
    }
    .email {
      font-size: 12px;
      color: #999;
    }
  }
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  background: #ccc;
  
  &.active {
    background: #52c41a;
  }
  
  &.inactive {
    background: #ff4d4f;
  }
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

/* Removing .badge.purple as requested to avoid purple */
</style>
