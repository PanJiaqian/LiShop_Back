<!--
  模块: 明细商品页
  作用: 管理端明细商品的列表与维护入口，支持导入明细 Excel/图片与新建明细商品
-->
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
            <!-- <th width="80">图片</th> -->
            <th>明细名称 / ID</th>
            <th>单位</th>
            <th>单价</th>
            <th>包装费规格</th>
            <th>库存</th>
            <th>计算方式</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="products.length === 0">
            <td colspan="8" style="text-align: center; padding: 20px; color: #999;">暂无明细数据</td>
          </tr>
          <tr v-for="item in displayProducts" :key="item.product_id">
            <!-- <td>
              <div class="product-thumb">
                <img v-if="getImageUrl(item)" :src="getImageUrl(item)" alt="" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                <span v-else>📷</span>
              </div>
            </td> -->
            <td>
              <div class="product-name-cell">
                <div class="name">{{ item.name }}</div>
                <div class="code" style="font-size: 12px; color: #999;">{{ item.product_id }}</div>
              </div>
            </td>
            <!-- <td>{{ item.available_products_name }}</td> -->
            <td>{{ item.unit }}</td>
            <td>¥{{ item.unit_price }}</td>
            <td>{{ getPackageFeeName(item.package_id) }}</td>
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
                <button class="btn-link danger" @click="removeDetailProduct(item)">删除</button>
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
  listProductsByAvailableProduct,
  deleteProductDetail
} from '@/api/product'
import { listPriceStrategies } from '@/api/prices'
import { listPackageFeeOptions } from '@/api/package_fee'

