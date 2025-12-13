<template>
  <div>
    <div class="page-title">
      <span>商品列表</span>
      <div class="actions">
        <button class="btn-sm secondary" @click="handleImportExcel">导入Excel</button>
        <button class="btn-sm secondary" @click="handleImportImages">导入图片Zip</button>
        <button class="btn-sm secondary" @click="handleImportVideos">导入视频Zip</button>
        <button class="btn-sm primary" @click="handleCreateProduct">+ 新建商品</button>
      </div>
    </div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="搜索商品名称..." v-model="filter.keyword" />
        <select class="form-select" v-model="filter.status">
          <option value="">所有状态</option>
          <option>上架</option>
          <option>下架</option>
        </select>
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm" @click="resetFilter">重置</button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state">加载中...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th width="80">图片</th>
            <th>商品名称 / ID</th>
            <th>分类</th>
            <th>排序</th>
            <th>发货地</th>
            <th>状态</th>
            <th>创建时间</th>
            <th width="200">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in (products || [])" :key="item.available_product_id">
            <td>
              <div class="product-thumb">
                <img v-if="item.main_image" :src="Array.isArray(item.main_image) ? item.main_image[0] : item.main_image" alt="" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                <span v-else>📷</span>
              </div>
            </td>
            <td>
              <div class="product-name-cell">
                <div class="name" @click="goToDetail(item)" style="cursor: pointer; color: #3b82f6; font-weight: 500;">{{ item.name }}</div>
                <div class="code" style="font-size: 12px; color: #999;">{{ item.available_product_id }}</div>
              </div>
            </td>
            <td>{{ item.category_id }}</td>
            <td>{{ item.sort_order }}</td>
            <td>{{ item.shipping_origin }}</td>
            <td>
              <span 
                class="badge" 
                :class="String(item.status) === '1' ? 'success' : 'gray'"
                style="cursor: pointer;"
                @click="toggleStatus(item)"
              >
                {{ String(item.status) === '1' ? '上架' : '下架' }}
              </span>
            </td>
            <td>{{ item.created_at }}</td>
            <td>
              <div class="actions">
                <button class="btn-link primary" @click="goToDetail(item)">明细</button>
                <button class="btn-link" @click="viewDetail(item)">详情</button>
                <button class="btn-link" @click="editProduct(item)">编辑</button>
                <button class="btn-link danger" @click="deleteProduct(item)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 {{ pagination.total }} 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">上一页</button>
          <span style="margin: 0 10px;">第 {{ pagination.page }} 页</span>
          <button class="btn-sm" :disabled="(products || []).length < pagination.page_size" @click="changePage(pagination.page + 1)">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, reactive, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  createAvailableProduct, 
  importAvailableProductsExcel, 
  importAvailableProductsVideosZip, 
  importAvailableProductsImagesZip,
  updateAvailableProduct,
  updateAvailableProductStatus,
  listAvailableProducts
} from '@/api/available_product'
import { getOrderStats, getAvailableProductSalesStats } from '@/api/stats'
import { listCategories } from '@/api/category'

