<template>
 <span v-if="style" class="sticker" :class="code" role="img" :aria-label="style.label">
  <svg viewBox="0 0 120 112" aria-hidden="true">
   <path class="halo" d="M18 37 12 24 29 28M98 35 109 20 109 40M15 83 5 91 22 94" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
   <path d="m61 6 8 19 21-2-5 20 17 12-17 13 4 20-21-2-9 19-12-18-20 2 3-21-17-12 18-12-4-20 21 3Z" class="outline"/>
   <circle cx="60" cy="57" r="32" class="face"/>
   <template v-if="code==='heart'"><path d="M36 48c-8-10-17 4 5 15 20-16 8-27-5-15M76 48c-8-10-17 4 5 15 20-16 8-27-5-15" fill="#e64980"/></template>
   <template v-else><path d="M38 53q6-9 12 0M70 53q6-9 12 0" fill="none" stroke="#543510" stroke-width="4" stroke-linecap="round"/></template>
   <path d="M48 67q12 17 25-1" fill="#fff" stroke="#543510" stroke-width="3" stroke-linejoin="round"/>
   <ellipse cx="36" cy="65" rx="6" ry="3" fill="#ef9b79"/><ellipse cx="85" cy="65" rx="6" ry="3" fill="#ef9b79"/>
   <path v-if="code==='crown'" d="m37 24-5-17 17 8L60 1l12 14 17-8-5 17Z" fill="#ffd56b" stroke="#a16a16" stroke-width="2"/>
   <path v-if="code==='fire'" d="M60 26c-23-7-12-23-4-26-1 12 18 10 13 26" fill="#ff713e"/>
   <path d="m104 66 2 6 7 2-7 3-2 7-3-7-6-3 6-2Z" fill="currentColor"/>
  </svg><b>{{style.label}}</b>
 </span>
</template>
<script setup>
import {computed} from 'vue'
const props=defineProps({code:String})
const styles={star:{label:'星光打 CALL'},heart:{label:'心动暴击'},fire:{label:'燃爆了！'},crown:{label:'王者认证'}}
const style=computed(()=>styles[props.code])
</script>
<style scoped>
.sticker{display:inline-flex;align-items:center;flex-direction:column;width:112px;color:#d29729;filter:drop-shadow(0 4px 3px #8c641526);vertical-align:middle;flex-shrink:0}.sticker svg{width:108px;height:102px;overflow:visible}.outline{fill:#fff3bd;stroke:#c79225;stroke-width:2}.face{fill:#ffe08c}.sticker b{position:relative;margin-top:-13px;transform:rotate(-5deg);padding:5px 10px;border:2px solid #ad741e;border-radius:9px;background:#fff9df;color:#69400d;font-size:13px;white-space:nowrap;letter-spacing:1px}.heart{color:#dc78aa}.heart .outline{fill:#ffe0ed;stroke:#d67da2}.heart .face{fill:#ffe9b5}.heart b{background:#fff0f5;border-color:#d67da2;color:#a72d62}.fire{color:#e87831}.fire .outline{fill:#ffe0b7;stroke:#df8539}.fire b{color:#ad4517;border-color:#df8539}.crown .outline{fill:#283143;stroke:#caa04c;stroke-width:3}.crown b{background:#252c39;color:#ffde8b;border-color:#caa04c}
</style>
