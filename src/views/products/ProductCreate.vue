<template>
  <div>
    <div class="page-title">
      <span style="margin-right: 12px; cursor: pointer; color: #6b7280;" @click="$router.back()">
        &larr; 返回列表
      </span>
      新建商品
    </div>
    
    <div class="grid">
      <!-- Basic Info -->
      <div class="card" style="grid-column: span 8;">
        <div class="card-header">
          <h3>基础信息</h3>
        </div>
        <div class="form-group">
          <label>商品名称</label>
          <input type="text" class="form-input" placeholder="请输入商品名称（最多60字）" v-model="form.name" />
        </div>
        <div class="form-group">
          <label>商品副标题</label>
          <input type="text" class="form-input" placeholder="商品卖点、促销语" v-model="form.subtitle" />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
          <div class="form-group">
            <label>商品分类</label>
            <select class="form-select" v-model="form.category">
              <option value="">请选择分类</option>
              <option value="1">电子产品 / 手机</option>
              <option value="2">电子产品 / 配件</option>
              <option value="3">服装 / 男装</option>
            </select>
          </div>
          <div class="form-group">
            <label>商品品牌</label>
            <select class="form-select" v-model="form.brand">
              <option value="">请选择品牌</option>
              <option value="1">Apple</option>
              <option value="2">Huawei</option>
              <option value="3">Xiaomi</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>商品描述</label>
          <div class="editor-sim">
            <div class="editor-toolbar">
              <span class="tool-btn">B</span>
              <span class="tool-btn">I</span>
              <span class="tool-btn">U</span>
              <span class="tool-separator">|</span>
              <span class="tool-btn">H1</span>
              <span class="tool-btn">H2</span>
              <span class="tool-separator">|</span>
              <span class="tool-btn">IMG</span>
            </div>
            <textarea class="editor-content" rows="8" placeholder="请输入商品详情描述..." v-model="form.description"></textarea>
          </div>
        </div>
      </div>

      <!-- Media & Settings -->
      <div class="card" style="grid-column: span 4;">
        <div class="card-header">
          <h3>商品图片</h3>
        </div>
        <div class="upload-area">
          <div class="upload-placeholder">
            <div class="icon">+</div>
            <div class="text">点击上传主图</div>
            <div class="sub-text">建议尺寸 800x800</div>
          </div>
          <div class="image-list" v-if="form.images.length">
            <!-- Simulated uploaded images -->
          </div>
        </div>
        
        <div class="card-header" style="margin-top: 32px;">
          <h3>发布设置</h3>
        </div>
        <div class="form-group">
          <label>上架状态</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" name="status" value="on" v-model="form.status" /> 立即上架
            </label>
            <label class="radio-label">
              <input type="radio" name="status" value="off" v-model="form.status" /> 放入仓库
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>运费模板</label>
          <select class="form-select" v-model="form.shippingTemplate">
            <option value="1">全国包邮</option>
            <option value="2">按重量计费</option>
          </select>
        </div>
        <div class="form-group">
          <label>推荐值</label>
          <input type="number" class="form-input" v-model="form.sort" />
        </div>
      </div>

      <!-- SKU Settings -->
      <div class="card" style="grid-column: span 12;">
        <div class="card-header">
          <h3>规格与库存</h3>
        </div>
        <div class="form-group">
          <label>商品规格</label>
          <div class="specs-container">
            <div class="spec-row" v-for="(spec, index) in form.specs" :key="index">
              <div class="spec-name">
                <input type="text" class="form-input" v-model="spec.name" placeholder="规格名" style="width: 120px;" />
              </div>
              <div class="spec-values">
                <div class="tag" v-for="(val, vIndex) in spec.values" :key="vIndex">
                  {{ val }} <span class="remove-tag">×</span>
                </div>
                <button class="btn-link btn-add">+ 添加值</button>
              </div>
              <button class="btn-link danger">删除</button>
            </div>
            <button class="btn-sm secondary" @click="addSpec">+ 添加规格项目</button>
          </div>
        </div>

        <table class="data-table" style="margin-top: 16px;">
          <thead>
            <tr>
              <th>规格组合</th>
              <th width="150">价格 (元)</th>
              <th width="150">库存</th>
              <th width="150">SKU 编码</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sku, index) in skuList" :key="index">
              <td>{{ sku.name }}</td>
              <td><input type="text" class="form-input" v-model="sku.price" /></td>
              <td><input type="text" class="form-input" v-model="sku.stock" /></td>
              <td><input type="text" class="form-input" v-model="sku.code" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Actions -->
      <div class="form-actions" style="grid-column: span 12;">
        <button class="btn-lg">取消</button>
        <button class="btn-lg primary">保存商品</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductCreate',
  data() {
    return {
      form: {
        name: '',
        subtitle: '',
        category: '',
        brand: '',
        description: '',
        images: [],
        status: 'on',
        shippingTemplate: '1',
        sort: 0,
        specs: [
          { name: '颜色', values: ['黑色', '白色', '蓝色'] },
          { name: '内存', values: ['128G', '256G'] }
        ]
      },
      skuList: [
        { name: '黑色 / 128G', price: '2999.00', stock: 100, code: 'SKU001-1' },
        { name: '黑色 / 256G', price: '3299.00', stock: 80, code: 'SKU001-2' },
        { name: '白色 / 128G', price: '2999.00', stock: 50, code: 'SKU002-1' },
        { name: '白色 / 256G', price: '3299.00', stock: 45, code: 'SKU002-2' },
        { name: '蓝色 / 128G', price: '2999.00', stock: 20, code: 'SKU003-1' },
        { name: '蓝色 / 256G', price: '3299.00', stock: 15, code: 'SKU003-2' }
      ]
    }
  },
  methods: {
    addSpec() {
      this.form.specs.push({ name: '', values: [] });
    }
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.editor-sim {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.editor-toolbar {
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px;
  display: flex;
  align-items: center;
}

.tool-btn {
  padding: 4px 8px;
  font-size: 14px;
  font-weight: bold;
  color: #4b5563;
  cursor: pointer;
  border-radius: 4px;
}

.tool-btn:hover {
  background-color: #e5e7eb;
}

.tool-separator {
  color: #d1d5db;
  margin: 0 8px;
}

.editor-content {
  width: 100%;
  border: none;
  padding: 12px;
  font-family: inherit;
  resize: vertical;
}

.editor-content:focus {
  outline: none;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-area:hover {
  border-color: var(--primary-color);
}

.upload-placeholder .icon {
  font-size: 32px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.upload-placeholder .text {
  font-size: 14px;
  color: #374151;
  margin-bottom: 4px;
}

.upload-placeholder .sub-text {
  font-size: 12px;
  color: #9ca3af;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}

.specs-container {
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 6px;
}

.spec-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e5e7eb;
}

.spec-values {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tag {
  background-color: white;
  border: 1px solid #d1d5db;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-tag {
  cursor: pointer;
  color: #9ca3af;
}

.remove-tag:hover {
  color: #ef4444;
}

.btn-add {
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  background-color: white; /* Sticky support if needed */
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}
</style>
