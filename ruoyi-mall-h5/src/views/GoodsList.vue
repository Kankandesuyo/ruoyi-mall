<template>
  <div class="goods-list">
    <aside class="sidebar">
      <div class="side-title">分类筛选</div>
      <div v-loading="catLoading" class="cat-nav">
        <div class="cat-item" :class="{ active: !query.categoryId }" @click="selectCategory(null)">全部</div>
        <div
          v-for="c in categories"
          :key="c.id"
          class="cat-item"
          :class="{ active: String(query.categoryId) === String(c.id) }"
          @click="selectCategory(c.id)"
        >
          {{ c.name }}
        </div>
        <div v-if="!catLoading && !categories.length" class="empty">暂无分类</div>
      </div>
    </aside>
    <div class="main-area">
      <div class="result-bar">
        <span v-if="query.keyword">搜索“<b>{{ query.keyword }}</b>”的结果</span>
        <span v-else-if="query.categoryId">分类商品</span>
        <span v-else>全部商品</span>
        <span class="count">共 {{ total }} 件</span>
      </div>
      <div v-loading="loading" class="goods-grid">
        <ProductCard v-for="p in products" :key="p.id" :product="p" />
        <div v-if="!loading && !products.length" class="empty">没有找到相关商品</div>
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
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import { list as productList } from '@/api/product'
import { all as categoryAll } from '@/api/category'

const route = useRoute()
const router = useRouter()

const categories = ref([])
const products = ref([])
const total = ref(0)
const page = ref(0)
const size = 12
const loading = ref(false)
let requestVersion = 0
const catLoading = ref(false)
const query = reactive({ keyword: '', categoryId: null })

onMounted(() => {
  syncQuery()
  loadCategories()
  loadProducts()
})

watch(() => route.query, () => {
  syncQuery()
  page.value = 0
  loadProducts()
})

function syncQuery() {
  query.keyword = route.query.keyword || ''
  query.categoryId = route.query.categoryId || null
}

function selectCategory(id) {
  router.push({ path: '/goods', query: { ...route.query, categoryId: id || undefined, keyword: query.keyword || undefined } })
}

function onPageChange(p) {
  page.value = p - 1
  loadProducts()
}

async function loadCategories() {
  catLoading.value = true
  try {
    const res = await categoryAll()
    categories.value = (res.data || []).filter(c => c.showStatus !== 0)
  } catch (e) {
    console.error(e)
  } finally {
    catLoading.value = false
  }
}

async function loadProducts() {
  const version = ++requestVersion
  loading.value = true
  try {
    const body = {}
    if (query.keyword) body.nameLike = query.keyword
    if (query.categoryId) body.categoryId = query.categoryId
    const res = await productList(body, page.value, size)
    if (version !== requestVersion) return
    const data = res.data || {}
    products.value = data.records || []
    total.value = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
</script>

<style scoped>
.goods-list {
  display: flex;
  gap: 20px;
}
.sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  align-self: flex-start;
}
.side-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.cat-nav .cat-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-main);
  margin-bottom: 4px;
}
.cat-nav .cat-item:hover {
  background: var(--primary-light);
  color: var(--primary);
}
.cat-nav .cat-item.active {
  background: var(--primary);
  color: #fff;
}
.main-area {
  flex: 1;
  min-width: 0;
}
.result-bar {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 14px;
  color: var(--text-sub);
}
.result-bar b {
  color: var(--primary);
}
.result-bar .count {
  float: right;
}
.goods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-sub);
  padding: 60px 0;
}
.pager {
  margin-top: 20px;
  text-align: center;
}
</style>
