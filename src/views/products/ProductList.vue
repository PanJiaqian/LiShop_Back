<template>
  <div>
    <div class="page-title">
      <span>商品列表</span>
      <div class="actions">
        <button class="btn-sm primary" @click="handleImportExcel">导入Excel</button>
        <button class="btn-sm primary" @click="handleImportImages">导入图片Zip</button>
        <button class="btn-sm primary" @click="handleImportVideos">导入视频Zip</button>
        <button class="btn-sm primary" @click="handleCreateProduct">+ 新建商品</button>
      </div>
    </div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="搜索商品名称..." v-model="filter.keyword" />
        <select class="form-select" v-model="filter.category">
          <option value="">所有分类</option>
          <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
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
            <th>推荐值</th>
            <th>发货地</th>
            <th>状态</th>
            <th>创建时间</th>
            <th width="200">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in (displayProducts || [])" :key="item.available_product_id">
            <td>
              <div class="thumbs-row">
                <template v-if="getImages(item).length">
                  <img :src="getImages(item)[0]" alt="" class="thumb-sm">
                </template>
                <span v-else>📷</span>
              </div>
            </td>
            <td>
              <div class="product-name-cell">
                <div class="name" @click="goToDetail(item)" style="cursor: pointer; color: #3b82f6; font-weight: 500;">{{ item.name }}</div>
                <div class="code" style="font-size: 12px; color: #999;">{{ item.available_product_id }}</div>
              </div>
            </td>
            <td>{{ getCategoryName(item.category_id) }}</td>
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
import { inject, reactive, onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  createAvailableProduct, 
  importAvailableProductsExcel, 
  importAvailableProductsVideosZip, 
  importAvailableProductsImagesZip,
  updateAvailableProduct,
  updateAvailableProductStatus,
  listAvailableProducts,
  searchAvailableProducts
} from '@/api/available_product'
import { getOrderStats, getAvailableProductSalesStats } from '@/api/stats'
import { listCategories } from '@/api/category'

