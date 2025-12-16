<template>
  <div>
    <div class="page-title">
      <div class="title-row">
        <span style="margin-right: 12px; cursor: pointer; color: #6b7280;" @click="$router.back()">
          ⬅返回列表
        </span>
        <!-- <span>商品明细</span> -->
      </div>
      <div class="actions">
        <button class="btn-sm primary" @click="handleImportDetailExcel">导入明细Excel</button>
        <button class="btn-sm primary" @click="handleImportDetailImages">导入明细图片Zip</button>
        <button class="btn-sm primary" @click="handleCreateDetailProduct">新建明细商品</button>
        <!-- <button class="btn-sm secondary" @click="handleUpdateDetailProduct">更新明细商品</button> -->
        <!-- <button class="btn-sm secondary" @click="handleToggleDetailStatus">更改明细商品状态</button> -->
      </div>
    </div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="搜索明细商品..." v-model="filter.keyword" />
        <select class="form-select" v-model="filter.status">
          <option value="">所有状态</option>
          <option value="1">上架</option>
          <option value="0">下架</option>
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
            <th>明细名称 / ID</th>
            <th>单位</th>
            <th>单价</th>
            <th>库存</th>
            <th>计算方式</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="products.length === 0">
            <td colspan="9" style="text-align: center; padding: 20px; color: #999;">暂无明细数据</td>
          </tr>
          <tr v-for="item in displayProducts" :key="item.product_id">
            <td>
              <div class="product-thumb">
                <img v-if="getImageUrl(item)" :src="getImageUrl(item)" alt="" @click="previewImage(getImageUrl(item))" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; cursor: pointer;">
                <span v-else>📷</span>
              </div>
            </td>
            <td>
              <div class="product-name-cell">
                <div class="name">{{ item.name }}</div>
                <div class="code" style="font-size: 12px; color: #999;">{{ item.product_id }}</div>
              </div>
            </td>
            <!-- <td>{{ item.available_products_name }}</td> -->
            <td>{{ item.unit }}</td>
            <td>¥{{ item.unit_price }}</td>
            <td>{{ item.inventory }}</td>
            <td>{{ item.compute_method }}</td>
            <td>
              <span 
                class="badge" 
                :class="String(item.status) === '1' ? 'success' : 'gray'"
              >
                {{ String(item.status) === '1' ? '上架' : '下架' }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="viewDetail(item)">详情</button>
                <button class="btn-link" @click="openUpdateModal(item)">编辑</button>
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
          <button class="btn-sm" :disabled="products.length < pagination.page_size" @click="changePage(pagination.page + 1)">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, reactive, onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  createProduct, 
  importProductsExcel, 
  importProductsImagesZip, 
  updateProduct, 
  updateProductStatus,
  listProducts
} from '@/api/product'
 

