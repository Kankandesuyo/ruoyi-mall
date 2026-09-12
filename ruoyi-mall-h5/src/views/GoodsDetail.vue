<template>
  <div v-loading="loading" class="detail">
    <template v-if="product">
      <div class="top">
        <div class="gallery">
          <div class="main-pic">
            <img :src="currentPic || defaultImg" :alt="product.name" @error="onImgError" />
          </div>
          <div v-if="album.length > 1" class="thumbs">
            <div
              v-for="(pic, i) in album"
              :key="i"
              class="thumb"
              :class="{ active: currentPic === pic }"
              @click="currentPic = pic"
            >
              <img :src="pic" @error="onThumbError($event, i)" />
            </div>
          </div>
        </div>
        <div class="info">
          <h1 class="title">{{ product.name }}</h1>
          <div class="price-box">
            <span class="label">价格</span>
            <span class="price">{{ formatPrice(currentSku?.price ?? product.price) }} 积分</span>
          </div>
          <ul class="meta">
            <li v-if="product.brandName">品牌：{{ product.brandName }}</li>
            <li v-if="product.productCategoryName">分类：{{ product.productCategoryName }}</li>
            <li v-if="product.unit">单位：{{ product.unit }}</li>
          </ul>
          <!-- SKU 选择 -->
          <div v-if="skus.length" class="sku-box">
            <div class="sku-label">规格</div>
            <div class="sku-list">
              <span
                v-for="s in skus"
                :key="s.id"
                class="sku-item"
                :class="{ active: selectedSkuId === s.id }"
                @click="selectedSkuId = s.id"
              >
                {{ skuLabel(s) }}
              </span>
            </div>
            <div v-if="currentSku" class="sku-stock">库存：{{ currentSku.stock }} 件</div>
          </div>
          <!-- 数量 -->
          <div class="qty-box">
            <span class="qty-label">数量</span>
            <el-input-number v-model="quantity" :min="1" :max="maxQty" />
          </div>
          <!-- 操作 -->
          <div class="actions">
            <el-button type="warning" size="large" :icon="ShoppingCart" :loading="adding" :disabled="!available" @click="addToCart">加入购物车</el-button>
            <el-button type="danger" size="large" :disabled="!available" @click="buyNow">立即购买</el-button>
          </div>
        </div>
      </div>
      <ProductComments :key="product.id" :product-id="product.id" />
      <!-- 富文本详情 -->
      <div class="detail-html">
        <div class="html-title">商品详情</div>
        <div class="html-content" v-html="detailHtml"></div>
      </div>
    </template>
    <el-empty v-else-if="!loading" description="商品不存在或已下架" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ShoppingCart } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { detail as productDetail } from '@/api/product'
import { add as cartAdd } from '@/api/cart'
import ProductComments from '@/components/ProductComments.vue'
import DOMPurify from 'dompurify'
import { getToken } from '@/utils/auth'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
let requestVersion = 0
const product = ref(null)
const skus = ref([])
const selectedSkuId = ref(null)
const quantity = ref(1)
const currentPic = ref('')
const detailHtml = ref('')
const defaultImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23f5f5f5"/><text x="200" y="210" text-anchor="middle" fill="%23bbb" font-size="16">暂无图片</text></svg>'

const album = computed(() => {
  const pics = []
  if (product.value?.pic) pics.push(product.value.pic)
  if (product.value?.albumPics) {
    product.value.albumPics.split(',').forEach(p => {
      if (p && !pics.includes(p)) pics.push(p)
    })
  }
  return pics.length ? pics : [defaultImg]
})

const currentSku = computed(() => skus.value.find(s => s.id === selectedSkuId.value))
const maxQty = computed(() => Math.max(1, Number(currentSku.value?.stock) || 0))
const available = computed(() => !!product.value && !!currentSku.value && Number(currentSku.value.stock) > 0)
const adding = ref(false)

watch(selectedSkuId, () => { quantity.value = 1 })
watch(() => route.params.id, (id) => { if (id) load() })

onMounted(() => load())

