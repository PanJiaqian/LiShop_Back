<template>
  <div>
    <div class="page-title">消息与工单</div>
    
    <div class="grid">
      <!-- 左侧：消息列表 -->
      <div class="card message-list-card">
        <div class="card-header">
          <div class="tabs">
            <div class="tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</div>
            <div class="tab-item" :class="{ active: activeTab === 'unread' }" @click="activeTab = 'unread'">未读</div>
          </div>
        </div>
        <div class="message-list">
          <div 
            class="message-item" 
            v-for="msg in filteredMessages" 
            :key="msg.id"
            :class="{ unread: !msg.read, active: activeMsg.id === msg.id }"
            @click="selectMessage(msg)"
          >
            <div class="msg-avatar">{{ msg.user.charAt(0) }}</div>
            <div class="msg-content">
              <div class="msg-header">
                <span class="msg-user">{{ msg.user }}</span>
                <span class="msg-time">{{ msg.time }}</span>
              </div>
              <div class="msg-text">{{ msg.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：消息详情/回复 -->
      <div class="card chat-card">
        <div class="card-header">
          <div class="chat-user-info">
            <h3>{{ activeMsg.user }}</h3>
            <span class="tag" v-if="activeMsg.type === 'ticket'">工单 #{{ activeMsg.ticketId }}</span>
          </div>
          <div class="chat-actions">
            <button class="btn-sm" v-if="activeMsg.type === 'ticket'" @click="resolveTicket">标记已解决</button>
          </div>
        </div>
        
        <div class="chat-history" ref="chatHistory">
          <div class="chat-msg received">
            <div class="avatar">{{ activeMsg.user.charAt(0) }}</div>
            <div class="bubble">
              {{ activeMsg.content }}
            </div>
          </div>
          <div class="chat-msg sent" v-if="activeMsg.reply">
            <div class="bubble">
              {{ activeMsg.reply }}
            </div>
            <div class="avatar">A</div>
          </div>
        </div>
        
        <div class="chat-input">
          <textarea class="form-input" rows="3" placeholder="输入回复内容..." v-model="replyContent"></textarea>
          <div class="input-actions">
            <button class="btn-sm primary" @click="sendReply">发送回复</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'

const showToast = inject('showToast')

const activeTab = ref('all')
const replyContent = ref('')

const messages = ref([
  { id: 1, user: 'Alice Smith', content: '请问我的订单什么时候发货？', time: '10:30', read: false, type: 'chat' },
  { id: 2, user: 'Bob Jones', content: '收到的商品有质量问题，申请退款。', time: '昨天', read: true, type: 'ticket', ticketId: 'TK-001', reply: '您好，请提供一下商品照片，我们会尽快为您处理。' },
  { id: 3, user: 'Charlie', content: '如何成为分销商？', time: '昨天', read: true, type: 'chat' },
  { id: 4, user: 'David', content: '优惠券无法使用', time: '前天', read: true, type: 'ticket', ticketId: 'TK-002' }
])

const activeMsg = ref(messages.value[0])

const filteredMessages = computed(() => {
  if (activeTab.value === 'unread') {
    return messages.value.filter(m => !m.read)
  }
  return messages.value
})

const selectMessage = (msg) => {
  activeMsg.value = msg
  if (!msg.read) {
    msg.read = true
  }
  replyContent.value = ''
}

const sendReply = () => {
  if (!replyContent.value.trim()) {
    showToast('请输入回复内容')
    return
  }
  
  // Simulate sending reply
  if (!activeMsg.value.reply) {
    activeMsg.value.reply = replyContent.value
  } else {
    // In a real app, we would append to a list of messages
    showToast('回复已发送')
  }
  
  replyContent.value = ''
  showToast('发送成功')
}

const resolveTicket = () => {
  showToast('工单已标记为解决')
}
</script>

<style scoped lang="scss">
.grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
  height: calc(100vh - 140px);
}

.message-list-card {
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .card-header {
    padding: 10px 20px;
    border-bottom: 1px solid #e2e8f0;
  }
}

.message-list {
  flex: 1;
  overflow-y: auto;
  
  .message-item {
    padding: 15px 20px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    display: flex;
    gap: 12px;
    transition: all 0.2s;
    
    &:hover {
      background: #f8fafc;
    }
    
    &.active {
      background: #eff6ff;
    }
    
    &.unread {
      background: #fffbe6;
      .msg-text {
        font-weight: bold;
        color: #333;
      }
    }
    
    .msg-avatar {
      width: 40px;
      height: 40px;
      background: #cbd5e1;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
    }
    
    .msg-content {
      flex: 1;
      min-width: 0;
      
      .msg-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        
        .msg-user {
          font-weight: 500;
          color: #333;
        }
        
        .msg-time {
          font-size: 12px;
          color: #94a3b8;
        }
      }
      
      .msg-text {
        font-size: 13px;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

.chat-card {
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .card-header {
    padding: 15px 20px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      font-size: 16px;
    }
    
    .tag {
      margin-left: 10px;
      font-size: 12px;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}

.chat-history {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8fafc;
  
  .chat-msg {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    
    .avatar {
      width: 36px;
      height: 36px;
      background: #cbd5e1;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .bubble {
      padding: 10px 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      max-width: 70%;
      line-height: 1.5;
    }
    
    &.sent {
      justify-content: flex-end;
      
      .avatar {
        background: var(--primary-color);
      }
      
      .bubble {
        background: #eff6ff;
        color: #1e293b;
      }
    }
  }
}

.chat-input {
  padding: 15px 20px;
  border-top: 1px solid #e2e8f0;
  background: white;
  
  textarea {
    width: 100%;
    resize: none;
    margin-bottom: 10px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 10px;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }
  
  .input-actions {
    display: flex;
    justify-content: flex-end;
  }
}

.tabs {
  display: flex;
  gap: 20px;
  
  .tab-item {
    padding-bottom: 10px;
    cursor: pointer;
    color: #64748b;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    
    &.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
      font-weight: 500;
    }
    
    &:hover {
      color: var(--primary-color);
    }
  }
}
</style>
