<template>
  <div>
    <div class="page-title">系统设置</div>
    
    <div class="card">
      <div class="tabs">
        <div class="tab-item" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基本设置</div>
        <div class="tab-item" :class="{ active: activeTab === 'trade' }" @click="activeTab = 'trade'">交易设置</div>
        <div class="tab-item" :class="{ active: activeTab === 'notify' }" @click="activeTab = 'notify'">通知设置</div>
        <div class="tab-item" :class="{ active: activeTab === 'other' }" @click="activeTab = 'other'">其他设置</div>
      </div>
      
      <div class="setting-content">
        <!-- 基本设置 -->
        <div v-if="activeTab === 'basic'" class="form-section">
          <div class="form-item">
            <label class="form-label">网站名称</label>
            <input type="text" class="form-input" value="ShopBack 商城后台" />
          </div>
          <div class="form-item">
            <label class="form-label">网站Logo</label>
            <div class="upload-box">
              <div class="preview">
                <img src="https://via.placeholder.com/100x100?text=Logo" alt="Logo" />
              </div>
              <button class="btn-sm">更换图片</button>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">备案号</label>
            <input type="text" class="form-input" value="京ICP备12345678号" />
          </div>
          <div class="form-item">
            <label class="form-label">客服电话</label>
            <input type="text" class="form-input" value="400-123-4567" />
          </div>
        </div>

        <!-- 交易设置 -->
        <div v-if="activeTab === 'trade'" class="form-section">
          <div class="form-item">
            <label class="form-label">自动关闭订单</label>
            <div class="input-group">
              <input type="number" class="form-input" value="30" style="width: 100px;" />
              <span class="suffix">分钟未支付自动关闭</span>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">自动确认收货</label>
            <div class="input-group">
              <input type="number" class="form-input" value="15" style="width: 100px;" />
              <span class="suffix">天后自动确认收货</span>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">开启积分抵扣</label>
            <label class="switch">
              <input type="checkbox" checked />
              <span class="slider round"></span>
            </label>
          </div>
        </div>

        <!-- 通知设置 -->
        <div v-if="activeTab === 'notify'" class="form-section">
          <div class="form-item">
            <label class="form-label">新订单提醒</label>
            <label class="switch">
              <input type="checkbox" checked />
              <span class="slider round"></span>
            </label>
          </div>
          <div class="form-item">
            <label class="form-label">库存预警提醒</label>
            <label class="switch">
              <input type="checkbox" checked />
              <span class="slider round"></span>
            </label>
          </div>
          <div class="form-item">
            <label class="form-label">短信通知接口</label>
            <select class="form-select">
              <option value="aliyun">阿里云短信</option>
              <option value="tencent">腾讯云短信</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-sm primary">保存配置</button>
          <button class="btn-sm">重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsPage',
  data () {
    return {
      activeTab: 'basic'
    }
  }
}
</script>

<style scoped lang="scss">
.setting-content {
  padding: 20px 0;
  max-width: 600px;
}

.form-item {
  margin-bottom: 24px;
  
  .form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
  }
}

.upload-box {
  display: flex;
  align-items: center;
  gap: 15px;
  
  .preview img {
    width: 80px;
    height: 80px;
    border-radius: 4px;
    border: 1px solid #ddd;
    object-fit: cover;
  }
}

.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .suffix {
    color: #666;
    font-size: 14px;
  }
}

/* Switch Toggle */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  input:checked + .slider {
    background-color: var(--primary-color);
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
}

.form-actions {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
}
</style>