async function load() {
  const version = ++requestVersion
  const id = route.params.id
  if (!id) return
  loading.value = true
  try {
    const res = await productDetail(id)
    if (version !== requestVersion) return
    const data = res.data || {}
    product.value = data.product?.publishStatus === 0 ? null : data.product
    skus.value = data.skus || []
    detailHtml.value = DOMPurify.sanitize(data.product?.detailMobileHtml || data.product?.detailHtml || '')
    currentPic.value = album.value[0] || ''
    selectedSkuId.value = skus.value.find(s => Number(s.stock) > 0)?.id ?? null
  } catch (e) {
    console.error(e)
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

function formatPrice(p) {
  if (p === null || p === undefined) return '0.00'
  return Number(p).toFixed(2)
}

function skuLabel(s) {
  if (s.spData) {
    try {
      const arr = JSON.parse(s.spData)
      if (Array.isArray(arr)) return arr.map(i => i.value).join(' / ')
      if (arr && typeof arr === 'object') return Object.values(arr).join(' / ')
    } catch (e) {}
  }
  return '默认规格'
}

function onImgError(e) { e.target.src = defaultImg }
function onThumbError(e, i) { e.target.src = defaultImg }

async function addToCart() {
  if (adding.value) return
  if (!getToken()) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!available.value || !Number.isSafeInteger(quantity.value) || quantity.value < 1 || quantity.value > maxQty.value) {
    ElMessage.warning('请选择有库存的规格和有效数量')
    return
  }
  const sku = currentSku.value || {}
  const payload = {
    productId: product.value.id,
    skuId: sku.id || null,
    quantity: quantity.value,
    pic: sku.pic || product.value.pic,
    productName: product.value.name,
    spData: sku.spData || ''
  }
  try {
    adding.value = true
    await cartAdd(payload)
    ElMessage.success('已加入购物车')
    emitCartChanged()
  } catch (e) {
    // 错误已在拦截器提示
  } finally { adding.value = false }
}

function buyNow() {
  if (!getToken()) {
    ElMessage.warning('请先登录')
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!available.value || !Number.isSafeInteger(quantity.value) || quantity.value < 1 || quantity.value > maxQty.value) {
    ElMessage.warning('请选择有库存的规格和有效数量')
    return
  }
  const sku = currentSku.value || skus.value[0] || {}
  router.push({ path: '/checkout', query: { skuId: sku.id, quantity: quantity.value, from: 'buy' } })
}

const emit = defineEmits(['cart-changed'])
function emitCartChanged() { emit('cart-changed') }
</script>

<style scoped>
.detail {
  min-height: 400px;
}
.top {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}
.gallery {
  width: 400px;
  flex-shrink: 0;
}
.main-pic {
  width: 400px;
  height: 400px;
  border: 1px solid var(--border);
  overflow: hidden;
  background: #fafafa;
}
.main-pic img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.thumbs {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.thumb {
  width: 60px;
  height: 60px;
  border: 2px solid transparent;
  cursor: pointer;
  overflow: hidden;
}
.thumb.active {
  border-color: var(--primary);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.info {
  flex: 1;
}
.title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 16px;
}
.price-box {
  background: linear-gradient(90deg, #fff4f2, #fff);
  padding: 14px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}
.price-box .label {
  color: var(--text-sub);
  font-size: 13px;
  margin-right: 12px;
}
.price-box .price {
  color: var(--price);
  font-size: 28px;
  font-weight: 700;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: var(--text-sub);
  font-size: 13px;
  margin-bottom: 20px;
}
.sku-box, .qty-box {
  margin-bottom: 20px;
}
.sku-label, .qty-label {
  color: var(--text-sub);
  margin-bottom: 10px;
  display: block;
  font-size: 13px;
}
.sku-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.sku-item {
  padding: 6px 16px;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.sku-item.active {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}
.sku-stock {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-sub);
}
.actions {
  margin-top: 24px;
  display: flex;
  gap: 14px;
}
.detail-html {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}
.html-title {
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.html-content {
  line-height: 1.8;
}
.html-content :deep(img) {
  max-width: 100%;
}
</style>
