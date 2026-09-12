<template>
  <div class="home">
    <!-- 分类导航 -->
    <section class="block">
      <div class="block-head">
        <h2>商品分类</h2>
      </div>
      <div v-loading="catLoading" class="cat-list">
        <div
          v-for="c in categories"
          :key="c.id"
          class="cat-item"
          @click="$router.push({ path: '/goods', query: { categoryId: c.id } })"
        >
          <el-icon v-if="c.icon"><component :is="c.icon" /></el-icon>
          <span>{{ c.name }}</span>
        </div>
        <div v-if="!catLoading && !categories.length" class="empty">暂无分类</div>
      </div>
    </section>

    <!-- 商品推荐 -->
    <section class="block">
      <div class="block-head">
        <h2>为你推荐</h2>
        <el-button text @click="loadMore" :loading="loading">换一批</el-button>
      </div>
      <div v-loading="loading" class="goods-grid">
        <ProductCard v-for="p in products" :key="p.id" :product="p" />
        <div v-if="!loading && !products.length" class="empty">暂无商品</div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import { list as productList } from '@/api/product'
import { all as categoryAll } from '@/api/category'

const categories = ref([])
const products = ref([])
const catLoading = ref(false)
const loading = ref(false)
const currentPage = ref(0)
const pageCount = ref(1)

onMounted(() => {
  loadCategories()
  loadProducts()
})

async function loadCategories() {
  catLoading.value = true
  try {
    const res = await categoryAll()
    categories.value = (res.data || []).filter(c => c.showStatus !== 0)
  } catch (e) {
    console.error('分类加载失败', e)
  } finally {
    catLoading.value = false
  }
}

async function loadProducts() {
  loading.value = true
  try {
    const page = currentPage.value
    const res = await productList({}, page, 12)
    const data = res.data || {}
    products.value = data.records || []
    pageCount.value = Math.max(1, Math.ceil((data.total || 0) / 12))
  } catch (e) {
    console.error('商品加载失败', e)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (loading.value) return
  currentPage.value = (currentPage.value + 1) % pageCount.value
  loadProducts()
}
</script>

<style scoped>
.block {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
}
.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px;
}
.block-head h2 {
  font-size: 18px;
  color: var(--text-main);
}
.cat-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.cat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 18px;
  background: #f7f7f7;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-main);
  transition: all 0.2s;
}
.cat-item:hover {
  background: var(--primary-light);
  color: var(--primary);
}
.goods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.empty {
  width: 100%;
  text-align: center;
  color: var(--text-sub);
  padding: 30px 0;
}
</style>