export default {
  name: 'ProductDetail',
  setup () {
    const showModal = inject('showModal')
    const showToast = inject('showToast')
    const hideToast = inject('hideToast')
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
    const productsIdQuery = computed(() => route.query.products_id)
    const availableProductNameQuery = computed(() => String(route.query.available_products_name || '').trim())
    const isAvailableProductContext = computed(() => !!String(availableProductId.value || '').trim())
    const currentAvailableProductName = computed(() => {
      if (availableProductNameQuery.value) return availableProductNameQuery.value
      const firstProduct = Array.isArray(products.value) ? products.value[0] : null
      const fallbackName = firstProduct && (firstProduct.available_products_name || firstProduct.available_product_name)
      return String(fallbackName || '').trim()
    })

    const cachedPackageOptions = ref([])
    const fetchPackageOptions = async () => {
      try {
        const res = await listPackageFeeOptions()
        const items = (res && res.data && res.data.items) || []
        const options = [{ label: '无', value: '' }]
        items.forEach(f => {
          options.push({ label: `${f.name} (¥${f.price})`, value: f.package_id })
        })
        cachedPackageOptions.value = options
      } catch (e) {
        cachedPackageOptions.value = [{ label: '无', value: '' }]
      }
    }

    const getPackageFeeName = (id) => {
      if (!id) return '无'
      const opt = cachedPackageOptions.value.find(o => o.value === id)
      return opt ? opt.label : id
    }

    const fetchProducts = async () => {
      loading.value = true
      try {
        const statusSet = applied.status !== '' && applied.status != null
        const shouldSearch = !!(String(applied.keyword || '').trim() || statusSet)
        let res
        if (productsIdQuery.value) {
          const params = {
            products_id: String(productsIdQuery.value),
            page: pagination.page,
            page_size: pagination.page_size,
            sort_by: 'name',
            sort_order: 'desc'
          }
          res = await listProducts(params)
        } else if (!availableProductId.value) {
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
          showToast(resolveApiMessage(res, '获取明细列表失败'))
          products.value = []
          pagination.total = 0
        }
      } catch (e) {
        showToast(resolveApiMessage(e, '获取明细列表失败'))
        console.error(e)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchPackageOptions()
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

    const displayContentLabelToKey = {
      名称: 'name',
      规格: 'specification',
      色温: 'color_temperature',
      颜色: 'color',
      型号: 'model',
      品号: 'item_number',
      诺米品号: 'nuomi_item_number',
      产品类别: 'product_category'
    }
    const displayContentKeyToLabel = Object.keys(displayContentLabelToKey).reduce((acc, k) => {
      acc[displayContentLabelToKey[k]] = k
      return acc
    }, {})
    const displayContentOptions = Object.keys(displayContentLabelToKey).map(label => ({ label, value: label }))
    const normalizeDisplayContentLabel = (v) => {
      const s = String(v || '').trim()
      if (!s) return ''
      if (displayContentLabelToKey[s]) return s
      if (displayContentKeyToLabel[s]) return displayContentKeyToLabel[s]
      return s
    }

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

    const buildPackageFeeOptions = async () => {
      try {
        const res = await listPackageFeeOptions()
        const items = (res && res.data && res.data.items) || []
        const options = [{ label: '无', value: '' }]
        items.forEach(f => {
          options.push({ label: `${f.name} (¥${f.price})`, value: f.package_id })
        })
        return options
      } catch (e) { return [{ label: '无', value: '' }] }
    }

    /**
     * 构建“关联商品名称”字段配置。
     *
     * @returns {Object} 表单字段配置
     */
    const buildAvailableProductNameField = () => ({
      label: '关联商品名称',
      required: true,
      type: 'text',
      value: isAvailableProductContext.value ? currentAvailableProductName.value : '',
      readonly: isAvailableProductContext.value
    })

    const resolveAvailableProductsName = (item) => {
      if (isAvailableProductContext.value) return String(currentAvailableProductName.value || '').trim()
      const v = item && (item.available_products_name || item.available_product_name || item.available_products_id)
      return String(v || '').trim()
    }

    const buildLevelDiscountField = (item) => {
      const raw = item ? String(item.level_discount || '[]').trim().replace(/^`+|`+$/g, '').replace(/^\"+|\"+$/g, '').replace(/^'+|'+$/g, '') : '[]'
      const entries = (() => {
        if (!item) return []
        try {
          const v = JSON.parse(String(item.level_discount || '[]'))
          return Array.isArray(v) ? v.map(d => ({ level: String(d.level), discount: String(d.discount) })) : []
        } catch (e) { return [] }
      })()
      const display = (() => {
        if (!item) return ''
        try {
          const v = JSON.parse(String(item.level_discount || '[]'))
          const arr = Array.isArray(v) ? v : []
          return arr.map(d => `等级${d.level}:${d.discount}`).join('; ')
        } catch (e) { return '' }
      })()
      return { label: '等级折扣', type: 'level-discount', value: raw || '[]', entries, max: 3, display }
    }

    const openDetailProductFormModal = async ({ mode, item }) => {
      const isCreate = mode === 'create'
      const isUpdate = mode === 'update'
      const isUpdateById = mode === 'updateById'

      if (isCreate && isAvailableProductContext.value && !currentAvailableProductName.value) {
        showToast('未获取到所属商品名称，请返回母商品列表后重新进入')
        return
      }

      const strategyOptions = await buildStrategyOptions()
      const packageFeeOptions = await buildPackageFeeOptions()
      const availableProductsName = resolveAvailableProductsName(item)

      const createBaseFields = () => {
        const computeMethodValue = item ? String(item.compute_method || '单价') : '单价'
        const initialPricingValue = computeMethodValue === '公式'
          ? (item ? (item.pricing_type || strategyOptions[0]?.value || '') : '')
          : ''

        return {
          name: { label: '明细商品名称', required: true, type: 'text', value: item ? String(item.name || '') : '' },
          display_content: { label: '前台显示内容', type: 'select', value: (item ? (normalizeDisplayContentLabel(item.display_content) || '名称') : '名称'), options: displayContentOptions },
          available_products_name: {
            label: '关联商品名称',
            required: true,
            type: 'text',
            value: isAvailableProductContext.value ? String(currentAvailableProductName.value || '').trim() : (availableProductsName || ''),
            readonly: isAvailableProductContext.value
          },
          unit: { label: '单位', required: true, type: 'text', value: item ? String(item.unit || '件') : '件' },
          unit_price: { label: '单价', required: true, type: 'number', value: item ? String(item.unit_price ?? '0.00') : '0.00', hint: '该单位价格指代的为1m的价格' },
          additional_price: { label: '附加费', type: 'number', value: item ? String(item.additional_price ?? '0.00') : '0.00' },
          inventory: { label: '库存', type: 'number', value: item ? String(item.inventory ?? '0') : '0', hint: '当商品类型为“呆滞商品”时必须填写库存' },

          compute_method: {
            label: '计算方式',
            type: 'select',
            value: computeMethodValue,
            options: [{ label: '单价', value: '单价' }, { label: '公式', value: '公式' }],
            onChange: async (e, fields) => {
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
            }
          },
          has_length: { label: '是否有长度', type: 'select', value: item ? String(item.has_length ?? '0') : '0', options: [{ label: '是', value: '1' }, { label: '否', value: '0' }] },
          length_unit: {
            label: '长度单位',
            type: 'select',
            value: item ? String(item.length_unit || 'm') : 'm',
            options: [
              { label: 'cm', value: 'cm' },
              { label: 'mm', value: 'mm' },
              { label: 'dm', value: 'dm' },
              { label: 'm', value: 'm' }
            ]
          },
          color_temperature: { label: '色温', type: 'text', value: item ? String(item.color_temperature || '') : '' },
          pricing_type: { label: '公式名称', type: 'select', value: initialPricingValue, options: strategyOptions, disabled: computeMethodValue !== '公式' },

          item_number: { label: '品号', type: 'text', value: item ? String(item.item_number || '') : '' },
          nuomi_item_number: { label: '诺米品号', type: 'text', value: item ? String(item.nuomi_item_number || '') : '' },
          product_type: { label: '商品类型', type: 'select', value: item ? String(item.product_type || 'normal') : 'normal', options: [{ label: '正常生产商品', value: 'normal' }, { label: '呆滞商品', value: 'stagnant' }] },

          package_id: { label: '包装费规格', type: 'select', value: item ? String(item.package_id || '') : '', options: packageFeeOptions, hint: '选择包装费计费ID' },

          max_length: { label: '最大长度', type: 'number', value: item ? String(item.max_length ?? '0') : '0', hint: '当“是否有长度”选择“是”时必须填写，且需大于0' },
          min_length: { label: '最小长度', type: 'number', value: item ? String(item.min_length ?? '0') : '0', hint: '当“是否有长度”选择“是”时必须填写，且需大于0' },
          length_interval: { label: '长度间隔', type: 'text', value: item ? String(item.length_interval ?? '无') : '无' },

          level_discount: buildLevelDiscountField(item),
          product_category: { label: '产品分类', type: 'text', value: item ? String(item.product_category || '') : '' },
          specification: { label: '规格', type: 'text', value: item ? String(item.specification || '') : '' },
          color: { label: '颜色', type: 'text', value: item ? String(item.color || '') : '' },
          model: { label: '型号', type: 'text', value: item ? String(item.model || '') : '' },
          custom_param1_value: { label: '自定义参数1值', type: 'text', value: item ? String(item.custom_param1_value || '') : '' },
          custom_param2_value: { label: '自定义参数2值', type: 'text', value: item ? String(item.custom_param2_value || '') : '' }
          // image: isUpdate || isUpdateById
          //   ? { label: '图片(修改则上传)', type: 'file', multiple: false, files: null, existing: item ? getImages(item) : [] }
          //   : { label: '图片', type: 'file', multiple: false, files: null }
        }
      }

      const fields = (() => {
        const base = createBaseFields()
        if (!isCreate) {
          const productIdReadonly = isUpdate
          return {
            product_id: { label: '明细商品ID', type: 'text', value: item ? String(item.product_id || '') : '', readonly: productIdReadonly },
            ...base,
            status: { label: '状态', type: 'select', value: item ? String(item.status ?? '1') : '1', options: [{ label: '上架', value: '1' }, { label: '下架', value: '0' }] }
          }
        }
        return base
      })()

      const title = isCreate ? '新建明细商品' : (isUpdateById ? '更新明细商品(输入ID)' : '更新明细商品')
      const className = isCreate ? 'create-detail-modal' : 'update-modal'

      showModal({
        type: 'form',
        className,
        title,
        fields,
        onConfirm: async (fields) => {
          const formData = new FormData()
          const append = (key) => formData.append(key, fields[key].value)
          const availableProductsName = isAvailableProductContext.value
            ? String(currentAvailableProductName.value || '').trim()
            : String(fields.available_products_name.value || '').trim()

          if (!isCreate) append('product_id')
          append('name')
          append('display_content')
          formData.append('available_products_name', availableProductsName)
          append('unit')
          append('unit_price')
          append('additional_price')
          append('inventory')
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
          formData.append('level_discount', String(fields.level_discount.value || '[]'))
          append('product_category')
          append('specification')
          append('color')
          append('model')
          append('custom_param1_value')
          append('custom_param2_value')
          append('package_id')

          // if (fields.image.files && fields.image.files[0]) {
          //   formData.append('image', fields.image.files[0])
          // }

          try {
            const apiCall = isCreate ? createProduct : updateProduct
            const successToast = isCreate ? '创建明细商品成功' : '更新明细商品成功'
            const failToast = isCreate ? '创建失败' : '更新失败'
            const res = await apiCall(formData, { onUploadProgress: (e) => setUploadProgress && setUploadProgress(e, '正在上传图片') })
            if (res && res.success) {
              showToast(successToast)
              if (!isCreate) {
                try {
                  await updateProductStatus({ product_id: fields.product_id.value, status: fields.status.value })
                } catch (e) {}
              }
              endUploadProgress && endUploadProgress()
              fetchProducts()
            } else {
              const msg = resolveApiMessage(res, failToast)
              endUploadProgress && endUploadProgress()
              showToast(String(msg))
            }
          } catch (e) {
            endUploadProgress && endUploadProgress()
            showToast(resolveApiMessage(e, isCreate ? '创建失败' : '更新请求失败'))
          }
        }
      })
    }

    const handleCreateDetailProduct = async () => openDetailProductFormModal({ mode: 'create', item: null })

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
            const apiResult = e && e.response && e.response.data
            if (apiResult && typeof apiResult === 'object') {
              showModal({
                type: 'result',
                title: '导入结果',
                result: apiResult,
                forceConfirm: true,
                onConfirm: () => {}
              })
              const msg = resolveApiMessage(apiResult, '导入失败')
              showToast(String(msg))
              return
            }
            const errorMessage = resolveApiMessage(e, '导入请求失败')
            showModal({
              type: 'result',
              title: '导入失败',
              result: { success: false, timestamp: new Date().toISOString(), message: String(errorMessage), data: {} },
              forceConfirm: true,
              onConfirm: () => {}
            })
            showToast(String(errorMessage))
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
            const apiResult = e && e.response && e.response.data
            if (apiResult && typeof apiResult === 'object') {
              showModal({
                type: 'result',
                title: '导入结果',
                result: apiResult,
                forceConfirm: true,
                onConfirm: () => {}
              })
            }
            showToast(resolveApiMessage(e, '导入请求失败'))
          }
        }
      })
    }

    const viewDetail = async (item) => {
      const packageFeeOptions = await buildPackageFeeOptions()
      const packageOpt = packageFeeOptions.find(o => o.value === item.package_id)
      const packageLabel = packageOpt && packageOpt.value !== '' ? packageOpt.label : (item.package_id || '无')

      const rows = [
        { label: '明细商品ID', value: String(item.product_id || '') },
        { label: '明细名称', value: String(item.name || '') },
        { label: '明细商品名称', value: String(item.name || '') },
        { label: '前台显示内容', value: normalizeDisplayContentLabel(item.display_content) },
        { label: '关联商品名称', value: String(item.available_products_name || item.available_product_name || item.available_products_id || '') },
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
        { label: '包装费规格', value: String(packageLabel) },
        { label: '状态', value: String(item.status) === '1' ? '上架' : '下架' }
      ]
      if (String(item.has_custom_params || '0') === '1') {
        const idx = rows.findIndex(r => r.label === '规格')
        const inserts = [
          { label: String(item.custom_param1_name || ''), value: String(item.custom_param1_value == null ? '' : item.custom_param1_value) },
          { label: String(item.custom_param2_name || ''), value: String(item.custom_param2_value == null ? '' : item.custom_param2_value) }
        ]
        if (idx >= 0) {
          rows.splice(idx, 0, ...inserts)
        } else {
          rows.push(...inserts)
        }
      }
      const data = []
      // const imgs = getImages(item)
      // if (imgs.length) {
      //   imgs.forEach((src, i) => data.push({ label: i === 0 ? '商品图片' : '', value: src, type: 'image' }))
      // }
      rows.forEach(r => data.push(r))
      showModal({ type: 'detail', title: '明细商品详情', data })
    }

    const handleUpdateDetailProduct = async () => openDetailProductFormModal({ mode: 'updateById', item: null })

    const openUpdateModal = (item) => {
      openDetailProductFormModal({ mode: 'update', item })
    }

    /**
     * 删除明细商品，并在成功后刷新当前列表。
     *
     * @param {Object} item 当前明细商品数据项
     * @returns {void}
     */
    const removeDetailProduct = (item) => {
      showModal({
        type: 'confirm',
        title: '删除明细商品',
        message: `确定要删除明细商品 "${item.name}" 吗？此操作不可恢复。`,
        onConfirm: async () => {
          try {
            const formData = new FormData()
            formData.append('product_id', item.product_id)
            const res = await deleteProductDetail(formData)
            if (res && res.success) {
              showToast((res && res.message) || '删除明细商品成功')
              if (products.value.length === 1 && pagination.page > 1) {
                pagination.page -= 1
              }
              await fetchProducts()
            } else {
              const msg = resolveApiMessage(res, '删除明细商品失败')
              showToast(String(msg))
            }
          } catch (e) {
            showToast(resolveApiMessage(e, '删除明细商品失败'))
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
          status: { label: '状态', type: 'select', value: '1', options: [{ label: '上架', value: '1' }, { label: '下架', value: '0' }] }
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
              const msg = resolveApiMessage(res, '更改失败')
              showToast(String(msg))
            }
          } catch (e) {
            showToast(resolveApiMessage(e, '更改请求失败'))
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
      removeDetailProduct,
      viewDetail,
      getPackageFeeName
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
