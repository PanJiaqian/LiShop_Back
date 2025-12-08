<template>
  <div>
    <div class="page-title">库存管理</div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="filter-bar">
        <input type="text" class="form-input" placeholder="商品名称/SKU编码" v-model="filter.keyword" />
        <select class="form-select" v-model="filter.category">
          <option value="">商品分类</option>
          <option value="electronics">电子产品</option>
          <option value="clothing">服装服饰</option>
        </select>
        <select class="form-select" v-model="filter.stockStatus">
          <option value="">库存状态</option>
          <option value="normal">库存充足</option>
          <option value="low">库存预警</option>
          <option value="out">缺货</option>
        </select>
        <button class="btn-sm primary" @click="handleSearch">查询</button>
        <button class="btn-sm primary" style="margin-left: auto;" @click="batchInStock">批量入库</button>
      </div>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>商品信息</th>
            <th>规格</th>
            <th>当前库存</th>
            <th>锁定库存</th>
            <th>可用库存</th>
            <th>预警值</th>
            <th>状态</th>
            <th width="150">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inventoryList" :key="item.id">
            <td>
              <div class="product-info">
                <div class="img-placeholder">{{ item.name.charAt(0) }}</div>
                <div class="info">
                  <div class="name">{{ item.name }}</div>
                  <div class="code">SKU: {{ item.sku }}</div>
                </div>
              </div>
            </td>
            <td>{{ item.specs }}</td>
            <td>{{ item.totalStock }}</td>
            <td>{{ item.lockedStock }}</td>
            <td>
              <span :class="{ 'text-danger': item.availableStock <= item.alertStock }">
                {{ item.availableStock }}
              </span>
            </td>
            <td>{{ item.alertStock }}</td>
            <td>
              <span class="badge" :class="getStatusClass(item)">{{ getStatusText(item) }}</span>
            </td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="adjustStock(item)">调整</button>
                <button class="btn-link" @click="viewLogs(item)">记录</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination">
        <span class="page-info">共 {{ inventoryList.length }} 条记录</span>
        <div class="page-btns">
          <button class="btn-sm" disabled>上一页</button>
          <button class="btn-sm active">1</button>
          <button class="btn-sm">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject } from 'vue'

const showModal = inject('showModal')
const showToast = inject('showToast')

const filter = reactive({
  keyword: '',
  category: '',
  stockStatus: ''
})

const inventoryList = ref([
  { 
    id: 1, 
    name: '无线蓝牙耳机 Pro', 
    sku: 'SKU001-1', 
    specs: '白色 / 官方标配', 
    totalStock: 150, 
    lockedStock: 20, 
    availableStock: 130, 
    alertStock: 50 
  },
  { 
    id: 2, 
    name: '智能运动手表', 
    sku: 'SKU002-1', 
    specs: '黑色 / 运动版', 
    totalStock: 45, 
    lockedStock: 5, 
    availableStock: 40, 
    alertStock: 50 
  },
  { 
    id: 3, 
    name: '机械键盘 K8', 
    sku: 'SKU003-2', 
    specs: '青轴 / RGB背光', 
    totalStock: 8, 
    lockedStock: 0, 
    availableStock: 8, 
    alertStock: 10 
  },
  { 
    id: 4, 
    name: 'Type-C 数据线', 
    sku: 'SKU004-1', 
    specs: '1.5米 / 编织线', 
    totalStock: 500, 
    lockedStock: 0, 
    availableStock: 500, 
    alertStock: 100 
  },
  { 
    id: 5, 
    name: '手机支架', 
    sku: 'SKU005-1', 
    specs: '铝合金 / 银色', 
    totalStock: 0, 
    lockedStock: 0, 
    availableStock: 0, 
    alertStock: 20 
  }
])

const getStatusClass = (item) => {
  if (item.availableStock === 0) return 'gray' // out of stock
  if (item.availableStock <= item.alertStock) return 'warning' // low stock
  return 'success' // normal
}

const getStatusText = (item) => {
  if (item.availableStock === 0) return '缺货'
  if (item.availableStock <= item.alertStock) return '预警'
  return '充足'
}

const handleSearch = () => {
  showToast('搜索已更新')
}

const adjustStock = (item) => {
  showModal({
    title: '库存调整 - ' + item.name,
    content: `
      <div class="form-group">
        <label>调整类型</label>
        <div class="radio-group">
          <label class="radio-label"><input type="radio" name="type" checked> 入库 (增加)</label>
          <label class="radio-label"><input type="radio" name="type"> 出库 (减少)</label>
        </div>
      </div>
      <div class="form-group">
        <label>调整数量</label>
        <input type="number" class="form-input" placeholder="请输入数量" value="1">
      </div>
      <div class="form-group">
        <label>备注说明</label>
        <textarea class="form-input" rows="3" placeholder="请输入调整原因"></textarea>
      </div>
    `,
    onConfirm: () => {
      showToast('库存调整成功')
    }
  })
}

const batchInStock = () => {
  showModal({
    title: '批量入库',
    content: `
      <div class="info-box" style="background: #e6f7ff; border: 1px solid #91d5ff; padding: 12px; border-radius: 4px; margin-bottom: 20px; color: #1890ff;">
        请上传包含SKU和数量的Excel文件进行批量入库
      </div>
      <div class="upload-area" style="border: 2px dashed #d9d9d9; padding: 32px; text-align: center; cursor: pointer; border-radius: 6px;">
        <div style="font-size: 24px; color: #999; margin-bottom: 8px;">+</div>
        <div style="color: #666;">点击上传文件</div>
      </div>
    `,
    onConfirm: () => {
      showToast('批量入库任务已提交')
    }
  })
}

const viewLogs = (item) => {
  showModal({
    title: '库存变动记录 - ' + item.sku,
    content: `
      <table class="data-table" style="width: 100%; font-size: 12px;">
        <thead>
          <tr>
            <th>时间</th>
            <th>类型</th>
            <th>数量</th>
            <th>操作人</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2025-12-04 10:00</td>
            <td><span style="color: green;">入库</span></td>
            <td>+50</td>
            <td>张三</td>
            <td>采购入库</td>
          </tr>
          <tr>
            <td>2025-12-03 15:30</td>
            <td><span style="color: red;">订单</span></td>
            <td>-1</td>
            <td>系统</td>
            <td>订单 ORD-001</td>
          </tr>
          <tr>
            <td>2025-12-01 09:00</td>
            <td><span style="color: orange;">盘点</span></td>
            <td>-2</td>
            <td>李四</td>
            <td>库存盘亏</td>
          </tr>
        </tbody>
      </table>
    `,
    width: '600px',
    onConfirm: () => {} // No action needed, just viewing
  })
}
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  gap: 12px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .img-placeholder {
    width: 40px;
    height: 40px;
    background: #f0f2f5;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-weight: bold;
  }
  
  .info {
    .name {
      font-size: 14px;
      color: #333;
      margin-bottom: 2px;
    }
    .code {
      font-size: 12px;
      color: #999;
    }
  }
}

.text-danger {
  color: #ff4d4f;
  font-weight: bold;
}

.radio-group {
  display: flex;
  gap: 20px;
  
  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
}
</style>
