<template>
  <div v-loading="loading" class="points-page">
    <h2>积分活动</h2>
    <el-card><h3>可用积分 {{ account.balance ?? '—' }}</h3>
      <p>参加后台配置的签到活动获取积分，用积分兑换商城商品。</p>
      <p>每日签到可获得 {{ account.reward ?? '—' }} 积分，每天限领一次。</p>
      <div v-if="account.multiplier != null" class="reward-explanation">
        <strong>签到积分怎么算？</strong>
        <p>活动基础奖励 {{ account.rule?.signCount ?? '—' }} 积分 × 您当前 LV{{ account.level }} 等级倍率 {{ Number(account.multiplier).toFixed(2) }} = <b>{{ account.reward }}</b> 积分。</p>
        <span>实际奖励向下取整；等级越高，加成越多。上方可用积分是账户余额，与单次签到奖励不同。管理员重置今日签到后，可重新领取一次。</span>
      </div>
      <el-button type="primary" :loading="busy" :disabled="!ready || account.signedToday || account.rule?.signStatus !== 1" @click="claim">
        {{ account.signedToday ? '今日已领取' : account.rule?.signStatus === 1 ? '签到领积分' : '活动未开放' }}
      </el-button>
      <el-button @click="$router.push('/goods')">去兑换商品</el-button>
      <el-button @click="$router.push('/orders')">支付待付款订单</el-button>
    </el-card>
    <h3>积分明细</h3>
    <el-table :data="records">
      <el-table-column prop="createTime" label="时间" />
      <el-table-column label="来源 / 用途"><template #default="{ row }">{{ labels[row.subOpType] || '积分变动' }}</template></el-table-column>
      <el-table-column label="积分"><template #default="{ row }">{{ row.opType === 2 ? '-' : '+' }}{{ row.amount }}</template></el-table-column>
      <el-table-column prop="beforePoints" label="变更前" /><el-table-column prop="afterPoints" label="变更后" /><el-table-column prop="orderId" label="关联订单" />
    </el-table>
    <el-pagination layout="prev, pager, next" :page-size="20" :total="total" @current-change="changePage" />
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { activity, signIn, history } from '@/api/points'
const account = ref({}), records = ref([]), total = ref(0), page = ref(0)
const loading = ref(false), busy = ref(false), ready = ref(false)
const labels = { 11: '活动签到', 12: '历史消费奖励', 13: '订单退款', 14: '管理员奖励', 25: '管理员扣减', 21: '退款扣除', 22: '订单积分支付', 23: '等级升级', 24: '积分兑换优惠券' }
async function load() {
  loading.value = true
  ready.value = false
  try {
    const [a, h] = await Promise.all([activity(), history(page.value)])
    account.value = a.data
    records.value = h.data.records || []
    total.value = h.data.total || 0
    ready.value = true
  } finally { loading.value = false }
}
async function claim() {
  if (busy.value || !ready.value) return
  busy.value = true
  try { await signIn(); ElMessage.success('签到成功，积分已到账'); await load() }
  catch (e) {} finally { busy.value = false }
}
function changePage(value) { page.value = value - 1; load().catch(() => {}) }
onMounted(() => load().catch(() => {}))
</script>
<style scoped>.points-page { display: grid; gap: 20px; } p { margin: 14px 0; }.reward-explanation{padding:14px 16px;margin:0 0 18px;border-left:3px solid #e6a23c;border-radius:8px;background:#fff8e9;color:#785a28}.reward-explanation p{margin:8px 0;line-height:1.7}.reward-explanation span{font-size:13px;line-height:1.7;color:#8a7554}</style>
