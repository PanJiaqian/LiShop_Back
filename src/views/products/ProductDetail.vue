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
                <img v-if="getImageUrl(item)" :src="getImageUrl(item)" alt="" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
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
import { inject, reactive, onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  createProduct, 
  importProductsExcel, 
  importProductsImagesZip, 
  updateProduct, 
  updateProductStatus,
  listProducts,
  searchProducts,
  listProductsByAvailableProduct
} from '@/api/product'
import { listPriceStrategies } from '@/api/prices'
 

export default {
  name: 'ProductDetail',
  setup() {
    const showModal = inject('showModal')
    const showToast = inject('showToast')
    const hideToast = inject('hideToast')
    const setUploadProgress = inject('setUploadProgress')
    const endUploadProgress = inject('endUploadProgress')
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
    const applied = reactive({
      keyword: '',
      status: ''
    })
    
    const availableProductId = computed(() => route.params.id)

    const fetchProducts = async () => {
      loading.value = true
      try {
        const statusSet = applied.status !== '' && applied.status != null
        const shouldSearch = !!(String(applied.keyword || '').trim() || statusSet)
        let res
        if (!availableProductId.value) {
          if (shouldSearch) {
            const params = { content: String(applied.keyword || '').trim(), status: statusSet ? applied.status : undefined }
            res = await searchProducts(params)
          } else {
            const params = {
              page: pagination.page,
              page_size: pagination.page_size,
              keyword: applied.keyword || ''
            }
            if (statusSet) params.status = applied.status
            res = await listProducts(params)
          }
        } else {
          const params = {
            product_id: availableProductId.value,
            page: pagination.page,
            page_size: pagination.page_size,
            sort_by: 'name',
            sort_order: 'desc'
          }
          res = await listProductsByAvailableProduct(params)
        }
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
    watch(() => route.params.id, () => {
      pagination.page = 1
      fetchProducts()
    })

    const handleSearch = () => {
       applied.keyword = filter.keyword
       applied.status = filter.status
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
      const kw = String(applied.keyword || '').trim()
      if (kw) {
        arr = arr.filter(it => String(it.name || '').includes(kw) || String(it.product_id || '').includes(kw))
      }
      if (applied.status !== '' && applied.status != null) {
        arr = arr.filter(it => String(it.status) === String(applied.status))
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
      if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return ''
      return s
    }
    const getImages = (item) => {
      const arr = item && (item.images || item.image_list || [])
      if (Array.isArray(arr) && arr.length) return arr.map(x => String(x)).filter(s => s && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined')
      const single = getImageUrl(item)
      return single ? [single] : []
    }

    // --- Operations copied and adapted from ProductList.vue ---

    const buildStrategyOptions = async () => {
      try {
        const res = await listPriceStrategies({ strategy_id: '', page: 1, page_size: 200, sort_by: '', sort_order: 'desc' })
        const items = (res && res.data && res.data.items) || []
        return items.map(s => {
          const name = String(s.name || '').trim()
          return { label: name || String(s.formula || ''), value: name || String(s.formula || '') }
        })
      } catch (e) { return [] }
    }

    const handleCreateDetailProduct = async () => {
      const strategyOptions = await buildStrategyOptions()
      showModal({
        type: 'form',
        className: 'create-detail-modal',
        title: '新建明细商品',
        fields: {
          name: { label: '明细商品名称', type: 'text', value: '' },
          available_products_name: { label: '关联商品名称', type: 'text', value: '' }, // Could auto-fill this if we had the parent name
          unit: { label: '单位', type: 'text', value: '件' },
          unit_price: { label: '单价', type: 'number', value: '0.00', hint: '该单位价格指代的为1m的价格' },
          additional_price: { label: '附加费', type: 'number', value: '0.00' },
          inventory: { label: '库存', type: 'number', value: '0' },
          
          compute_method: { label: '计算方式', type: 'select', value: '单价', options: [{label:'单价', value:'单价'}, {label:'公式', value:'公式'}], onChange: async (e, fields) => {
            const v = String(fields.compute_method.value || '')
            if (v === '公式') {
              if (!Array.isArray(fields.pricing_type.options) || !fields.pricing_type.options.length) {
                fields.pricing_type.options = await buildStrategyOptions()
              }
              fields.pricing_type.disabled = false
            } else {
              fields.pricing_type.value = ''
              fields.pricing_type.disabled = true
            }
          } },
          has_length: { label: '是否有长度', type: 'select', value: '0', options: [{label:'是', value:'1'}, {label:'否', value:'0'}] },
          length_unit: { label: '长度单位', type: 'select', value: 'm', options: [
            { label: 'cm', value: 'cm' },
            { label: 'mm', value: 'mm' },
            { label: 'dm', value: 'dm' },
            { label: 'm', value: 'm' }
          ] },
          color_temperature: { label: '色温', type: 'text', value: '' },
          pricing_type: { label: '公式名称', type: 'select', value: '', options: strategyOptions, disabled: true },
          
          item_number: { label: '品号', type: 'text', value: '' },
          nuomi_item_number: { label: '诺米品号', type: 'text', value: '' },
          product_type: { label: '商品类型', type: 'select', value: 'normal', options: [{label:'正常生产商品', value:'normal'}, {label:'呆滞商品', value:'stagnant'}] },
          
          max_length: { label: '最大长度', type: 'number', value: '0' },
          min_length: { label: '最小长度', type: 'number', value: '0' },
          length_interval: { label: '长度间隔', type: 'text', value: '无' },
          
          level_discount: { 
            label: '等级折扣', 
            type: 'level-discount', 
            value: '[]',
            entries: [],
            max: 3,
            display: ''
          },
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
          append('item_number')
          append('nuomi_item_number')
          append('product_type')
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
            const res = await createProduct(formData, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在上传图片') })
            if (res && res.success) {
              showToast('创建明细商品成功')
              endUploadProgress && endUploadProgress()
              fetchProducts()
            } else {
              const msg = (res && (res.data || res.message)) || '创建失败'
              endUploadProgress && endUploadProgress()
              showToast(String(msg))
            }
          } catch (e) {
            showToast('创建失败: ' + (e.message || '网络错误'))
            endUploadProgress && endUploadProgress()
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
          const loadingToast = showToast({ text: '开始上传...', persist: true })
          if (!fields.file.files || !fields.file.files[0]) {
            hideToast(loadingToast)
            showToast('请选择文件')
            return
          }
          const formData = new FormData()
          formData.append('file', fields.file.files[0])
          try {
            const res = await importProductsExcel(formData, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在导入Excel') })
            hideToast(loadingToast)
            endUploadProgress && endUploadProgress()
            showModal({
              type: 'result',
              title: '导入结果',
              result: res || {},
              forceConfirm: true,
              onConfirm: () => {}
            })
            if (res && res.success) fetchProducts()
          } catch (e) {
            hideToast(loadingToast)
            endUploadProgress && endUploadProgress()
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
          const loadingToast = showToast({ text: '开始上传...', persist: true })
          if (!fields.zip_file.files || !fields.zip_file.files[0]) {
            hideToast(loadingToast)
            showToast('请选择文件')
            return
          }
          const formData = new FormData()
          formData.append('zip_file', fields.zip_file.files[0])
          try {
            const res = await importProductsImagesZip(formData, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在导入图片Zip') })
            hideToast(loadingToast)
            endUploadProgress && endUploadProgress()
            showModal({
              type: 'result',
              title: '导入结果',
              result: res || {},
              forceConfirm: true,
              onConfirm: () => {}
            })
            if (res && res.success) fetchProducts()
          } catch (e) {
            hideToast(loadingToast)
            endUploadProgress && endUploadProgress()
            showToast('导入请求失败')
          }
        }
      })
    }

    const openUpdateModal = async (item) => {
          const strategyOptions = await buildStrategyOptions()
        showModal({
        type: 'form',
        className: 'update-modal',
        title: '更新明细商品',
        fields: {
          product_id: { label: '明细商品ID', type: 'text', value: item.product_id, readonly: true },
          name: { label: '明细商品名称', type: 'text', value: item.name },
          available_products_name: { label: '关联商品名称', type: 'text', value: item.available_products_id || '' },
          unit: { label: '单位', type: 'text', value: item.unit },
          unit_price: { label: '单价', type: 'number', value: item.unit_price, hint: '该单位价格指代的为1m的价格' },
          additional_price: { label: '附加费', type: 'number', value: item.additional_price },
          inventory: { label: '库存', type: 'number', value: item.inventory },
          
          compute_method: { label: '计算方式', type: 'select', value: (item.compute_method || '单价'), options: [{label:'单价', value:'单价'}, {label:'公式', value:'公式'}], onChange: async (e, fields) => {
            const v = String(fields.compute_method.value || '')
            if (v === '公式') {
              if (!Array.isArray(fields.pricing_type.options) || !fields.pricing_type.options.length) {
                fields.pricing_type.options = await buildStrategyOptions()
              }
              fields.pricing_type.disabled = false
            } else {
              fields.pricing_type.value = ''
              fields.pricing_type.disabled = true
            }
          } },
          has_length: { label: '是否有长度', type: 'select', value: String(item.has_length), options: [{label:'是', value:'1'}, {label:'否', value:'0'}] },
          length_unit: { label: '长度单位', type: 'select', value: item.length_unit || 'm', options: [
            { label: 'cm', value: 'cm' },
            { label: 'mm', value: 'mm' },
            { label: 'dm', value: 'dm' },
            { label: 'm', value: 'm' }
          ] },
          color_temperature: { label: '色温', type: 'text', value: item.color_temperature },
          pricing_type: { label: '公式名称', type: 'select', value: (String(item.compute_method || '') === '公式' ? (item.pricing_type || strategyOptions[0]?.value || '') : ''), options: strategyOptions, disabled: String(item.compute_method || '') !== '公式' },
          item_number: { label: '品号', type: 'text', value: item.item_number || '' },
          nuomi_item_number: { label: '诺米品号', type: 'text', value: item.nuomi_item_number || '' },
          product_type: { label: '商品类型', type: 'select', value: item.product_type || 'normal', options: [{label:'正常生产商品', value:'normal'}, {label:'呆滞商品', value:'stagnant'}] },
          max_length: { label: '最大长度', type: 'number', value: item.max_length },
          min_length: { label: '最小长度', type: 'number', value: item.min_length },
          length_interval: { label: '长度间隔', type: 'text', value: item.length_interval },
          level_discount: { 
            label: '等级折扣', 
            type: 'level-discount', 
            value: (() => {
              const raw = String(item.level_discount || '[]').trim().replace(/^`+|`+$/g, '').replace(/^\"+|\"+$/g, '').replace(/^'+|'+$/g, '')
              return raw
            })(),
            entries: (() => {
              try {
                const v = JSON.parse(String(item.level_discount || '[]'))
                return Array.isArray(v) ? v.map(d => ({ level: String(d.level), discount: String(d.discount) })) : []
              } catch (e) { return [] }
            })(),
            max: 3,
            display: (() => {
              try {
                const v = JSON.parse(String(item.level_discount || '[]'))
                const arr = Array.isArray(v) ? v : []
                return arr.map(d => `等级${d.level}:${d.discount}`).join('; ')
              } catch (e) { return '' }
            })()
          },
          product_category: { label: '产品分类', type: 'text', value: item.product_category },
          specification: { label: '规格', type: 'text', value: item.specification },
          color: { label: '颜色', type: 'text', value: item.color },
          model: { label: '型号', type: 'text', value: item.model },
          status: { label: '状态', type: 'select', value: String(item.status), options: [{label:'上架', value:'1'}, {label:'下架', value:'0'}] },
          image: { label: '图片(修改则上传)', type: 'file', multiple: false, files: null, existing: getImages(item) }
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
            append('item_number')
            append('nuomi_item_number')
            append('product_type')
            append('max_length')
            append('min_length')
            append('length_interval')
            formData.append('level_discount', String(fields.level_discount.value || '[]'))
            append('product_category')
            append('specification')
            append('color')
            append('model')
            append('inventory')

            if (fields.image.files && fields.image.files[0]) {
                formData.append('image', fields.image.files[0])
            }
            const initialImages = getImages(item).map(String)
            const currentImages = Array.isArray(fields.image.existing) ? fields.image.existing.map(String) : []
            const removedImages = initialImages.filter(u => !currentImages.includes(String(u)))
            if (removedImages.length) {
              try { formData.append('remove_image', JSON.stringify(removedImages)) } catch (e) {}
            }

            try {
                const res = await updateProduct(formData, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在上传图片') })
                if (res && res.success) {
                    showToast('更新明细商品成功')
                    try {
                      await updateProductStatus({ product_id: fields.product_id.value, status: fields.status.value })
                    } catch (e) {}
                    endUploadProgress && endUploadProgress()
                    fetchProducts()
                } else {
                    const msg = (res && (res.data || res.message)) || '更新失败'
                    endUploadProgress && endUploadProgress()
                    showToast(String(msg))
                }
            } catch (e) {
                showToast('更新请求失败')
                endUploadProgress && endUploadProgress()
            }
        }
      })
    }

   const viewDetail = (item) => {
      const rows = [
        { label: '明细商品ID', value: String(item.product_id || '') },
        { label: '明细商品名称', value: String(item.name || '') },
        { label: '关联商品名称', value: String(item.available_products_id || '') },
        { label: '单位', value: String(item.unit || '') },
        { label: '单价', value: String(item.unit_price || '') },
        { label: '附加费', value: String(item.additional_price || '') },
        { label: '库存', value: String(item.inventory || '') },
        { label: '计算方式', value: String(item.compute_method || '') },
        { label: '是否有长度', value: String(item.has_length) === '1' ? '是' : '否' },
        { label: '长度单位', value: String(item.length_unit || '') },
        { label: '色温', value: String(item.color_temperature || '') },
        { label: '定价类型', value: String(item.pricing_type || '') },
        { label: '品号', value: String(item.item_number || '') },
        { label: '诺米品号', value: String(item.nuomi_item_number || '') },
        { label: '商品类型', value: String((item.product_type === 'stagnant') ? '呆滞商品' : '正常生产商品') },
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
      const imgs = getImages(item)
      if (imgs.length) {
        imgs.forEach((src, i) => data.push({ label: i === 0 ? '商品图片' : '', value: src, type: 'image' }))
      }
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
           { label: 'dm', value: 'dm' },
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
      pagination,
      filter,
      displayProducts,
      handleSearch,
      resetFilter,
      changePage,
      previewImage,
      getImageUrl,
      getImages,
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
