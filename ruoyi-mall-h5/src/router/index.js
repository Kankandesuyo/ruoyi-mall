import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import DefaultLayout from '@/layout/DefaultLayout.vue'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', name: 'Home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
      { path: 'goods', name: 'GoodsList', component: () => import('@/views/GoodsList.vue'), meta: { title: '商品列表' } },
      { path: 'goods/:id', name: 'GoodsDetail', component: () => import('@/views/GoodsDetail.vue'), meta: { title: '商品详情' } },
      { path: 'cart', name: 'Cart', component: () => import('@/views/Cart.vue'), meta: { title: '购物车', auth: true } },
      { path: 'checkout', name: 'Checkout', component: () => import('@/views/Checkout.vue'), meta: { title: '确认订单', auth: true } },
      { path: 'orders', name: 'Orders', component: () => import('@/views/Orders.vue'), meta: { title: '我的订单', auth: true } },
      { path: 'level', component: () => import('@/views/LevelCenter.vue'), meta: { title: '等级中心', auth: true } },
      { path: 'points', component: () => import('@/views/Points.vue'), meta: { title: '积分活动', auth: true } },
      { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人中心', auth: true } },
      { path: 'address', name: 'Address', component: () => import('@/views/Address.vue'), meta: { title: '收货地址', auth: true } }
    ]
  },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? to.meta.title + ' - 若依商城' : '若依商城'
  if (to.meta.auth && !getToken()) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
