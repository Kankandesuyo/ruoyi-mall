<template>
  <div class="layout" :class="'club-theme-'+theme">
    <header class="header">
      <div class="container header-inner">
        <div class="logo" @click="$router.push('/home')">
          <span class="logo-text">若依商城</span>
        </div>
        <div class="search-box">
          <el-input
            v-model="keyword"
            placeholder="搜索你喜欢的商品"
            clearable
            @keyup.enter="doSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="doSearch" />
            </template>
          </el-input>
        </div>
        <div class="actions">
          <el-button @click="$router.push('/points')">积分活动</el-button>
          <el-badge :value="cartCount" :hidden="cartCount === 0" :max="99">
            <el-button :icon="ShoppingCart" @click="goCart">购物车</el-button>
          </el-badge>
          <template v-if="user">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" :src="avatarUrl(user.avatar)">{{ user.nickname?.charAt(0) }}</el-avatar>
                <span class="nickname">{{ user.nickname || user.phone }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                  <el-dropdown-item command="address">收货地址</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <el-button v-else type="primary" @click="$router.push('/login')">登录</el-button>
        </div>
      </div>
    </header>
    <main class="main container">
      <router-view v-slot="{ Component }">
        <component :is="Component" @cart-changed="loadCartCount" @profile-changed="user = getUser()" />
      </router-view>
    </main>
    <footer class="footer">
      <div class="container">若依商城 H5 客户端 · 仅用于学习演示</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, ShoppingCart, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUser, removeToken, removeUser } from '@/utils/auth'
import { avatarUrl } from '@/utils/avatar'
import { count as cartCountApi } from '@/api/cart'

import { levelCenter } from '@/api/level'
const theme = ref('default')
const route = useRoute()
function setTheme(event) { theme.value = event.detail }
window.addEventListener('member-theme', setTheme)
onBeforeUnmount(() => window.removeEventListener('member-theme', setTheme))
async function refreshTheme() { if (!getUser()) { theme.value='default'; return } try { theme.value=(await levelCenter()).data.appearance.theme } catch {} }
watch(() => route.path, refreshTheme)
onMounted(refreshTheme)
const router = useRouter()
const keyword = ref('')
const user = ref(getUser())
const cartCount = ref(0)

onMounted(() => {
  loadCartCount()
})

async function loadCartCount() {
  if (!user.value) {
    cartCount.value = 0
    return
  }
  try {
    const res = await cartCountApi()
    cartCount.value = res.data || 0
  } catch (e) {
    cartCount.value = 0
  }
}

function doSearch() {
  router.push({ path: '/goods', query: keyword.value ? { keyword: keyword.value } : {} })
}

function goCart() {
  router.push('/cart')
}

function handleCommand(cmd) {
  if (cmd === 'profile') router.push('/profile')
  else if (cmd === 'orders') router.push('/orders')
  else if (cmd === 'address') router.push('/address')
  else if (cmd === 'logout') {
    ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' }).then(() => {
      removeToken()
      removeUser()
      theme.value = 'default'
      user.value = null
      cartCount.value = 0
      ElMessage.success('已退出登录')
      router.push('/home')
    }).catch(() => {})
  }
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  background: #fff;
  border-bottom: 2px solid var(--primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.header-inner {
  height: 70px;
  display: flex;
  align-items: center;
  gap: 30px;
}
.logo {
  cursor: pointer;
}
.logo-text {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
  white-space: nowrap;
}
.search-box {
  flex: 1;
  max-width: 600px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
}
.nickname {
  font-size: 14px;
  color: var(--text-main);
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.main {
  flex: 1;
  padding: 20px 0;
}
.footer {
  background: #fff;
  border-top: 1px solid var(--border);
  text-align: center;
  padding: 20px 0;
  color: var(--text-sub);
  font-size: 12px;
}
</style>
