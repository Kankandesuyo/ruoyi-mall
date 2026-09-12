<template>
  <div v-loading="loading" class="cart-page">
    <div class="page-head">
      <h2>我的购物车</h2>
    </div>
    <div v-if="list.length" class="cart-table">
      <div class="table-head">
        <el-checkbox v-model="allChecked" @change="toggleAll">全选</el-checkbox>
        <span class="col-info">商品信息</span>
        <span class="col-price">单价</span>
        <span class="col-qty">数量</span>
        <span class="col-sub">小计</span>
        <span class="col-op">操作</span>
      </div>
      <div v-for="item in list" :key="item.id" class="table-row">
        <el-checkbox :disabled="item.skuIfExist === 0 || item.status === 0" :model-value="checkedIds.includes(item.id)" @change="toggleOne(item.id)" />
        <div class="col-info">
          <img :src="item.pic || defaultImg" @error="e => e.target.src = defaultImg" />
          <div class="info-text">
            <p class="name">{{ item.productName }}</p>
            <p v-if="item.spData" class="sp">规格：{{ formatSp(item.spData) }}</p>
            <el-tag v-if="item.skuIfExist === 0" size="small" type="info">已失效</el-tag>
          </div>
        </div>
        <span class="col-price">{{ formatPrice(item.price) }} 积分</span>
        <div class="col-qty">
          <el-input-number v-model="item.quantity" :disabled="updating || item.skuIfExist === 0 || item.status === 0" :precision="0" :min="1" size="small" @change="changeQty(item)" />
        </div>
        <span class="col-sub price-text">{{ formatPrice(item.price * item.quantity) }} 积分</span>
        <span class="col-op">
          <el-button text type="danger" @click="removeItem(item)">删除</el-button>
        </span>
      </div>
      <div class="table-foot">
        <div class="foot-left">
          <el-checkbox v-model="allChecked" @change="toggleAll">全选</el-checkbox>
          <span class="selected-count">已选 {{ checkedIds.length }} 件</span>
        </div>
        <div class="foot-right">
          <span class="total-label">合计：</span>
          <span class="total-price">{{ formatPrice(totalAmount) }} 积分</span>
          <el-button type="primary" size="large" :disabled="!checkedIds.length || updating" @click="goCheckout">去结算</el-button>
        </div>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="购物车还是空的，快去逛逛吧">
      <el-button type="primary" @click="$router.push('/home')">去首页</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { list as cartList, modify as cartModify, remove as cartRemove } from '@/api/cart'

const router = useRouter()
const list = ref([])
const loading = ref(false)
const checkedIds = ref([])
const defaultImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23f5f5f5"/></svg>'

const selectable = computed(() => list.value.filter(i => i.skuIfExist !== 0 && i.status !== 0))
const updating = ref(false)

const allChecked = computed({
  get: () => selectable.value.length > 0 && checkedIds.value.length === selectable.value.length,
  set: () => {}
})

const totalAmount = computed(() => {
  return list.value
    .filter(i => checkedIds.value.includes(i.id))
    .reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
})

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    const res = await cartList()
    list.value = res.data || []
    checkedIds.value = checkedIds.value.filter(id => selectable.value.some(i => i.id === id))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function toggleAll(val) {
  checkedIds.value = val ? selectable.value.map(i => i.id) : []
}
function toggleOne(id) {
  const idx = checkedIds.value.indexOf(id)
  if (idx >= 0) checkedIds.value.splice(idx, 1)
  else checkedIds.value.push(id)
}

async function changeQty(item) {
  if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) { await load(); return }
  updating.value = true
  try {
    await cartModify({ id: item.id, quantity: item.quantity, skuId: item.skuId, productId: item.productId })
    emitChanged()
  } catch (e) {
    await load()
  } finally { updating.value = false }
}

async function removeItem(item) {
  try {
    await ElMessageBox.confirm(`确定删除「${item.productName}」吗？`, '提示', { type: 'warning' })
    await cartRemove([item.id])
    ElMessage.success('删除成功')
    checkedIds.value = checkedIds.value.filter(i => i !== item.id)
    await load()
    emitChanged()
  } catch (e) {
    // 取消或失败
  }
}

function goCheckout() {
  if (updating.value) return
  const selected = selectable.value.filter(i => checkedIds.value.includes(i.id))
  if (!selected.length) return
  const skuList = selected.map(i => ({ skuId: i.skuId, quantity: i.quantity }))
  sessionStorage.setItem('checkout_items', JSON.stringify(skuList))
  router.push({ path: '/checkout', query: { from: 'cart' } })
}

function formatPrice(p) {
  return Number(p || 0).toFixed(2)
}
function formatSp(sp) {
  try {
    const arr = JSON.parse(sp)
    if (Array.isArray(arr)) return arr.map(i => i.value).join(' / ')
    if (arr && typeof arr === 'object') return Object.values(arr).join(' / ')
  } catch (e) {}
  return sp
}

const emit = defineEmits(['cart-changed'])
function emitChanged() { emit('cart-changed') }
</script>

<style scoped>
.cart-page {
  min-height: 400px;
}
.page-head {
  margin-bottom: 16px;
}
.page-head h2 {
  font-size: 20px;
}
.cart-table {
  background: #fff;
  border-radius: 8px;
  padding: 0 16px;
}
.table-head, .table-row {
  display: grid;
  grid-template-columns: 60px 1fr 120px 160px 120px 100px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.table-head {
  color: var(--text-sub);
  font-size: 13px;
}
.col-info {
  display: flex;
  gap: 12px;
  align-items: center;
}
.col-info img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border: 1px solid var(--border);
}
.info-text .name {
  font-size: 14px;
  line-height: 1.4;
  max-width: 360px;
}
.info-text .sp {
  color: var(--text-sub);
  font-size: 12px;
  margin-top: 4px;
}
.table-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}
.foot-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.selected-count {
  color: var(--text-sub);
  font-size: 13px;
}
.foot-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.total-price {
  color: var(--price);
  font-size: 22px;
  font-weight: 700;
  margin-right: 8px;
}
</style>
