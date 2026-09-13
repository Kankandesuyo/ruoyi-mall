<template>
  <el-dialog append-to-body :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="晋升礼遇" width="min(520px, 94vw)" align-center destroy-on-close>
    <div class="ceremony" :class="'tier-'+level">
      <div class="halo"></div><div class="orbit"></div>
      <i v-for="n in level*6" :key="n" class="spark" :style="{'--angle': `${n*137.5}deg`, '--delay': `${n%7*.13}s`}"></i>
      <span class="caption">A NEW CHAPTER</span>
      <svg class="crown" viewBox="0 0 120 100" aria-hidden="true"><path d="M15 30 38 48 60 12 82 48 105 30 94 78H26Z" fill="currentColor"/><path d="M28 88H92" stroke="currentColor" stroke-width="7"/><path d="m60 43 9 14-9 14-9-14Z" fill="#ffffff" opacity=".8"/></svg>
      <strong>LV{{level}}</strong><h2>{{name}}</h2><p>{{titles[level]}}</p><span class="rule"></span><p>新身份与等级权益已解锁</p>
      <el-button round @click="$emit('update:visible', false)">开启我的新旅程</el-button>
    </div>
  </el-dialog>
</template>
<script setup>
defineProps({visible:Boolean,level:{type:Number,default:2},name:String})
defineEmits(['update:visible'])
const titles={2:'银蓝初绽 · 成长启程',3:'紫晶流光 · 荣耀进阶',4:'耀金冠冕 · 尊贵加冕',5:'曜黑金辉 · 至臻典藏'}
</script>
<style scoped>
.ceremony{--metal:#a8d7ff;position:relative;isolation:isolate;overflow:hidden;text-align:center;padding:42px 18px;border-radius:18px;color:var(--metal);background:radial-gradient(ellipse at top,#284566,#0b1427 75%)}
.tier-3{--metal:#dec2ff;background:radial-gradient(ellipse at top,#593a76,#171027 75%)}.tier-4{--metal:#ffe0a2;background:radial-gradient(ellipse at top,#826035,#21190d 75%)}.tier-5{--metal:#ffdf8e;background:radial-gradient(ellipse at top,#5f4b25,#08090e 70%);box-shadow:inset 0 0 0 2px #b8944b,inset 0 0 55px #c6993940}
.caption{position:relative;font-size:10px;letter-spacing:5px}.crown{position:relative;display:block;width:100px;height:86px;margin:30px auto 14px;filter:drop-shadow(0 0 14px currentColor);animation:reveal .9s ease-out both}.tier-4 .crown{width:120px;height:100px}.tier-5 .crown{width:140px;height:116px;filter:drop-shadow(0 0 24px #efbf60)}strong{position:relative;font:600 42px Georgia,serif;letter-spacing:6px}h2{position:relative;font-size:25px;letter-spacing:6px;margin:12px 0}p{position:relative;font-size:13px;letter-spacing:2px;line-height:1.8}.rule{display:block;width:90px;height:1px;background:currentColor;margin:22px auto;opacity:.6}.el-button{position:relative;margin-top:16px;background:var(--metal);border:none;color:#1c2332;padding:20px 30px}.halo{position:absolute;width:260px;height:260px;border:1px solid currentColor;border-radius:50%;left:50%;top:52px;transform:translateX(-50%);opacity:.2;box-shadow:0 0 55px currentColor;animation:glow 3s ease-in-out 3}.orbit{position:absolute;inset:14px;border:1px solid currentColor;border-radius:12px;opacity:.3}.spark{position:absolute;width:3px;height:3px;background:currentColor;left:50%;top:35%;border-radius:50%;animation:scatter 2.6s ease-out both;animation-delay:var(--delay);box-shadow:0 0 6px currentColor}.tier-5 .spark{width:4px;height:4px;animation-iteration-count:2}@keyframes scatter{0%{opacity:0;transform:rotate(var(--angle)) translateY(30px)}30%{opacity:1}100%{opacity:0;transform:rotate(var(--angle)) translateY(240px)}}@keyframes reveal{from{opacity:0;transform:translateY(20px) scale(.6)}to{opacity:1;transform:none}}@keyframes glow{50%{opacity:.4;box-shadow:0 0 90px currentColor}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}.spark{display:none}}
</style>
