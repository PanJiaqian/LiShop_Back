<template>
  <div class="package-fee-admin">
    <div class="header">
      <div class="title-area">
        <h2>包装费规格管理</h2>
        <span class="subtitle">管理包装费的规格和价格</span>
      </div>
      <button class="btn-primary" @click="handleCreate">
        <i class="fas fa-plus"></i> 新建包装费
      </button>
    </div>

    <div class="content-body">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="fees.length === 0" class="empty-state">
        <i class="fas fa-box-open empty-icon"></i>
        <p>暂无包装费规格数据</p>
        <button class="btn-outline" @click="handleCreate">立即创建</button>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>包装费ID</th>
            <th>名称</th>
            <th>计费方式</th>
            <th>最大承载量</th>
            <th>包装价格</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in fees" :key="item.package_id">
            <td class="id-cell">
              <span class="id-text">{{ item.package_id }}</span>
            </td>
            <td>{{ item.name }}</td>
            <td>
              <span class="badge gray">{{ item.type === 'quantity' ? '按数量' : '按重量' }}</span>
            </td>
            <td>{{ item.max_capacity }}</td>
            <td class="price-cell">¥ {{ Number(item.price).toFixed(2) }}</td>
            <td>
              <span :class="['badge', item.status === 1 ? 'success' : 'danger']">
                {{ item.status === 1 ? '已启用' : '已停用' }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="handleEdit(item)">编辑</button>
                <button class="btn-link text-danger" @click="handleDelete(item)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="pagination.total > 0" class="pagination">
        <span class="page-info">共 {{ pagination.total }} 条，每页 {{ pagination.page_size }} 条</span>
        <div class="page-buttons">
          <button
            class="btn-page"
            :disabled="pagination.page <= 1"
            @click="changePage(pagination.page - 1)"
          >
            上一页
          </button>
          <span class="current-page">{{ pagination.page }}</span>
          <button
            class="btn-page"
            :disabled="pagination.page * pagination.page_size >= pagination.total"
            @click="changePage(pagination.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, ref, reactive, onMounted } from 'vue'
import { listPackageFees, createPackageFee, updatePackageFee, deletePackageFee } from '@/api/package_fee'

export default {
  name: 'PackageFeeAdmin',
  setup () {
    const showModal = inject('showModal')
    const showToast = inject('showToast')
    const resolveApiMessage = inject('resolveApiMessage', (source, fallback = '操作失败') => {
      if (source && source.response && source.response.data) {
        const payload = source.response.data
        const message = payload && payload.message ? String(payload.message) : ''
        const detail = payload && payload.data != null ? payload.data : ''
        return [message, detail].filter(v => String(v || '').trim()).join('：') || fallback
      }
      if (source && typeof source === 'object') {
        const message = source.message ? String(source.message) : ''
        const detail = source.data != null ? source.data : ''
        return [message, detail].filter(v => String(v || '').trim()).join('：') || fallback
      }
      return fallback
    })

    const loading = ref(false)
    const fees = ref([])
    const pagination = reactive({
      page: 1,
      page_size: 20,
      total: 0
    })

    const fetchFees = async () => {
      loading.value = true
      try {
        const res = await listPackageFees({ page: pagination.page, page_size: pagination.page_size })
        if (res && res.success) {
          fees.value = res.data.items || []
          pagination.total = res.data.total || 0
        } else {
          fees.value = []
          pagination.total = 0
          showToast(resolveApiMessage(res, '获取包装费列表失败'))
        }
      } catch (e) {
        showToast(resolveApiMessage(e, '获取包装费列表失败'))
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchFees()
    })

    const changePage = (p) => {
      pagination.page = p
      fetchFees()
    }

    const handleCreate = () => {
      showModal({
        type: 'form',
        title: '新建包装费规格',
        fields: {
          name: { label: '包装费名称', type: 'text', value: '' },
          type: { label: '计费方式', type: 'select', value: 'quantity', options: [{ label: '按数量', value: 'quantity' }, { label: '按重量', value: 'weight' }] },
          max_capacity: { label: '最大承载量', type: 'number', value: '0' },
          price: { label: '包装价格', type: 'number', value: '0.00' },
          status: { label: '状态', type: 'select', value: '1', options: [{ label: '启用', value: '1' }, { label: '停用', value: '0' }] }
        },
        onConfirm: async (fields) => {
          try {
            const res = await createPackageFee({
              name: fields.name.value,
              type: fields.type.value,
              max_capacity: Number(fields.max_capacity.value),
              price: Number(fields.price.value),
              status: Number(fields.status.value)
            })
            if (res && res.success) {
              showToast('创建成功')
              fetchFees()
            } else {
              showToast(resolveApiMessage(res, '创建失败'))
            }
          } catch (e) {
            showToast(resolveApiMessage(e, '创建失败'))
          }
        }
      })
    }

    const handleEdit = (item) => {
      showModal({
        type: 'form',
        title: '编辑包装费规格',
        fields: {
          name: { label: '包装费名称', type: 'text', value: item.name },
          type: { label: '计费方式', type: 'select', value: item.type, options: [{ label: '按数量', value: 'quantity' }, { label: '按重量', value: 'weight' }] },
          max_capacity: { label: '最大承载量', type: 'number', value: String(item.max_capacity) },
          price: { label: '包装价格', type: 'number', value: String(item.price) },
          status: { label: '状态', type: 'select', value: String(item.status), options: [{ label: '启用', value: '1' }, { label: '停用', value: '0' }] }
        },
        onConfirm: async (fields) => {
          try {
            const res = await updatePackageFee({
              package_id: item.package_id,
              name: fields.name.value,
              type: fields.type.value,
              max_capacity: Number(fields.max_capacity.value),
              price: Number(fields.price.value),
              status: Number(fields.status.value)
            })
            if (res && res.success) {
              showToast('更新成功')
              fetchFees()
            } else {
              showToast(resolveApiMessage(res, '更新失败'))
            }
          } catch (e) {
            showToast(resolveApiMessage(e, '更新失败'))
          }
        }
      })
    }

    const handleDelete = (item) => {
      showModal({
        type: 'confirm',
        title: '确认删除',
        content: `确定要删除包装费规格 "${item.name}" 吗？如果有关联商品将无法删除。`,
        onConfirm: async () => {
          try {
            const res = await deletePackageFee(item.package_id)
            if (res && res.success) {
              showToast('删除成功')
              fetchFees()
            } else {
              showToast(resolveApiMessage(res, '删除失败'))
            }
          } catch (e) {
            showToast(resolveApiMessage(e, '删除失败'))
          }
        }
      })
    }

    return {
      loading,
      fees,
      pagination,
      changePage,
      handleCreate,
      handleEdit,
      handleDelete
    }
  }
}
</script>

<style scoped>
.package-fee-admin {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-area h2 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-outline {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.content-body {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  color: #6b7280;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  color: #6b7280;
  gap: 16px;
}

.empty-icon {
  font-size: 48px;
  color: #d1d5db;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #f9fafb;
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  font-size: 14px;
  color: #374151;
}

.data-table tr:hover td {
  background-color: #f9fafb;
}

.id-cell {
  width: 200px;
}

.id-text {
  font-family: monospace;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #4b5563;
}

.price-cell {
  font-weight: 500;
  color: #111827;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.badge.success {
  background-color: #d1fae5;
  color: #065f46;
}

.badge.danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.badge.gray {
  background-color: #f3f4f6;
  color: #4b5563;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn-link {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
}

.btn-link:hover {
  text-decoration: underline;
}

.text-danger {
  color: #ef4444;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
}

.page-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-page {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-page {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}
</style>
