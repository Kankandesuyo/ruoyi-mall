<template>
 <div class="identity" :class="['bg-'+appearance.background, {'decorated': comment && user.level >= 4}]">
  <MemberAvatar :avatar="user.avatar" :nickname="user.nickname" :frame="appearance.frame" :compact="comment" />
  <div class="identity-text"><strong :class="['name-'+appearance.nicknameStyle, 'font-'+appearance.font]">{{ user.nickname || '会员' }}</strong>
   <span class="badge" :class="{honor:user.level===5}">LV{{ user.level || 1 }}{{ user.level === 5 ? ' ✦ 荣誉' : '' }}</span>
   <small v-if="user.level===5 && !comment">荣誉会员铭牌 · {{ year }} 年活跃身份</small>
  </div>
 </div>
</template>
<script setup>
import { computed } from 'vue'
import MemberAvatar from './MemberAvatar.vue'
const props=defineProps({user:{type:Object,default:()=>({})},comment:Boolean})
const appearance=computed(()=>props.user.appearance || {})
const year=new Date().getFullYear()
</script>
<style scoped>
.identity{display:flex;align-items:center;gap:16px;padding:14px;border-radius:16px;color:#26364b}.identity strong{font-size:18px}.badge{display:inline-block;margin-left:10px;font-size:12px;padding:3px 8px;background:#e8edf7;color:#3c5587;border-radius:6px}.honor{background:#fcf0cf;color:#765316}small{display:block;margin-top:8px;color:#806b3e}.identity-text{min-width:0;overflow-wrap:anywhere}.identity-text strong{line-height:1.6}.name-white{color:#fff;background:#55657a;padding:2px 6px;border-radius:4px}.name-blue{color:#2563aa}.name-green{color:#26734c}.name-purple{color:#7950a8}.name-rose{color:#ad4569}.name-amber{color:#946215}.name-gradient{background:linear-gradient(100deg,#2269a8,#8b3d98);background-clip:text;color:transparent}.name-glow{color:#805f20;text-shadow:0 0 9px #e5ca85}.font-serif{font-family:Georgia,'SimSun',serif}.font-rounded{font-family:'Microsoft YaHei',sans-serif;letter-spacing:1px}.bg-ocean{background:#edf6fc}.bg-forest{background:#ecf5ef}.decorated{border-left:3px solid #b4a278} @media(max-width:600px){.identity{gap:12px;padding:10px}.identity strong{font-size:16px}.badge{margin-left:6px}}
</style>
