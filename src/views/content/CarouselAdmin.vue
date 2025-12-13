<template>
  <div>
    <div class="page-title">轮播管理</div>
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <button class="btn-sm primary" @click="openCreateModal">创建轮播</button>
        <select class="form-select" v-model="listType" @change="fetchList">
          <option value="商品">商品</option>
          <option value="图片">图片</option>
        </select>
        <button class="btn-sm" @click="fetchList">刷新</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>轮播ID</th>
            <th>商品ID</th>
            <th>图片</th>
            <th>状态</th>
            <th width="180">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.carousel_id">
            <td>{{ item.carousel_id }}</td>
            <td>{{ item.available_product_id }}</td>
            <td>
              <div class="product-thumb">
                <img :src="item.image_url" @error="onImgError($event)" alt="carousel"
                  style="width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" />
              </div>
            </td>
            <td>
              <span class="badge" :class="String(item.status) === '1' ? 'success' : 'gray'">{{ String(item.status) ===
                '1' ? '上架' : '下架' }}</span>
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="publish(item)">上架</button>
                <button class="btn-link danger" @click="unpublish(item)">下架</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <span class="page-info">共 {{ items.length }} 条记录</span>
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
import { createCarousel, updateCarouselStatus, listCarousel } from '@/api/carousel'

export default {
  name: 'CarouselAdmin',
  setup() {
    const showToast = inject('showToast')
    const showModal = inject('showModal')
    const listType = ref('商品')
    const items = ref([])

    const openCreateModal = () => {
      showModal({
        type: 'form',
        title: '创建轮播',
        fields: {
          carousel_type: { label: '类型', type: 'select', options: [{ value: '商品', label: '商品' }, { value: '图片', label: '图片' }], value: '商品' },
          available_product_id: { label: '商品ID', type: 'text', value: '' },
          image: { label: '图片', type: 'file', value: null }
        },
        onConfirm: async (fields) => {
          const fd = new FormData()
          fd.append('carousel_type', fields.carousel_type.value)
          if (fields.available_product_id.value) fd.append('available_product_id', fields.available_product_id.value)
          if (fields.image.value) fd.append('image', fields.image.value)

          try {
            const res = await createCarousel(fd)
            const msg = (res && res.message) || '创建成功'
            showToast(msg)
            listType.value = fields.carousel_type.value
            await fetchList()
          } catch (e) {
            showToast('创建失败')
          }
        }
      })
    }

    const fetchList = async () => {
      try {
        const res = await listCarousel({ carousel_type: listType.value })
        items.value = (res && res.data && res.data.items) || []
      } catch (e) {
        items.value = []
        showToast('获取列表失败')
      }
    }

    const publish = async (item) => {
      const fd = new FormData()
      fd.append('carousel_id', item.carousel_id)
      fd.append('status', '1')
      try {
        const res = await updateCarouselStatus(fd)
        const msg = (res && res.message) || '更新成功'
        showToast(msg)
        item.status = 1
      } catch (e) {
        showToast('更新失败')
      }
    }

    const unpublish = async (item) => {
      const fd = new FormData()
      fd.append('carousel_id', item.carousel_id)
      fd.append('status', '0')
      try {
        const res = await updateCarouselStatus(fd)
        const msg = (res && res.message) || '更新成功'
        showToast(msg)
        item.status = 0
      } catch (e) {
        showToast('更新失败')
      }
    }

    const onImgError = (e) => {
      const svg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="#9ca3af">No Image</text></svg>')
      e.target.src = `data:image/svg+xml,${svg}`
    }

    onMounted(() => {
      fetchList()
    })

    return {
      listType,
      items,
      openCreateModal,
      fetchList,
      publish,
      unpublish,
      onImgError
    }
  }
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.product-thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  border-radius: 99px;
}

.actions {
  justify-content: center;
}
</style>
