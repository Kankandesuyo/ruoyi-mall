<template>
  <div v-loading="loading" class="checkout-page">
    <div class="page-head"><h2>确认订单</h2></div>

    <!-- 收货地址 -->
    <section class="block">
      <div class="block-title">收货地址</div>
      <div v-if="addresses.length" class="addr-list">
        <div
          v-for="a in addresses"
          :key="a.id"
          class="addr-item"
          :class="{ active: selectedAddrId === a.id }"
          @click="!submitting && (selectedAddrId = a.id)"
        >
          <div class="addr-top">
            <span class="name">{{ a.name }}</span>
            <span class="phone">{{ a.phone }}</span>
            <el-tag v-if="a.isDefault === 1" size="small" type="danger">默认</el-tag>
          </div>
          <div class="addr-detail">{{ fullAddress(a) }}</div>
        </div>
        <div class="addr-item add-new" @click="$router.push('/address')">
          <el-icon><Plus /></el-icon>
          <span>新增地址</span>
        </div>
      </div>
      <el-empty v-else description="还没有收货地址">
        <el-button type="primary" @click="$router.push('/address')">去添加</el-button>
      </el-empty>
    </section>

    <!-- 商品清单 -->
    <section class="block">
      <div class="block-title">商品清单</div>
      <div v-if="calcData.skuList?.length" class="goods-list">
        <div v-for="s in calcData.skuList" :key="s.skuId" class="goods-row">
          <img :src="s.pic || defaultImg" @error="e => e.target.src = defaultImg" />
          <div class="goods-info">
            <p class="name">{{ s.productName }}</p>
            <p v-if="s.spData" class="sp">规格：{{ formatSp(s.spData) }}</p>
          </div>
          <span class="price">{{ formatPrice(s.price) }} 积分</span>
          <span class="qty">x{{ s.quantity }}</span>
          <span class="sub">{{ formatPrice(s.price * s.quantity) }} 积分</span>
        </div>
      </div>
      <div v-else class="loading-text">{{ loading ? '正在加载商品信息...' : '请选择地址，商品信息以后台校验为准' }}</div>
    </section>

    <section class="block">
      <div class="block-title">积分支付</div>
      <p>可用积分：{{ points.balance }}。商品价格数值即所需积分，支付后等待商家发货。</p>
      <el-button link type="primary" @click="$router.push('/points')">参加活动获取积分</el-button>
    </section>
    <!-- 备注 -->
    <section class="block">
      <div class="block-title">订单备注</div>
      <el-input v-model="note" type="textarea" :rows="2" placeholder="选填，给商家留言（50字以内）" maxlength="50" show-word-limit />
    </section>

    <!-- 结算栏 -->
    <div class="settle-bar">
      <div class="settle-left">
        合计：<span class="total">{{ formatPrice(calcData.orderTotalAmount ?? calcData.productTotalAmount) }} 积分</span>
      </div>
      <el-button type="danger" size="large" :loading="submitting" :disabled="!selectedAddrId || !calcReady || loading" @click="submitOrder">提交订单</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { validSkuList } from '@/utils/contract'
import { list as addrList } from '@/api/address'
import { addOrderCheck, add as orderAdd } from '@/api/order'

import { activity } from '@/api/points'
const points = ref({ balance: '—' })
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const calcReady = ref(false)
let calcVersion = 0
const emit = defineEmits(['cart-changed'])
const addresses = ref([])
const selectedAddrId = ref(null)
const note = ref('')
const calcData = reactive({ skuList: [], productTotalAmount: 0, orderTotalAmount: 0 })
const defaultImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23f5f5f5"/></svg>'

let skuList = []

onMounted(async () => {
  if (!buildSkuList()) return
  await loadAddresses()
  try { points.value = (await activity()).data } catch (e) {}
})

function buildSkuList() {
  const from = route.query.from
  if (from === 'buy') {
    skuList = [{ skuId: Number(route.query.skuId), quantity: Number(route.query.quantity ?? 1) }]
  } else {
    // 从购物车结算，读 sessionStorage
    const str = sessionStorage.getItem('checkout_items')
    if (str) {
      try { skuList = JSON.parse(str) } catch (e) { skuList = [] }
    }
  }
  if (!validSkuList(skuList)) {
    skuList = []
    ElMessage.error('没有有效的结算商品，请重新选择')
    router.replace('/cart')
    return false
  }
  return true
}