export default {
  name: 'ProductList',
  setup() {
    const showModal = inject('showModal')
    const showToast = inject('showToast')
    const hideToast = inject('hideToast')
    const setUploadProgress = inject('setUploadProgress')
    const endUploadProgress = inject('endUploadProgress')
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
    const applied = reactive({
      keyword: '',
      category: '',
      status: ''
    })
    
    const categoriesMap = ref({})
    const categoryOptions = ref([])
    const loadCategoriesMap = async () => {
      try {
        const res = await listCategories({ page: 1, page_size: 500 })
        const items = (res && res.data && Array.isArray(res.data.items)) ? res.data.items : []
        const map = {}
        items.forEach(c => {
          const id = c.categories_id || c.category_id
          const name = c.name || c.category_name || ''
          if (id) map[id] = name
        })
        categoriesMap.value = map
        const opts = items.map(c => ({ label: c.name || c.category_name || '', value: c.name || c.category_name || '' }))
        categoryOptions.value = opts
      } catch (e) {
        categoriesMap.value = {}
        categoryOptions.value = []
      }
    }
    const getCategoryName = (id) => {
      const k = String(id || '')
      return (categoriesMap.value && categoriesMap.value[k]) || k
    }
    
    const fetchProducts = async () => {
      loading.value = true
      try {
        const baseParams = {
          page: pagination.page,
          page_size: pagination.page_size,
          sort_by: 'created_at',
          sort_order: 'desc'
        }
        const statusNum = applied.status ? (applied.status === '上架' ? 1 : (applied.status === '下架' ? 0 : undefined)) : undefined
        const shouldSearch = !!(applied.keyword || applied.category || (statusNum !== undefined))
        let res
        if (shouldSearch) {
          const params = {
            content: applied.keyword || '',
            category_name: applied.category || '',
            status: statusNum
          }
          res = await searchAvailableProducts(params)
        } else {
          res = await listAvailableProducts(baseParams)
        }
        if (res && res.success) {
          products.value = res.data.items
          pagination.total = res.data.total
        } else {
          const msg = (res && (res.data || res.message)) || '获取商品列表失败'
          showToast(String(msg))
          products.value = []
          pagination.total = 0
        }
      } catch (e) {
        showToast('获取商品列表失败')
      } finally {
        loading.value = false
      }
    }

    const displayProducts = computed(() => {
      let arr = products.value || []
      const kw = String(applied.keyword || '').trim()
      if (kw) {
        arr = arr.filter(it => String(it.name || '').includes(kw) || String(it.available_product_id || '').includes(kw))
      }
      if (applied.category) {
        arr = arr.filter(it => getCategoryName(it.category_id) === applied.category)
      }
      if (applied.status) {
        const target = applied.status === '上架' ? '1' : (applied.status === '下架' ? '0' : '')
        if (target) arr = arr.filter(it => String(it.status) === target)
      }
      return arr
    })

    onMounted(() => {
      loadCategoriesMap()
      fetchProducts()
    })

    const handleSearch = () => {
       applied.keyword = filter.keyword
       applied.category = filter.category
       applied.status = filter.status
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
          sort_order: { label: '推荐值', type: 'number', value: '0' },
          shipping_origin: { label: '发货地', type: 'text', value: '' },
          status: { label: '状态', type: 'select', value: '1', options: [{label:'上架', value:'1'}, {label:'下架', value:'0'}] },
          is_free_shipping: { label: '包邮', type: 'select', value: '1', options: [{label:'是', value:'1'}, {label:'否', value:'0'}] },
          shipping_time_hours: { label: '发货时效(小时)', type: 'number', value: '24' },
          support_no_reason_return_7d: { label: '七天无理由', type: 'select', value: '1', options: [{label:'支持', value:'1'}, {label:'不支持', value:'0'}] },
          main_image: { label: '主图', type: 'file', multiple: true, files: [], maxFiles: 6, hint: '主图最多选择6个文件' },
          images: { label: '轮播图', type: 'file', multiple: true, files: [], maxFiles: 6, hint: '轮播图最多选择6个文件' },
          video_url: { label: '视频', type: 'file', multiple: true, files: [], maxFiles: 2, hint: '视频最多选择2个文件' }
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
          
          if (fields.main_image.files) {
            const files = Array.from(fields.main_image.files)
            files.forEach(f => formData.append('main_image', f))
          }
          if (fields.images.files) {
            const files = Array.from(fields.images.files)
            files.forEach(f => formData.append('images', f))
          }
          if (fields.video_url.files) {
            const files = Array.from(fields.video_url.files)
            files.forEach(f => formData.append('video_url', f))
          }

          try {
            const res = await createAvailableProduct(formData, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在上传商品') })
            if (res && res.success) {
              showToast('新建商品成功')
              endUploadProgress && endUploadProgress()
              fetchProducts()
            } else {
              const msg = (res && (res.data || res.message)) || '新建失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('新建失败: ' + (e.message || '网络错误'))
            endUploadProgress && endUploadProgress()
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
          const loadingToast = showToast({ text: '开始上传...', persist: true })
          if (!fields.file.files || !fields.file.files[0]) {
            hideToast(loadingToast)
            showToast('请选择文件')
            return
          }
          const formData = new FormData()
          formData.append('file', fields.file.files[0])
          try {
            const res = await importAvailableProductsExcel(formData, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在导入Excel') })
            if (res && res.success) {
               hideToast(loadingToast)
               endUploadProgress && endUploadProgress()
               showToast('导入成功')
               if (res.data && res.data.success) {
                 showToast(`成功导入 ${res.data.success_count} 条`)
               }
               fetchProducts() // Refresh list immediately
            } else {
              const body = res || {}
              const title = String(body.message || '导入失败')
              const data = body.data || {}
              const count = typeof data.failure_count === 'number' ? data.failure_count : (Array.isArray(data.failures) ? data.failures.length : 0)
              const failures = Array.isArray(data.failures) ? data.failures : []
              let detail = `${title}\n失败条数：${count}`
              if (failures.length) {
                detail += `\n失败明细：`
                failures.forEach((f, i) => {
                  const row = (f && f.row) != null ? String(f.row) : ''
                  const name = (f && f.name) != null ? String(f.name) : ''
                  const reason = (f && f.reason) != null ? String(f.reason) : ''
                  detail += `\n第${row}行｜${name}｜原因：${reason}`
                })
              }
              hideToast(loadingToast)
              endUploadProgress && endUploadProgress()
              showModal({
                type: 'confirm',
                title: '导入失败',
                message: detail,
                onConfirm: () => {}
              })
            }
          } catch (e) {
            hideToast(loadingToast)
            endUploadProgress && endUploadProgress()
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
          const loadingToast = showToast({ text: '开始上传...', persist: true })
          if (!fields.zip_file.files || !fields.zip_file.files[0]) {
            hideToast(loadingToast)
            showToast('请选择文件')
            return
          }
          const formData = new FormData()
          formData.append('zip_file', fields.zip_file.files[0])
          try {
            const res = await importAvailableProductsImagesZip(formData, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在导入图片Zip') })
            if (res && res.success) {
              hideToast(loadingToast)
              endUploadProgress && endUploadProgress()
              showToast('导入成功')
              fetchProducts() // Refresh list immediately
            } else {
              const body = res || {}
              const title = String(body.message || '导入失败')
              const data = body.data || {}
              const count = typeof data.failure_count === 'number' ? data.failure_count : (Array.isArray(data.failures) ? data.failures.length : 0)
              const failures = Array.isArray(data.failures) ? data.failures : []
              let detail = `${title}\n失败条数：${count}`
              if (failures.length) {
                detail += `\n失败明细：`
                failures.forEach((f, i) => {
                  const row = (f && f.row) != null ? String(f.row) : ''
                  const name = (f && f.name) != null ? String(f.name) : ''
                  const reason = (f && f.reason) != null ? String(f.reason) : ''
                  detail += `\n第${row}行｜${name}｜原因：${reason}`
                })
              }
              hideToast(loadingToast)
              endUploadProgress && endUploadProgress()
              showModal({
                type: 'confirm',
                title: '导入失败',
                message: detail,
                onConfirm: () => {}
              })
            }
          } catch (e) {
            hideToast(loadingToast)
            endUploadProgress && endUploadProgress()
            showToast('导入请求失败')
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
          const loadingToast = showToast({ text: '开始上传...', persist: true })
          if (!fields.zip_file.files || !fields.zip_file.files[0]) {
            hideToast(loadingToast)
            showToast('请选择文件')
            return
          }
          const formData = new FormData()
          formData.append('zip_file', fields.zip_file.files[0])
          try {
            const res = await importAvailableProductsVideosZip(formData, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在导入视频Zip') })
            if (res && res.success) {
              hideToast(loadingToast)
              endUploadProgress && endUploadProgress()
              showToast('导入成功')
              fetchProducts() // Refresh list immediately
            } else {
              const msg = (res && (res.data || res.message)) || '上传失败'
              hideToast(loadingToast)
              endUploadProgress && endUploadProgress()
              showToast(String(msg))
            }
          } catch (e) {
            hideToast(loadingToast)
            endUploadProgress && endUploadProgress()
            showToast('导入请求失败')
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
          sort_order: { label: '推荐值', type: 'number', value: item.sort_order },
          shipping_origin: { label: '发货地', type: 'text', value: item.shipping_origin },
          main_image: { label: '主图(修改则上传)', type: 'file', multiple: true, files: [], maxFiles: 6, hint: '主图最多选择6个文件', existing: (Array.isArray(item.main_image) ? item.main_image : (item.main_image ? [item.main_image] : [])).map(x => String(x)) },
          images: { label: '轮播图(修改则上传)', type: 'file', multiple: true, files: [], maxFiles: 6, hint: '轮播图最多选择6个文件', existing: (Array.isArray(item.images) ? item.images : []).map(x => String(x)) },
          video_url: { label: '视频(修改则上传)', type: 'file', multiple: true, files: [], maxFiles: 2, hint: '视频最多选择2个文件', existing: (Array.isArray(item.video) ? item.video : (Array.isArray(item.video_url) ? item.video_url : (item.video_url ? [item.video_url] : []) )).map(x => String(x)) },
          status: { label: '状态', type: 'select', value: String(item.status), options: [{label:'上架', value:'1'}, {label:'下架', value:'0'}] },
          is_free_shipping: { label: '包邮', type: 'select', value: String(item.is_free_shipping), options: [{label:'是', value:'1'}, {label:'否', value:'0'}] },
          shipping_time_hours: { label: '发货时效(小时)', type: 'number', value: item.shipping_time_hours },
          support_no_reason_return_7d: { label: '七天无理由', type: 'select', value: String(item.support_no_reason_return_7d), options: [{label:'支持', value:'1'}, {label:'不支持', value:'0'}] }
        },
        onConfirm: async (fields) => {
          const initialMain = Array.isArray(item.main_image) ? item.main_image.map(String) : (item.main_image ? [String(item.main_image)] : [])
          const initialImages = Array.isArray(item.images) ? item.images.map(String) : []
          const initialVideos = Array.isArray(item.video_url) ? item.video_url.map(String) : (item.video_url ? [String(item.video_url)] : [])
          // Validation
          if (fields.main_image.files && fields.main_image.files.length > 6) {
            showToast('主图最多选择6个文件，请删除多余文件')
            return
          }
          if (fields.images.files && fields.images.files.length > 6) {
            showToast('轮播图最多选择6个文件，请删除多余文件')
            return
          }
          if (fields.video_url.files && fields.video_url.files.length > 2) {
            showToast('视频最多选择2个文件，请删除多余文件')
            return
          }

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
          
          if (fields.main_image.files) {
            const files = Array.from(fields.main_image.files)
            files.forEach(f => formData.append('main_image', f))
          }
          if (fields.images.files) {
            const files = Array.from(fields.images.files)
            files.forEach(f => formData.append('images', f))
          }
          if (fields.video_url.files) {
            const files = Array.from(fields.video_url.files)
            files.forEach(f => formData.append('video_url', f))
          }
          const currentMain = Array.isArray(fields.main_image.existing) ? fields.main_image.existing.map(String) : []
          const currentImages = Array.isArray(fields.images.existing) ? fields.images.existing.map(String) : []
          const currentVideos = Array.isArray(fields.video_url.existing) ? fields.video_url.existing.map(String) : []
          const removedMain = initialMain.filter(u => !currentMain.includes(String(u)))
          const removedImages = initialImages.filter(u => !currentImages.includes(String(u)))
          const removedVideos = initialVideos.filter(u => !currentVideos.includes(String(u)))
          if (removedMain.length) {
            try { formData.append('remove_main_image', JSON.stringify(removedMain)) } catch (e) {}
          }
          if (removedImages.length) {
            try { formData.append('remove_images', JSON.stringify(removedImages)) } catch (e) {}
          }
          if (removedVideos.length) {
            try { formData.append('remove_video_url', JSON.stringify(removedVideos)) } catch (e) {}
          }

          try {
            const res = await updateAvailableProduct(formData, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在上传商品') })
            if (res && res.success) {
              showToast('更新商品成功')
              endUploadProgress && endUploadProgress()
              fetchProducts()
            } else {
              const msg = (res && (res.data || res.message)) || '更新失败'
              endUploadProgress && endUploadProgress()
              showToast(String(msg))
            }
          } catch (e) {
            showToast('更新失败: ' + (e.message || '网络错误'))
            endUploadProgress && endUploadProgress()
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
        if (res && res.success) {
          showToast('状态更新成功')
          item.status = newStatus
        } else {
          const msg = (res && (res.data || res.message)) || '状态更新失败'
          showToast(String(msg))
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

    const previewImage = (url) => {
      const u = String(url || '').trim()
      if (!u) return
      showModal({ type: 'detail', title: '图片预览', data: [{ label: '', value: u, type: 'image' }] })
    }
    const normalizeUrl = (u) => {
      let s = String(u || '').trim()
      s = s.replace(/^`+|`+$/g, '')
      s = s.replace(/^"+|"+$/g, '')
      s = s.replace(/^'+|'+$/g, '')
      return s
    }
    const getMainImages = (item) => {
      const mains = Array.isArray(item.main_image) ? item.main_image : (item.main_image ? [item.main_image] : [])
      return mains.map(x => normalizeUrl(String(x))).filter(Boolean)
    }
    const getImages = (item) => {
      const arr = Array.isArray(item.images) ? item.images : []
      return arr.map(x => normalizeUrl(String(x))).filter(Boolean)
    }
    const getVideos = (item) => {
      const arr = Array.isArray(item.video) ? item.video
                : (Array.isArray(item.video_url) ? item.video_url
                  : (item.video_url ? [item.video_url] : []))
      return arr.map(x => normalizeUrl(String(x))).filter(Boolean)
    }

    const viewDetail = (item) => {
      const rows = [
        { label: '商品ID', value: String(item.available_product_id || '') },
        { label: '商品名称', value: String(item.name || '') },
        { label: '分类', value: getCategoryName(item.category_id) },
        { label: '推荐值', value: String(item.sort_order || '') },
        { label: '发货地', value: String(item.shipping_origin || '') },
        { label: '状态', value: String(item.status) === '1' ? '上架' : '下架' },
        { label: '创建时间', value: String(item.created_at || '') }
      ]
      const data = []
      const mains = getMainImages(item)
      if (mains.length) data.push({ type: 'image-row', label: '主图', images: mains })
      const imgs = getImages(item)
      if (imgs.length) data.push({ type: 'image-row', label: '商品图片', images: imgs })
      const vids = getVideos(item)
      if (vids.length) data.push({ type: 'video-row', label: '视频', videos: vids })
      rows.forEach(r => data.push(r))
      showModal({ type: 'detail', title: '商品详情', data })
    }

      return {
        loading,
        products,
        displayProducts,
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
      goToDetail,
      getCategoryName,
      getImages,
      previewImage,
      categoryOptions
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
.thumbs-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.thumb-sm {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #e5e7eb;
}
.thumb-more {
  font-size: 12px;
  color: #6b7280;
}
</style>