export default {
  name: 'ProductList',
  setup() {
    const showModal = inject('showModal')
    const showToast = inject('showToast')
    const router = useRouter()
    
    const loading = ref(false)
    const products = ref([])
    const pagination = reactive({
      page: 1,
      page_size: 20,
      total: 0
    })

    const filter = reactive({
      keyword: '',
      category: '',
      status: ''
    })
    
    const fetchProducts = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          page_size: pagination.page_size,
          sort_by: 'created_at',
          sort_order: 'desc'
        }
        if (filter.keyword) params.keyword = filter.keyword
        if (filter.status) params.status = filter.status === '上架' ? 1 : (filter.status === '下架' ? 0 : undefined)
        
        const res = await listAvailableProducts(params)
        if (res.success) {
          products.value = res.data.items
          pagination.total = res.data.total
        }
      } catch (e) {
        showToast('获取商品列表失败')
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchProducts()
    })

    const handleSearch = () => {
       pagination.page = 1
       fetchProducts()
    }

    const resetFilter = () => {
      filter.keyword = ''
      filter.category = ''
      filter.status = ''
      handleSearch()
    }
    
    const changePage = (page) => {
      pagination.page = page
      fetchProducts()
    }

    const goToDetail = (item) => {
      router.push(`/products/${item.available_product_id}/detail`)
    }

    // --- Main Product Operations ---

    const handleCreateProduct = () => {
      showModal({
        type: 'form',
        title: '新建商品',
        fields: {
          name: { label: '商品名称', type: 'text', value: '' },
          category_name: { label: '分类名称', type: 'text', value: '' },
          sort_order: { label: '排序', type: 'number', value: '0' },
          shipping_origin: { label: '发货地', type: 'text', value: '' },
          status: { label: '状态', type: 'select', value: '1', options: [{label:'上架', value:'1'}, {label:'下架', value:'0'}] },
          is_free_shipping: { label: '包邮', type: 'select', value: '1', options: [{label:'是', value:'1'}, {label:'否', value:'0'}] },
          shipping_time_hours: { label: '发货时效(小时)', type: 'number', value: '24' },
          support_no_reason_return_7d: { label: '七天无理由', type: 'select', value: '1', options: [{label:'支持', value:'1'}, {label:'不支持', value:'0'}] },
          main_image: { label: '主图', type: 'file', multiple: false, files: null },
          images: { label: '轮播图', type: 'file', multiple: true, files: null },
          video_url: { label: '视频', type: 'file', multiple: false, files: null }
        },
        onConfirm: async (fields) => {
          const formData = new FormData()
          formData.append('name', fields.name.value)
          formData.append('category_name', fields.category_name.value)
          formData.append('sort_order', fields.sort_order.value)
          formData.append('shipping_origin', fields.shipping_origin.value)
          formData.append('status', fields.status.value)
          formData.append('is_free_shipping', fields.is_free_shipping.value)
          formData.append('shipping_time_hours', fields.shipping_time_hours.value)
          formData.append('support_no_reason_return_7d', fields.support_no_reason_return_7d.value)
          
          if (fields.main_image.files && fields.main_image.files[0]) {
            formData.append('main_image', fields.main_image.files[0])
          }
          if (fields.images.files) {
            for (let i = 0; i < fields.images.files.length; i++) {
              formData.append('images', fields.images.files[i])
            }
          }
          if (fields.video_url.files && fields.video_url.files[0]) {
            formData.append('video_url', fields.video_url.files[0])
          }

          try {
            const res = await createAvailableProduct(formData)
            if (res.success) {
              showToast('新建商品成功')
              fetchProducts()
            } else {
              showToast('新建失败: ' + (res.message || '未知错误'))
            }
          } catch (e) {
            showToast('新建失败: ' + (e.message || '网络错误'))
          }
        }
      })
    }

    const handleImportExcel = () => {
      showModal({
        type: 'form',
        title: '导入商品Excel',
        fields: {
          file: { label: '选择Excel文件', type: 'file', multiple: false, files: null }
        },
        onConfirm: async (fields) => {
          if (!fields.file.files || !fields.file.files[0]) {
            showToast('请选择文件')
            return
          }
          const formData = new FormData()
          formData.append('file', fields.file.files[0])
          try {
            const res = await importAvailableProductsExcel(formData)
            if (res.success) {
               showToast('导入成功')
               if (res.data && res.data.success) {
                 showToast(`成功导入 ${res.data.success_count} 条`)
               }
               fetchProducts() // Refresh list immediately
            } else {
              showToast('导入失败: ' + (res.message || '未知错误'))
            }
          } catch (e) {
            showToast('导入请求失败')
          }
        }
      })
    }

    const handleImportImages = () => {
      showModal({
        type: 'form',
        title: '导入图片Zip',
        fields: {
          zip_file: { label: '选择Zip文件', type: 'file', multiple: false, files: null }
        },
        onConfirm: async (fields) => {
          if (!fields.zip_file.files || !fields.zip_file.files[0]) {
            showToast('请选择文件')
            return
          }
          const formData = new FormData()
          formData.append('zip_file', fields.zip_file.files[0])
          try {
            const res = await importAvailableProductsImagesZip(formData)
            if (res.success) {
              showToast('批量上传图片完成')
              fetchProducts() // Refresh list immediately
            } else {
              showToast('上传失败: ' + (res.message || '未知错误'))
            }
          } catch (e) {
            showToast('上传请求失败')
          }
        }
      })
    }

    const handleImportVideos = () => {
      showModal({
        type: 'form',
        title: '导入视频Zip',
        fields: {
          zip_file: { label: '选择Zip文件', type: 'file', multiple: false, files: null }
        },
        onConfirm: async (fields) => {
          if (!fields.zip_file.files || !fields.zip_file.files[0]) {
            showToast('请选择文件')
            return
          }
          const formData = new FormData()
          formData.append('zip_file', fields.zip_file.files[0])
          try {
            const res = await importAvailableProductsVideosZip(formData)
            if (res.success) {
              showToast('批量上传视频完成')
              fetchProducts() // Refresh list immediately
            } else {
              showToast('上传失败: ' + (res.message || '未知错误'))
            }
          } catch (e) {
            showToast('上传请求失败')
          }
        }
      })
    }

    const editProduct = async (item) => {
      const categoryOptions = []
      try {
        const res = await listCategories({ page: 1, page_size: 200 })
        const items = (res && res.data && res.data.items) || []
        items.forEach(c => {
          const label = c.name || c.category_name || String(c.category_id || '')
          const value = label
          categoryOptions.push({ label, value })
        })
      } catch (e) {}
      showModal({
        type: 'form',
        title: '编辑商品',
        fields: {
          product_id: { label: '商品ID', type: 'text', value: item.available_product_id, readonly: true },
          name: { label: '商品名称', type: 'text', value: item.name },
          category_name: { label: '分类名称', type: 'select', value: categoryOptions.find(o => o.label === String(item.category_id))?.value || (categoryOptions[0]?.value || ''), options: categoryOptions },
          sort_order: { label: '排序', type: 'number', value: item.sort_order },
          shipping_origin: { label: '发货地', type: 'text', value: item.shipping_origin },
          main_image: { label: '主图(修改则上传)', type: 'file', multiple: false, files: null },
          images: { label: '轮播图(修改则上传)', type: 'file', multiple: true, files: null },
          video_url: { label: '视频(修改则上传)', type: 'file', multiple: false, files: null },
          status: { label: '状态', type: 'select', value: String(item.status), options: [{label:'上架', value:'1'}, {label:'下架', value:'0'}] },
          is_free_shipping: { label: '包邮', type: 'select', value: String(item.is_free_shipping), options: [{label:'是', value:'1'}, {label:'否', value:'0'}] },
          shipping_time_hours: { label: '发货时效(小时)', type: 'number', value: item.shipping_time_hours },
          support_no_reason_return_7d: { label: '七天无理由', type: 'select', value: String(item.support_no_reason_return_7d), options: [{label:'支持', value:'1'}, {label:'不支持', value:'0'}] }
        },
        onConfirm: async (fields) => {
          const formData = new FormData()
          formData.append('product_id', item.available_product_id)
          formData.append('name', fields.name.value)
          formData.append('category_name', fields.category_name.value)
          formData.append('sort_order', fields.sort_order.value)
          formData.append('shipping_origin', fields.shipping_origin.value)
          formData.append('status', fields.status.value)
          formData.append('is_free_shipping', fields.is_free_shipping.value)
          formData.append('shipping_time_hours', fields.shipping_time_hours.value)
          formData.append('support_no_reason_return_7d', fields.support_no_reason_return_7d.value)
          
          if (fields.main_image.files && fields.main_image.files[0]) {
            formData.append('main_image', fields.main_image.files[0])
          }
          if (fields.images.files) {
            for (let i = 0; i < fields.images.files.length; i++) {
              formData.append('images', fields.images.files[i])
            }
          }
          if (fields.video_url.files && fields.video_url.files[0]) {
            formData.append('video_url', fields.video_url.files[0])
          }

          try {
            const res = await updateAvailableProduct(formData)
            if (res.success) {
              showToast('更新商品成功')
              fetchProducts()
            } else {
              showToast('更新失败: ' + (res.message || '未知错误'))
            }
          } catch (e) {
            showToast('更新失败: ' + (e.message || '网络错误'))
          }
        }
      })
    }
    
    const toggleStatus = async (item) => {
      const newStatus = item.status === 1 ? 0 : 1
      try {
        const res = await updateAvailableProductStatus({
          product_id: item.available_product_id,
          status: String(newStatus)
        })
        if (res.success) {
          showToast('状态更新成功')
          item.status = newStatus
        } else {
          showToast('状态更新失败')
        }
      } catch (e) {
        showToast('状态更新请求失败')
      }
    }

    const deleteProduct = (item) => {
      showModal({
        type: 'confirm',
        title: '删除商品',
        message: `确定要删除商品 "${item.name}" 吗？此操作不可恢复。`,
        onConfirm: () => {
           showToast('暂未开放删除接口')
        }
      })
    }

    const viewDetail = async (item) => {
      const now = new Date()
      const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
      const start = new Date(end)
      start.setDate(start.getDate() - 7)
      const fmt = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`
      const paramsBase = { start_time: fmt(start), end_time: fmt(end), sort_type: '金额' }

      let orderStats = null
      let salesStats = null
      try { orderStats = await getOrderStats({ ...paramsBase, view_type: '下单量' }) } catch (e) {}
      try { salesStats = await getAvailableProductSalesStats({ ...paramsBase, available_product_id: item.available_product_id }) } catch (e) {}

      const rows = [
        { label: '商品ID', value: String(item.available_product_id || '') },
        { label: '商品名称', value: String(item.name || '') },
        { label: '分类', value: String(item.category_id || '') },
        { label: '排序', value: String(item.sort_order || '') },
        { label: '发货地', value: String(item.shipping_origin || '') },
        { label: '状态', value: String(item.status) === '1' ? '上架' : '下架' },
        { label: '创建时间', value: String(item.created_at || '') }
      ]

      if (orderStats && orderStats.success && orderStats.data) {
        rows.push({ label: '订单统计-时间范围', value: `${paramsBase.start_time} 至 ${paramsBase.end_time}` })
        rows.push({ label: '订单统计-视图', value: '下单量' })
        rows.push({ label: '订单统计-总数', value: String(orderStats.data.total || '') })
      }
      if (salesStats && salesStats.success && salesStats.data) {
        rows.push({ label: '母商品销量-总销量', value: String(salesStats.data.total_sales_volume || '') })
        rows.push({ label: '母商品销量-总金额', value: String(salesStats.data.total_sales_amount || '') })
      }
      showModal({ type: 'detail', title: '商品详情', data: rows })
    }

    return {
      loading,
      products,
      pagination,
      filter,
      fetchProducts,
      handleSearch,
      resetFilter,
      changePage,
      handleCreateProduct,
      handleImportExcel,
      handleImportImages,
      handleImportVideos,
      viewDetail,
      editProduct,
      toggleStatus,
      deleteProduct,
      goToDetail
    }
  }
}
</script>

<style scoped>
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
.product-thumb {
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.product-name-cell { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; justify-content: center; white-space: normal; }
.product-name-cell .name { font-weight: 500; color: #111827; }
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
.btn-link.danger {
  color: #ef4444;
}
</style>
