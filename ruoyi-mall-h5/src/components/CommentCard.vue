<template>
 <article class="comment-card" :class="{gold:row.user?.level===4,obsidian:row.user?.level>=5}">
  <div v-if="row.user?.level>=4" class="ribbon"><span>{{row.user.level>=5?'♛ 曜黑尊享':'✧ 耀金之声'}}</span><small>LV{{row.user.level}} 专属评论</small></div>
  <MemberIdentity :user="row.user" comment/>
  <div class="comment-body"><p>{{row.content}}</p><ExclusiveSticker v-if="row.emote" :code="row.emote"/></div>
  <time>{{row.createTime}}</time>
 </article>
</template>
<script setup>
import MemberIdentity from './MemberIdentity.vue'
import ExclusiveSticker from './ExclusiveSticker.vue'
defineProps({row:{type:Object,required:true}})
</script>
<style scoped>
.comment-card{position:relative;padding:18px;margin:16px 0;border:1px solid #e5e9f0;border-radius:18px;background:white;min-width:0}.gold{border:2px solid #dab363;background:linear-gradient(125deg,#fff8dd,#fffdf8 65%,#faeac0);box-shadow:0 5px 18px #b8892020}.obsidian{border:2px solid #b9924c;background:linear-gradient(120deg,#f8f3e7,#fffdf7 70%,#ede1c4);box-shadow:0 6px 20px #3c2f2326}.ribbon{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:-18px -18px 12px;padding:10px 16px;border-radius:15px 15px 0 0;background:linear-gradient(110deg,#e8c578,#fae6b3);color:#704a10;font-weight:700;letter-spacing:1px}.obsidian .ribbon{background:linear-gradient(110deg,#171d29,#343747);color:#f5d68d}.ribbon small{font-size:11px;white-space:nowrap;font-weight:400;letter-spacing:0}.comment-body{padding:0 12px 12px;display:flex;flex-wrap:wrap;align-items:center;gap:16px}.comment-body p{flex:1;min-width:130px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.9;color:#303847;margin:10px 0}.comment-card time{display:block;color:#858071;font-size:12px;padding:0 12px}.comment-card :deep(.identity){background:transparent;border:none;padding:4px 10px 10px}@media(max-width:600px){.comment-card{padding:14px}.ribbon{margin:-14px -14px 12px;padding:10px 12px}.comment-body{padding:0 4px 12px}}
</style>
