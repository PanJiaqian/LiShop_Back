<template>
  <div>
    <div class="page-title">用户管理</div>
    
    <!-- 筛选栏 -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="用户昵称/手机号/邮箱" v-model="filter.keyword" />
        <select class="form-select" v-model="filter.level">
          <option value="">会员等级</option>
          <option value="normal">普通会员</option>
          <option value="gold">黄金会员</option>
          <option value="diamond">钻石会员</option>
        </select>
        <select class="form-select" v-model="filter.status">
          <option value="">账号状态</option>
          <option value="active">正常</option>
          <option value="disabled">禁用</option>
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
          <button class="btn-sm danger" @click="batchDisable">批量禁用</button>
        </div>
        <div class="right">
          <button class="btn-sm" @click="exportUsers">导出数据</button>
        </div>
      </div>
      
      <table class="data-table">
        <thead>
          <tr>
            <th width="50"><input type="checkbox" /></th>
            <th>用户</th>
            <th>手机号</th>
            <th>会员等级</th>
            <th>账户余额</th>
            <th>积分</th>
            <th>注册时间</th>
            <th>状态</th>
            <th width="180">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td><input type="checkbox" /></td>
            <td>
              <div class="user-cell">
                <div class="avatar">{{ user.nickname.charAt(0) }}</div>
                <div class="info">
                  <div class="nickname">{{ user.nickname }}</div>
                  <div class="email" v-if="user.email">{{ user.email }}</div>
                </div>
              </div>
            </td>
            <td>{{ user.phone }}</td>
            <td>
              <span class="badge" :class="getLevelClass(user.level)">{{ user.level }}</span>
            </td>
            <td>¥ {{ user.balance }}</td>
            <td>{{ user.points }}</td>
            <td>{{ user.registerTime }}</td>
            <td>
              <span class="status-dot" :class="user.status === '正常' ? 'active' : 'inactive'"></span>
              {{ user.status }}
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="viewUser(user)">详情</button>
                <button class="btn-link" @click="editUser(user)">编辑</button>
                <button class="btn-link danger" v-if="user.status === '正常'" @click="toggleStatus(user)">禁用</button>
                <button class="btn-link success" v-else @click="toggleStatus(user)">启用</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination">
        <span class="page-info">共 {{ users.length }} 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" disabled>上一页</button>
          <button class="btn-sm active">1</button>
          <button class="btn-sm">2</button>
          <button class="btn-sm">3</button>
          <button class="btn-sm">4</button>
          <button class="btn-sm">5</button>
          <button class="btn-sm">...</button>
          <button class="btn-sm">50</button>
          <button class="btn-sm">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, reactive } from 'vue'

export default {
  name: 'UserList',
  setup() {
    const showModal = inject('showModal')
    const filter = reactive({
      keyword: '',
      level: '',
      status: ''
    })

    const users = reactive([
        { id: 1, nickname: 'Alice Smith', email: 'alice@example.com', phone: '138****1234', level: '钻石会员', balance: '2580.00', points: 12500, registerTime: '2025-01-15 10:20:30', status: '正常' },
        { id: 2, nickname: 'Bob Jones', email: 'bob@example.com', phone: '139****5678', level: '黄金会员', balance: '580.00', points: 3200, registerTime: '2025-03-22 14:15:00', status: '正常' },
        { id: 3, nickname: 'Charlie Brown', email: '', phone: '150****9876', level: '普通会员', balance: '0.00', points: 100, registerTime: '2025-05-10 09:30:45', status: '禁用' },
        { id: 4, nickname: 'David Wilson', email: 'david@test.com', phone: '136****4321', level: '黄金会员', balance: '120.50', points: 560, registerTime: '2025-06-01 16:40:20', status: '正常' },
        { id: 5, nickname: 'Eva Davis', email: '', phone: '189****6789', level: '普通会员', balance: '50.00', points: 20, registerTime: '2025-11-11 11:11:11', status: '正常' }
    ])

    const getLevelClass = (level) => {
      if (level === '钻石会员') return 'primary'
      if (level === '黄金会员') return 'warning'
      return 'info'
    }

    const handleSearch = () => {
      console.log('Search:', filter)
    }

    const resetFilter = () => {
      filter.keyword = ''
      filter.level = ''
      filter.status = ''
    }

    const addUser = () => {
      showModal({
        type: 'form',
        title: '添加用户',
        fields: {
          nickname: { label: '昵称', type: 'text', value: '' },
          phone: { label: '手机号', type: 'text', value: '' },
          password: { label: '密码', type: 'text', value: '' }
        },
        onConfirm: (fields) => {
          users.unshift({
            id: users.length + 1,
            nickname: fields.nickname.value,
            email: '',
            phone: fields.phone.value,
            level: '普通会员',
            balance: '0.00',
            points: 0,
            registerTime: new Date().toLocaleString(),
            status: '正常'
          })
        }
      })
    }

    const viewUser = (user) => {
      showModal({
        type: 'confirm',
        title: '用户详情',
        message: `用户：${user.nickname}\n手机：${user.phone}\n余额：${user.balance}\n积分：${user.points}`,
        onConfirm: () => {}
      })
    }

    const editUser = (user) => {
      showModal({
        type: 'form',
        title: '编辑用户',
        fields: {
          nickname: { label: '昵称', type: 'text', value: user.nickname },
          phone: { label: '手机号', type: 'text', value: user.phone }
        },
        onConfirm: (fields) => {
          user.nickname = fields.nickname.value
          user.phone = fields.phone.value
        }
      })
    }

    const toggleStatus = (user) => {
      const action = user.status === '正常' ? '禁用' : '启用'
      showModal({
        type: 'confirm',
        title: `${action}用户`,
        message: `确定要${action}用户 "${user.nickname}" 吗？`,
        onConfirm: () => {
          user.status = user.status === '正常' ? '禁用' : '正常'
        }
      })
    }
    
    const batchDisable = () => {
      showModal({
        type: 'confirm',
        title: '批量禁用',
        message: '确定要禁用选中的用户吗？',
        onConfirm: () => {}
      })
    }

    const exportUsers = () => {
      showModal({
        type: 'confirm',
        title: '导出用户',
        message: '确定要导出用户数据吗？',
        onConfirm: () => {}
      })
    }

    return {
      filter,
      users,
      getLevelClass,
      handleSearch,
      resetFilter,
      addUser,
      viewUser,
      editUser,
      toggleStatus,
      batchDisable,
      exportUsers
    }
  }
}
</script>

<style scoped lang="scss">
.user-cell {
  display: flex;
  align-items: center;
  
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

/* Removing .badge.purple as requested to avoid purple */
</style>
