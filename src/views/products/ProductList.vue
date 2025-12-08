<template>
  <div>
    <div class="page-title">
      <span>商品列表</span>
      <button class="btn-sm primary" @click="$router.push('/products/create')">+ 新建商品</button>
    </div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="搜索商品名称/编码..." v-model="filter.keyword" />
        <select class="form-select" v-model="filter.category">
          <option value="">所有分类</option>
          <option>数码产品</option>
          <option>生活家居</option>
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
      <table class="data-table">
        <thead>
          <tr>
            <th width="80">图片</th>
            <th>商品名称</th>
            <th>价格</th>
            <th>库存</th>
            <th>销量</th>
            <th>状态</th>
            <th>创建时间</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in products" :key="item.id">
            <td>
              <div class="product-thumb">{{ item.image }}</div>
            </td>
            <td>
              <div class="product-name-cell">
                <div class="name">{{ item.name }}</div>
                <div class="code">编码: {{ item.code }}</div>
              </div>
            </td>
            <td>¥ {{ item.price }}</td>
            <td>{{ item.stock }}</td>
            <td>{{ item.sales }}</td>
            <td>
              <span class="badge" :class="item.status === '上架' ? 'success' : 'gray'">{{ item.status }}</span>
            </td>
            <td>{{ item.createTime }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="editProduct(item)">编辑</button>
                <button class="btn-link danger" @click="deleteProduct(item)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 {{ products.length }} 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" disabled>上一页</button>
          <button class="btn-sm active">1</button>
          <button class="btn-sm">2</button>
          <button class="btn-sm">3</button>
          <button class="btn-sm">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, reactive } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ProductList',
  setup() {
    const showModal = inject('showModal')
    const router = useRouter()
    const filter = reactive({
      keyword: '',
      category: '',
      status: ''
    })
    
    const products = reactive([
        { id: 1, image: '🎧', name: '无线蓝牙耳机 Pro', code: 'P2025001', price: '299.00', stock: 124, sales: 1240, status: '上架', createTime: '2025-12-01' },
        { id: 2, image: '⌚', name: '智能运动手表 Gen 5', code: 'P2025002', price: '599.00', stock: 45, sales: 856, status: '上架', createTime: '2025-12-02' },
        { id: 3, image: '🔋', name: '超薄移动电源 10000mAh', code: 'P2025003', price: '99.00', stock: 0, sales: 645, status: '下架', createTime: '2025-12-03' },
        { id: 4, image: '🔌', name: 'Type-C 快充数据线', code: 'P2025004', price: '29.00', stock: 2000, sales: 532, status: '上架', createTime: '2025-12-04' },
        { id: 5, image: '⌨️', name: '人体工学机械键盘', code: 'P2025005', price: '399.00', stock: 88, sales: 420, status: '上架', createTime: '2025-12-04' },
        { id: 6, image: '🖱️', name: '无线静音鼠标', code: 'P2025006', price: '59.00', stock: 156, sales: 310, status: '上架', createTime: '2025-12-04' },
        { id: 7, image: '📱', name: '全面屏智能手机', code: 'P2025007', price: '2999.00', stock: 23, sales: 120, status: '上架', createTime: '2025-12-04' }
    ])

    const handleSearch = () => {
       // In a real app, this would call API
       console.log('Search:', filter)
    }

    const resetFilter = () => {
      filter.keyword = ''
      filter.category = ''
      filter.status = ''
    }

    const editProduct = (item) => {
      router.push(`/products/edit/${item.id}`)
    }

    const deleteProduct = (item) => {
      showModal({
        type: 'confirm',
        title: '删除商品',
        message: `确定要删除商品 "${item.name}" 吗？此操作不可恢复。`,
        onConfirm: () => {
          const index = products.findIndex(p => p.id === item.id)
          if (index !== -1) {
            products.splice(index, 1)
          }
        }
      })
    }

    return {
      products,
      filter,
      handleSearch,
      resetFilter,
      editProduct,
      deleteProduct
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.form-input, .form-select {
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  color: #374151;
  &:focus { border-color: var(--primary-color); }
}
.product-thumb {
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.product-name-cell {
  .name { font-weight: 500; color: #111827; }
  .code { font-size: 12px; color: #6b7280; margin-top: 2px; }
}
.actions {
  display: flex;
  gap: 8px;
}
.btn-link {
  border: none;
  background: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  
  &.danger { color: #ef4444; }
  &:hover { text-decoration: underline; }
}
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  
  .page-info { font-size: 13px; color: #6b7280; }
  .page-btns { display: flex; }
}
</style>