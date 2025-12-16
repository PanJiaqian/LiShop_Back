<template>
  <div>
    <div class="page-title">猜你喜欢管理</div>
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <button class="btn-sm primary" @click="openCreateModal">创建推荐</button>
        <button class="btn-sm" @click="fetchList">刷新</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>推荐ID</th>
            <th>商品ID</th>
            <th>状态</th>
            <th>管理员ID</th>
            <th>创建时间</th>
            <th>更新时间</th>
            <th width="220">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.recommendation_id">
            <td>{{ item.recommendation_id }}</td>
            <td>{{ item.available_product_id }}</td>
            <td>
              <span class="badge" :class="item.status === 1 ? 'success' : 'gray'">{{ item.status === 1 ? '上架' : '下架'
                }}</span>
            </td>
            <td>{{ item.owner_admin_id }}</td>
            <td>{{ item.created_at }}</td>
            <td>{{ item.updated_at }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="publish(item)">上架</button>
                <button class="btn-link danger" @click="unpublish(item)">下架</button>
                <button class="btn-link danger" @click="remove(item)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <span class="page-info">共 {{ total }} 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" disabled>上一页</button>
          <button class="btn-sm active">1</button>
          <button class="btn-sm" disabled>下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, ref, onMounted } from 'vue'
import { createRecommendation, updateRecommendationStatus, listRecommendations, deleteRecommendation } from '@/api/recommendation'

export default {
  name: 'RecommendationAdmin',
  setup() {
    const showToast = inject('showToast')
    const showModal = inject('showModal')
    const items = ref([])
    const total = ref(0)

    const openCreateModal = () => {
      showModal({
        type: 'form',
        title: '创建推荐',
        fields: {
          carousel_type: { label: '类型', type: 'select', options: [{ value: '商品', label: '商品' }], value: '商品' },
          available_product_id: { label: '商品ID', type: 'text', value: '' }
        },
        onConfirm: async (fields) => {
          const fd = new FormData()
          fd.append('carousel_type', fields.carousel_type.value)
          if (fields.available_product_id.value) fd.append('available_product_id', fields.available_product_id.value)
          

          try {
            const res = await createRecommendation(fd)
            if (res && res.success) {
              const msg = (res && res.message) || '创建成功'
              showToast(msg)
              await fetchList()
            } else {
              const msg = (res && (res.data || res.message)) || '创建失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('创建失败')
          }
        }
      })
    }

    const fetchList = async () => {
      try {
        const res = await listRecommendations({})
        if (res && res.success) {
          items.value = (res && res.data && res.data.items) || []
          total.value = (res && res.data && res.data.total) || items.value.length
        } else {
          items.value = []
          total.value = 0
          const msg = (res && (res.data || res.message)) || '获取列表失败'
          showToast(String(msg))
        }
      } catch (e) {
        items.value = []
        total.value = 0
        showToast('获取列表失败')
      }
    }

    const publish = async (item) => {
      const fd = new FormData()
      fd.append('recommendation_id', item.recommendation_id)
      fd.append('status', '1')
      try {
        const res = await updateRecommendationStatus(fd)
        if (res && res.success) {
          const msg = (res && res.message) || '更新成功'
          showToast(msg)
          item.status = 1
        } else {
          const msg = (res && (res.data || res.message)) || '更新失败'
          showToast(String(msg))
        }
      } catch (e) {
        showToast('更新失败')
      }
    }

    const unpublish = async (item) => {
      const fd = new FormData()
      fd.append('recommendation_id', item.recommendation_id)
      fd.append('status', '0')
      try {
        const res = await updateRecommendationStatus(fd)
        if (res && res.success) {
          const msg = (res && res.message) || '更新成功'
          showToast(msg)
          item.status = 0
        } else {
          const msg = (res && (res.data || res.message)) || '更新失败'
          showToast(String(msg))
        }
      } catch (e) {
        showToast('更新失败')
      }
    }

    const remove = async (item) => {
      showModal({
        type: 'confirm',
        title: '删除推荐',
        message: '确定删除该推荐内容吗？',
        onConfirm: async () => {
          try {
            const fd = new FormData()
            fd.append('recommendation_id', item.recommendation_id)
            const res = await deleteRecommendation(fd)
            if (res && res.success) {
              const msg = (res && res.message) || '删除成功'
              showToast(msg)
              await fetchList()
            } else {
              const msg = (res && (res.data || res.message)) || '删除失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('删除失败')
          }
        }
      })
    }

    onMounted(() => {
      fetchList()
    })

    return {
      total,
      items,
      openCreateModal,
      fetchList,
      publish,
      unpublish,
      remove
    }
  }
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 8px;
}

.data-table th,
.data-table td {
  text-align: center;
  white-space: nowrap;
}

.badge.success {
  background: #dcfce7;
  color: #166534;
  /* border: 1px solid #bbf7d0; */
  padding: 2px 8px;
  border-radius: 99px;
}

.badge.gray {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.actions {
  justify-content: center;
}
</style>
