<template>
  <div class="orders-page">
    <div class="page-head"><h2>我的订单</h2></div>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待付款" name="0" />
      <el-tab-pane label="待发货" name="1" />
      <el-tab-pane label="待收货" name="2" />
      <el-tab-pane label="已完成" name="3" />
    </el-tabs>

    <div v-loading="loading" class="order-list">
      <div v-for="o in orders" :key="o.orderId" class="order-card">
        <div class="order-head">
          <span class="order-sn">订单号：{{ o.orderSn || o.orderId }}</span>
          <span class="order-time">{{ o.createTime }}</span>
          <el-tag :type="statusTag(o.status)" size="small">{{ statusText(o.status) }}</el-tag>
        </div>
        <div class="order-goods">
          <div v-for="item in o.orderItemList" :key="item.id" class="goods-row">
            <img :src="item.pic || defaultImg" @error="e => e.target.src = defaultImg" />
            <div class="goods-info">
              <p class="name">{{ item.productName }}</p>
              <p v-if="item.spData" class="sp">规格：{{ formatSp(item.spData) }}</p>
            </div>
            <span class="price">{{ formatPrice(item.salePrice) }} 积分</span>
            <span class="qty">x{{ item.quantity }}</span>
          </div>
        </div>
        <div class="order-foot">
          <div class="receiver">
            <span>收货人：{{ o.receiverName }} {{ o.receiverPhone }}</span>
            <span class="addr">{{ [o.receiverProvince, o.receiverCity, o.receiverDistrict, o.receiverDetailAddress].filter(Boolean).join(' ') }}</span>
          </div>
          <div class="foot-right">
            <span class="amount">{{ o.status === 0 ? '待付' : o.status === 4 ? '订单金额' : '实付' }}：<b>{{ formatPrice(o.payAmount) }} {{ o.payType === 3 || o.status === 0 ? '积分' : '元' }}</b></span>
            <div class="ops">
              <el-button v-if="o.status === 0" type="primary" size="small" :disabled="busy" @click="payOrder(o)">积分支付</el-button>
              <el-button v-if="o.status === 0" size="small" :disabled="busy" @click="cancelOrder(o)">取消订单</el-button>
              <el-button v-if="o.status === 2" type="success" size="small" :disabled="busy" @click="completeOrder(o)">确认收货</el-button>
              <el-button v-if="o.status === 1 || o.status === 2" size="small" :disabled="busy" @click="$router.push('/goods/' + (o.orderItemList?.[0]?.productId || ''))">再次购买</el-button>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-if="!loading && !orders.length" description="暂无相关订单" />
    </div>

    <div v-if="total > size" class="pager">
      <el-pagination
        background
        layout="prev, pager, next"
        :page-size="size"
        :total="total"
        :current-page="page + 1"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { page as orderPage, pay as orderPay, cancel as orderCancel, complete as orderComplete } from '@/api/order'

const route = useRoute()
const activeTab = ref('all')
const busy = ref(false)
const orders = ref([])
const total = ref(0)
const page = ref(0)
const size = 10
const loading = ref(false)
let requestVersion = 0
const defaultImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23f5f5f5"/></svg>'

watch(() => route.query.status, value => {
  activeTab.value = ['0', '1', '2', '3'].includes(value) ? value : 'all'
  page.value = 0
  load()
}, { immediate: true })

function onTabChange() {
  page.value = 0
  load()
}
function onPageChange(p) {
  page.value = p - 1
  load()
}

async function load() {
  const version = ++requestVersion
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? undefined : Number(activeTab.value)
    const res = await orderPage(status, page.value, size)
    if (version !== requestVersion) return
    const data = res.data || {}
    orders.value = data.records || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

async function payOrder(o) {
  if (busy.value) return
  busy.value = true
  try {
    await ElMessageBox.confirm('将使用活动积分支付此支付单下的待付款商品，是否继续？', '积分支付')
    const { data } = await orderPay({ payId: o.payId, type: 3 })
    if (data?.payType !== 3) throw new Error('支付结果异常，请刷新订单确认')
    ElMessage.success('积分支付成功，等待商家发货')
    await load()
  } catch (e) {} finally { busy.value = false }
}

async function cancelOrder(o) {
  if (busy.value) return
  busy.value = true
  try {
    await ElMessageBox.confirm('确定取消该订单吗？', '提示', { type: 'warning' })
    await orderCancel([o.orderId])
    ElMessage.success('订单已取消')
    await load()
  } catch (e) {} finally { busy.value = false }
}

async function completeOrder(o) {
  if (busy.value) return
  busy.value = true
  try {
    await ElMessageBox.confirm('确认已收到商品吗？', '提示', { type: 'warning' })
    await orderComplete(o.orderId)
    ElMessage.success('确认收货成功')
    await load()
  } catch (e) {} finally { busy.value = false }
}

function statusText(s) {
  return ['待付款', '待发货', '待收货', '已完成', '已关闭'][s] || '未知'
}
function statusTag(s) {
  return ['', 'info', 'warning', 'success', 'danger'][s] || ''
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
</script>

<style scoped>
.orders-page {
  min-height: 400px;
}
.page-head {
  margin-bottom: 16px;
}
.page-head h2 {
  font-size: 20px;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.order-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
}
.order-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}
.order-sn {
  color: var(--text-sub);
  font-size: 13px;
}
.order-time {
  color: var(--text-sub);
  font-size: 13px;
  flex: 1;
}
.order-goods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.goods-row {
  display: grid;
  grid-template-columns: 70px 1fr 100px 60px;
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
.order-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border);
  padding-top: 12px;
  margin-top: 12px;
}
.receiver {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--text-sub);
}
.foot-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.foot-right .amount b {
  color: var(--price);
  font-size: 16px;
}
.ops {
  display: flex;
  gap: 8px;
}
.pager {
  margin-top: 20px;
  text-align: center;
}
</style>
