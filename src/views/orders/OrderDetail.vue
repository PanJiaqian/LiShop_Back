<template>
  <div class="order-detail">
    <div class="page-header">
      <div class="title-row">
        <h2 class="page-title">订单详情</h2>
        <button class="btn-sm" @click="$router.back()">返回列表</button>
      </div>
    </div>

    <!-- 状态步骤条 -->
    <div class="card mb-4">
      <div class="steps">
        <div class="step active">
          <div class="step-icon">1</div>
          <div class="step-title">提交订单</div>
          <div class="step-time">2025-12-04 10:30:00</div>
        </div>
        <div class="step active">
          <div class="step-icon">2</div>
          <div class="step-title">完成支付</div>
          <div class="step-time">2025-12-04 10:30:45</div>
        </div>
        <div class="step">
          <div class="step-icon">3</div>
          <div class="step-title">商家发货</div>
        </div>
        <div class="step">
          <div class="step-icon">4</div>
          <div class="step-title">确认收货</div>
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <!-- 左侧：订单信息 -->
      <div class="left-col">
        <div class="card mb-4">
          <div class="card-header">
            <h3>基本信息</h3>
            <span class="badge info">待发货</span>
          </div>
          <div class="info-list">
            <div class="info-item">
              <span class="label">订单编号：</span>
              <span class="value">ORD-20251204-001</span>
            </div>
            <div class="info-item">
              <span class="label">下单时间：</span>
              <span class="value">2025-12-04 10:30:00</span>
            </div>
            <div class="info-item">
              <span class="label">支付方式：</span>
              <span class="value">微信支付</span>
            </div>
            <div class="info-item">
              <span class="label">支付流水：</span>
              <span class="value">WX20251204103045001</span>
            </div>
            <div class="info-item">
              <span class="label">配送方式：</span>
              <span class="value">顺丰速运</span>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <h3>收货人信息</h3>
            <button class="btn-link">修改</button>
          </div>
          <div class="info-list">
            <div class="info-item">
              <span class="label">收货人：</span>
              <span class="value">Alice Smith</span>
            </div>
            <div class="info-item">
              <span class="label">联系电话：</span>
              <span class="value">138****1234</span>
            </div>
            <div class="info-item">
              <span class="label">收货地址：</span>
              <span class="value">北京市 朝阳区 建国路88号 SOHO现代城 A座 1201</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：商品信息 & 费用 -->
      <div class="right-col">
        <div class="card mb-4">
          <div class="card-header">
            <h3>商品信息</h3>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>商品</th>
                <th>单价</th>
                <th>数量</th>
                <th>小计</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in orderItems" :key="item.id">
                <td>
                  <div class="product-cell">
                    <div class="product-img-placeholder"></div>
                    <div class="product-info">
                      <div class="name">{{ item.name }}</div>
                      <div class="sku">{{ item.sku }}</div>
                    </div>
                  </div>
                </td>
                <td>¥ {{ item.price }}</td>
                <td>x {{ item.quantity }}</td>
                <td>¥ {{ (item.price * item.quantity).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="order-total">
            <div class="total-row">
              <span class="label">商品总额：</span>
              <span class="value">¥ 299.00</span>
            </div>
            <div class="total-row">
              <span class="label">运费：</span>
              <span class="value">+ ¥ 0.00</span>
            </div>
            <div class="total-row">
              <span class="label">优惠：</span>
              <span class="value">- ¥ 0.00</span>
            </div>
            <div class="total-row grand-total">
              <span class="label">实付款：</span>
              <span class="value">¥ 299.00</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>操作记录</h3>
          </div>
          <ul class="timeline">
            <li class="timeline-item">
              <div class="time">2025-12-04 10:30:45</div>
              <div class="content">用户完成支付</div>
            </li>
            <li class="timeline-item">
              <div class="time">2025-12-04 10:30:00</div>
              <div class="content">用户提交订单</div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="action-footer">
      <button class="btn-sm">打印订单</button>
      <button class="btn-sm">修改备注</button>
      <button class="btn-sm primary">发货</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrderDetail',
  data () {
    return {
      orderItems: [
        { id: 1, name: '无线降噪耳机 Pro', sku: '颜色: 黑色', price: 299.00, quantity: 1 }
      ]
    }
  }
}
</script>

<style scoped lang="scss">
.order-detail {
  padding-bottom: 60px;
}

.page-header {
  margin-bottom: 20px;
  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.mb-4 {
  margin-bottom: 20px;
}

/* Steps */
.steps {
  display: flex;
  justify-content: space-between;
  padding: 20px 40px;
  
  .step {
    flex: 1;
    text-align: center;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      top: 15px;
      left: 50%;
      width: 100%;
      height: 2px;
      background: #eee;
      z-index: 0;
    }
    
    &:last-child::after {
      display: none;
    }
    
    &.active {
      .step-icon {
        background: #1890ff;
        color: white;
        border-color: #1890ff;
      }
      .step-title {
        color: #333;
        font-weight: 500;
      }
      &::after {
        background: #1890ff;
      }
    }

    .step-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #ddd;
      color: #999;
      line-height: 28px;
      margin: 0 auto 10px;
      position: relative;
      z-index: 1;
      font-weight: bold;
    }
    
    .step-title {
      font-size: 14px;
      color: #999;
      margin-bottom: 5px;
    }
    
    .step-time {
      font-size: 12px;
      color: #999;
    }
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
}

.info-list {
  .info-item {
    display: flex;
    margin-bottom: 12px;
    font-size: 14px;
    
    .label {
      color: #666;
      width: 80px;
      flex-shrink: 0;
    }
    
    .value {
      color: #333;
    }
  }
}

.product-cell {
  display: flex;
  align-items: center;
  
  .product-img-placeholder {
    width: 40px;
    height: 40px;
    background: #f0f2f5;
    border-radius: 4px;
    margin-right: 10px;
  }
  
  .name {
    font-size: 14px;
    color: #333;
  }
  
  .sku {
    font-size: 12px;
    color: #999;
  }
}

.order-total {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  
  .total-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
    font-size: 14px;
    
    .label {
      color: #666;
      margin-right: 10px;
    }
    
    .value {
      color: #333;
      width: 100px;
      text-align: right;
    }
    
    &.grand-total {
      font-weight: bold;
      font-size: 16px;
      margin-top: 10px;
      
      .value {
        color: #f5222d;
      }
    }
  }
}

.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  
  .timeline-item {
    position: relative;
    padding-left: 20px;
    padding-bottom: 20px;
    border-left: 2px solid #f0f0f0;
    
    &::before {
      content: '';
      position: absolute;
      left: -5px;
      top: 0;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #1890ff;
    }
    
    &:last-child {
      border-left: none;
    }
    
    .time {
      font-size: 12px;
      color: #999;
      margin-bottom: 4px;
    }
    
    .content {
      font-size: 14px;
      color: #333;
    }
  }
}

.action-footer {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 250px; /* Sidebar width */
  background: #fff;
  padding: 15px 30px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  z-index: 10;
}
</style>