async function loadAddresses() {
  try {
    const res = await addrList()
    addresses.value = res.data || []
    if (addresses.value.length) {
      const def = addresses.value.find(a => a.isDefault === 1)
      selectedAddrId.value = def ? def.id : addresses.value[0].id
    }
  } catch (e) {
    console.error(e)
  }
}

watch(selectedAddrId, () => { calcReady.value = false; calcOrder() })

async function calcOrder() {
  const version = ++calcVersion
  calcReady.value = false
  if (!validSkuList(skuList) || !selectedAddrId.value) return
  loading.value = true
  try {
    const res = await addOrderCheck({
      skuList,
      receiveAddressId: selectedAddrId.value,
      deliveryType: 1,
      payType: 3,
      note: note.value,
      from: route.query.from === 'buy' ? null : 'cart'
    })
    if (version !== calcVersion) return
    if (!res.data?.skuList?.length || res.data.orderTotalAmount == null) throw new Error('订单算价结果不完整')
    Object.assign(calcData, res.data)
    calcReady.value = true
  } catch (e) {
    console.error(e)
  } finally {
    if (version === calcVersion) loading.value = false
  }
}

async function submitOrder() {
  if (submitting.value || loading.value || !calcReady.value || !validSkuList(skuList)) return
  if (!selectedAddrId.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  submitting.value = true
  try {
    const res = await orderAdd({
      addressId: selectedAddrId.value,
      note: note.value,
      payType: 3,
      from: route.query.from === 'buy' ? null : 'cart',
      skuList
    })
    if (!res.data) throw new Error('未返回订单编号')
    calcReady.value = false
    emit('cart-changed')
    sessionStorage.removeItem('checkout_items')
    ElMessage.success('下单成功')
    router.replace('/orders')
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

function formatPrice(p) { return Number(p || 0).toFixed(2) }
function formatSp(sp) {
  try {
    const arr = JSON.parse(sp)
    if (Array.isArray(arr)) return arr.map(i => i.value).join(' / ')
    if (arr && typeof arr === 'object') return Object.values(arr).join(' / ')
  } catch (e) {}
  return sp
}
function fullAddress(a) { return [a.province, a.city, a.district, a.detailAddress].filter(Boolean).join(' ') }
</script>

<style scoped>
.checkout-page {
  padding-bottom: 70px;
}
.page-head {
  margin-bottom: 16px;
}
.page-head h2 {
  font-size: 20px;
}
.block {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.block-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.addr-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.addr-item {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 16px;
  cursor: pointer;
  min-width: 240px;
  transition: all 0.2s;
}
.addr-item.active {
  border-color: var(--primary);
  background: var(--primary-light);
}
.addr-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.addr-top .name {
  font-weight: 600;
}
.addr-top .phone {
  color: var(--text-sub);
}
.addr-detail {
  color: var(--text-main);
  font-size: 13px;
}
.addr-item.add-new {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-sub);
}
.goods-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.goods-row {
  display: grid;
  grid-template-columns: 70px 1fr 100px 60px 100px;
  align-items: center;
  gap: 12px;
}
.goods-row img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border: 1px solid var(--border);
}
.goods-info .name {
  font-size: 14px;
  line-height: 1.4;
}
.goods-info .sp {
  color: var(--text-sub);
  font-size: 12px;
  margin-top: 4px;
}
.goods-row .price {
  color: var(--text-sub);
}
.goods-row .qty {
  color: var(--text-sub);
}
.goods-row .sub {
  color: var(--price);
  font-weight: 600;
}
.loading-text {
  color: var(--text-sub);
  padding: 20px 0;
  text-align: center;
}
.settle-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid var(--border);
  padding: 14px 0;
  z-index: 100;
}
.settle-bar .settle-left {
  width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}
.settle-bar .total {
  color: var(--price);
  font-size: 24px;
  font-weight: 700;
}
</style>