export default {
  name: 'ProductDetail',
  setup() {
    const showModal = inject('showModal')
    const showToast = inject('showToast')
    const hideToast = inject('hideToast')
    const route = useRoute()
    
    const loading = ref(false)
    const products = ref([])
    const pagination = reactive({
      page: 1,
      page_size: 20,
      total: 0
    })

    const filter = reactive({
      keyword: '',
      status: ''
    })
    
    // Get available_product_id from route params
    const availableProductId = route.params.id

    const fetchProducts = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          page_size: pagination.page_size,
          available_product_id: availableProductId, // Filter by parent ID
          keyword: filter.keyword
        }
        if (filter.status !== '') params.status = filter.status
        
        const res = await listProducts(params)
        if (res.success) {
          products.value = res.data.items || []
          pagination.total = res.data.total || 0
        } else {
          // If API fails or returns no data structure we expect
          products.value = []
          pagination.total = 0
        }
      } catch (e) {
        showToast('获取明细列表失败')
        console.error(e)
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
      filter.status = ''
      handleSearch()
    }

    const displayProducts = computed(() => {
      let arr = products.value || []
      const kw = String(filter.keyword || '').trim()
      if (kw) {
        arr = arr.filter(it => String(it.name || '').includes(kw) || String(it.product_id || '').includes(kw))
      }
      if (filter.status !== '' && filter.status != null) {
        arr = arr.filter(it => String(it.status) === String(filter.status))
      }
      return arr
    })
    
    const changePage = (page) => {
      pagination.page = page
      fetchProducts()
    }

    const previewImage = (url) => {
      if (!url) return
      showModal({ type: 'detail', title: '图片预览', data: [{ label: '', value: url, type: 'image' }] })
    }

    const getImageUrl = (item) => {
      const u = item && (item.image_url || item.image || item.imageUrl || item.img_url)
      if (!u) return ''
      let s = String(u).trim()
      s = s.replace(/^`+|`+$/g, '')
      s = s.replace(/^"+|"+$/g, '')
      s = s.replace(/^'+|'+$/g, '')
      return s
    }

    // --- Operations copied and adapted from ProductList.vue ---

    const handleCreateDetailProduct = () => {
      showModal({
        type: 'form',
        title: '新建明细商品',
        fields: {
          name: { label: '明细商品名称', type: 'text', value: '' },
          available_products_name: { label: '关联商品名称', type: 'text', value: '' }, // Could auto-fill this if we had the parent name
          unit: { label: '单位', type: 'text', value: '件' },
          unit_price: { label: '单价', type: 'number', value: '0.00', hint: '该单位价格指代的为1m的价格' },
          additional_price: { label: '附加费', type: 'number', value: '0.00' },
          inventory: { label: '库存', type: 'number', value: '0' },
          
          compute_method: { label: '计算方式', type: 'select', value: '直接', options: [{label:'直接', value:'直接'}, {label:'公式', value:'公式'}] },
          has_length: { label: '是否有长度', type: 'select', value: '0', options: [{label:'是', value:'1'}, {label:'否', value:'0'}] },
          length_unit: { label: '长度单位', type: 'select', value: 'm', options: [
            { label: 'cm', value: 'cm' },
            { label: 'mm', value: 'mm' },
            { label: 'm', value: 'm' }
          ] },
          color_temperature: { label: '色温', type: 'text', value: '' },
          pricing_type: { label: '定价类型', type: 'select', value: 'fixed', options: [{label:'固定', value:'fixed'}, {label:'全部定价', value:'all_pricing'}] },
          
          max_length: { label: '最大长度', type: 'number', value: '0' },
          min_length: { label: '最小长度', type: 'number', value: '0' },
          length_interval: { label: '长度间隔', type: 'text', value: '无' },
          
          level_discount: { label: '等级折扣(JSON)', type: 'text', value: '[]' },
          product_category: { label: '产品分类', type: 'text', value: '' },
          specification: { label: '规格', type: 'text', value: '' },
          color: { label: '颜色', type: 'text', value: '' },
          model: { label: '型号', type: 'text', value: '' },
          image: { label: '图片', type: 'file', multiple: false, files: null }
        },
        onConfirm: async (fields) => {
          const formData = new FormData()
          // We should probably auto-associate with the current available_product_id if the API supports it
          // But based on previous code, it seems to rely on 'available_products_name' or maybe it's missing the ID link?
          // The previous code didn't use ID. Let's stick to the previous implementation but maybe user wants to fill it.
          // Actually, if we are in detail page, we should probably pass the ID.
          // But I'll stick to the exact fields from before to avoid breaking API expectations unless necessary.
          
          const append = (key) => formData.append(key, fields[key].value)
          
          append('name')
          append('available_products_name')
          append('unit')
          append('unit_price')
          append('additional_price')
          append('compute_method')
          append('has_length')
          append('length_unit')
          append('color_temperature')
          append('pricing_type')
          append('max_length')
          append('min_length')
          append('length_interval')
          append('level_discount')
          append('product_category')
          append('specification')
          append('color')
          append('model')
          append('inventory')

          if (fields.image.files && fields.image.files[0]) {
            formData.append('image', fields.image.files[0])
          }

          try {
            const res = await createProduct(formData)
            if (res && res.success) {
              showToast('创建明细商品成功')
              fetchProducts()
            } else {
              const msg = (res && (res.data || res.message)) || '创建失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('创建失败: ' + (e.message || '网络错误'))
          }
        }
      })
    }

    const handleImportDetailExcel = () => {
      showModal({
        type: 'form',
        title: '导入明细商品Excel',
        fields: {
          file: { label: '选择Excel文件', type: 'file', multiple: false, files: null }
        },
        onConfirm: async (fields) => {
          const loading = showToast({ text: '正在导入...', persist: true })
          if (!fields.file.files || !fields.file.files[0]) {
            hideToast(loading)
            showToast('请选择文件')
            return
          }
          const formData = new FormData()
          formData.append('file', fields.file.files[0])
          try {
            const res = await importProductsExcel(formData)
            if (res && res.success) {
               hideToast(loading)
               showToast('导入成功')
               if (res.data && res.data.success) {
                 showToast(`成功导入 ${res.data.success_count} 条`)
               }
               fetchProducts()
            } else {
              const msg = (res && (res.data || res.message)) || '导入失败'
              hideToast(loading)
              showToast(String(msg))
            }
          } catch (e) {
            hideToast(loading)
            showToast('导入请求失败')
          }
        }
      })
    }

    const handleImportDetailImages = () => {
      showModal({
        type: 'form',
        title: '导入明细图片Zip',
        fields: {
          zip_file: { label: '选择Zip文件', type: 'file', multiple: false, files: null }
        },
        onConfirm: async (fields) => {
          const loading = showToast({ text: '正在导入...', persist: true })
          if (!fields.zip_file.files || !fields.zip_file.files[0]) {
            hideToast(loading)
            showToast('请选择文件')
            return
          }
          const formData = new FormData()
          formData.append('zip_file', fields.zip_file.files[0])
          try {
            const res = await importProductsImagesZip(formData)
            if (res && res.success) {
              hideToast(loading)
              showToast('导入成功')
              fetchProducts()
            } else {
              const msg = (res && (res.data || res.message)) || '上传失败'
              hideToast(loading)
              showToast(String(msg))
            }
          } catch (e) {
            hideToast(loading)
            showToast('导入请求失败')
          }
        }
      })
    }

    const openUpdateModal = (item) => {
        showModal({
        type: 'form',
        title: '更新明细商品',
        fields: {
          product_id: { label: '明细商品ID', type: 'text', value: item.product_id, readonly: true },
          name: { label: '明细商品名称', type: 'text', value: item.name },
          available_products_name: { label: '关联商品名称', type: 'text', value: item.available_products_name || '' },
          unit: { label: '单位', type: 'text', value: item.unit },
          unit_price: { label: '单价', type: 'number', value: item.unit_price, hint: '该单位价格指代的为1m的价格' },
          additional_price: { label: '附加费', type: 'number', value: item.additional_price },
          inventory: { label: '库存', type: 'number', value: item.inventory },
          compute_method: { label: '计算方式', type: 'select', value: item.compute_method, options: [{label:'直接', value:'直接'}, {label:'公式', value:'公式'}] },
          has_length: { label: '是否有长度', type: 'select', value: String(item.has_length), options: [{label:'是', value:'1'}, {label:'否', value:'0'}] },
          length_unit: { label: '长度单位', type: 'select', value: item.length_unit || 'm', options: [
            { label: 'cm', value: 'cm' },
            { label: 'mm', value: 'mm' },
            { label: 'm', value: 'm' }
          ] },
          color_temperature: { label: '色温', type: 'text', value: item.color_temperature },
          pricing_type: { label: '定价类型', type: 'select', value: item.pricing_type, options: [{label:'固定', value:'fixed'}, {label:'全部定价', value:'all_pricing'}] },
          max_length: { label: '最大长度', type: 'number', value: item.max_length },
          min_length: { label: '最小长度', type: 'number', value: item.min_length },
          length_interval: { label: '长度间隔', type: 'text', value: item.length_interval },
          level_discount: { label: '等级折扣(JSON)', type: 'text', value: item.level_discount },
          product_category: { label: '产品分类', type: 'text', value: item.product_category },
          specification: { label: '规格', type: 'text', value: item.specification },
          color: { label: '颜色', type: 'text', value: item.color },
          model: { label: '型号', type: 'text', value: item.model },
          status: { label: '状态', type: 'select', value: String(item.status), options: [{label:'上架', value:'1'}, {label:'下架', value:'0'}] },
          image: { label: '图片(修改则上传)', type: 'file', multiple: false, files: null }
        },
        onConfirm: async (fields) => {
            const formData = new FormData()
            const append = (key) => formData.append(key, fields[key].value)
            append('product_id')
            append('name')
            append('available_products_name')
            append('unit')
            append('unit_price')
            append('additional_price')
            append('compute_method')
            append('has_length')
            append('color_temperature')
            append('length_unit')
            append('pricing_type')
            append('max_length')
            append('min_length')
            append('length_interval')
            append('level_discount')
            append('product_category')
            append('specification')
            append('color')
            append('model')
            append('inventory')

            if (fields.image.files && fields.image.files[0]) {
                formData.append('image', fields.image.files[0])
            }

            try {
                const res = await updateProduct(formData)
                if (res && res.success) {
                    showToast('更新明细商品成功')
                    try {
                      await updateProductStatus({ product_id: fields.product_id.value, status: fields.status.value })
                    } catch (e) {}
                    fetchProducts()
                } else {
                    const msg = (res && (res.data || res.message)) || '更新失败'
                    showToast(String(msg))
                }
            } catch (e) {
                showToast('更新请求失败')
            }
        }
      })
    }

   const viewDetail = (item) => {
      const rows = [
        { label: '明细商品ID', value: String(item.product_id || '') },
        { label: '明细商品名称', value: String(item.name || '') },
        { label: '关联商品名称', value: String(item.available_products_name || '') },
        { label: '单位', value: String(item.unit || '') },
        { label: '单价', value: String(item.unit_price || '') },
        { label: '附加费', value: String(item.additional_price || '') },
        { label: '库存', value: String(item.inventory || '') },
        { label: '计算方式', value: String(item.compute_method || '') },
        { label: '是否有长度', value: String(item.has_length) === '1' ? '是' : '否' },
        { label: '长度单位', value: String(item.length_unit || '') },
        { label: '色温', value: String(item.color_temperature || '') },
        { label: '定价类型', value: String(item.pricing_type || '') },
        { label: '最大长度', value: String(item.max_length || '') },
        { label: '最小长度', value: String(item.min_length || '') },
        { label: '长度间隔', value: String(item.length_interval || '') },
        { label: '等级折扣', value: String(item.level_discount || '') },
        { label: '产品分类', value: String(item.product_category || '') },
        { label: '规格', value: String(item.specification || '') },
        { label: '颜色', value: String(item.color || '') },
        { label: '型号', value: String(item.model || '') },
        { label: '状态', value: String(item.status) === '1' ? '上架' : '下架' }
      ]
      const data = []
      const img = getImageUrl(item)
      if (img) data.push({ label: '商品图片', value: img, type: 'image' })
      rows.forEach(r => data.push(r))
      showModal({ type: 'detail', title: '明细商品详情', data })
    }


    const handleUpdateDetailProduct = () => {
       // This is the manual ID entry version from previous requirement
       showModal({
        type: 'form',
       title: '更新明细商品(输入ID)',
       fields: {
         product_id: { label: '明细商品ID', type: 'text', value: '' },
         name: { label: '明细商品名称', type: 'text', value: '' },
         // ... (simplified for manual entry, or same full fields)
         // To save space, I'll just use the same full fields but empty
         available_products_name: { label: '关联商品名称', type: 'text', value: '' },
         unit: { label: '单位', type: 'text', value: '件' },
          unit_price: { label: '单价', type: 'number', value: '0.00', hint: '该单位价格指代的为1m的价格' },
         additional_price: { label: '附加费', type: 'number', value: '0.00' },
         inventory: { label: '库存', type: 'number', value: '0' },
         compute_method: { label: '计算方式', type: 'select', value: '直接', options: [{label:'直接', value:'直接'}, {label:'公式', value:'公式'}] },
         has_length: { label: '是否有长度', type: 'select', value: '0', options: [{label:'是', value:'1'}, {label:'否', value:'0'}] },
         length_unit: { label: '长度单位', type: 'select', value: 'm', options: [
           { label: 'cm', value: 'cm' },
           { label: 'mm', value: 'mm' },
           { label: 'm', value: 'm' }
         ] },
         color_temperature: { label: '色温', type: 'text', value: '' },
         pricing_type: { label: '定价类型', type: 'select', value: 'fixed', options: [{label:'固定', value:'fixed'}, {label:'全部定价', value:'all_pricing'}] },
         max_length: { label: '最大长度', type: 'number', value: '0' },
         min_length: { label: '最小长度', type: 'number', value: '0' },
         length_interval: { label: '长度间隔', type: 'text', value: '无' },
         level_discount: { label: '等级折扣(JSON)', type: 'text', value: '[]' },
         product_category: { label: '产品分类', type: 'text', value: '' },
         specification: { label: '规格', type: 'text', value: '' },
         color: { label: '颜色', type: 'text', value: '' },
         model: { label: '型号', type: 'text', value: '' },
         image: { label: '图片', type: 'file', multiple: false, files: null }
       },
        onConfirm: async (fields) => {
            const formData = new FormData()
            const append = (key) => formData.append(key, fields[key].value)
            append('product_id')
            append('name')
            // ... append all ...
            append('available_products_name')
            append('unit')
            append('unit_price')
            append('additional_price')
            append('compute_method')
            append('has_length')
            append('color_temperature')
            append('length_unit')
            append('pricing_type')
            append('max_length')
            append('min_length')
            append('length_interval')
            append('level_discount')
            append('product_category')
            append('specification')
            append('color')
            append('model')
            append('inventory')
            
            if (fields.image.files && fields.image.files[0]) {
                formData.append('image', fields.image.files[0])
            }

            try {
                const res = await updateProduct(formData)
                if (res && res.success) {
                    showToast('更新明细商品成功')
                    fetchProducts()
                } else {
                    const msg = (res && (res.data || res.message)) || '更新失败'
                    showToast(String(msg))
                }
            } catch (e) {
                showToast('更新请求失败')
            }
        }
      })
    }

    const handleToggleDetailStatus = () => {
      showModal({
        type: 'form',
        title: '更改明细商品状态',
        fields: {
          product_id: { label: '明细商品ID', type: 'text', value: '' },
          status: { label: '状态', type: 'select', value: '1', options: [{label:'上架', value:'1'}, {label:'下架', value:'0'}] }
        },
        onConfirm: async (fields) => {
          try {
            const res = await updateProductStatus({
              product_id: fields.product_id.value,
              status: fields.status.value
            })
            if (res && res.success) {
              showToast('更改明细商品状态成功')
              fetchProducts()
            } else {
              const msg = (res && (res.data || res.message)) || '更改失败'
              showToast(String(msg))
            }
          } catch (e) {
            showToast('更改请求失败')
          }
        }
      })
    }

    return {
      loading,
      products,
      displayProducts,
      pagination,
      filter,
      handleSearch,
      resetFilter,
      changePage,
      previewImage,
      getImageUrl,
      handleCreateDetailProduct,
      handleImportDetailExcel,
      handleImportDetailImages,
      handleUpdateDetailProduct,
      handleToggleDetailStatus,
      openUpdateModal,
      viewDetail
    }
  }
}
</script>

<style scoped>
.title-row {
  display: flex;
  align-items: center;
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

.product-name-cell { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; justify-content: center; white-space: normal; }
.product-thumb { display: inline-flex; align-items: center; justify-content: center; }
.badge.success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 4px; }
.badge.gray { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 4px; }
.actions { display: flex; gap: 12px; justify-content: center; }
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
