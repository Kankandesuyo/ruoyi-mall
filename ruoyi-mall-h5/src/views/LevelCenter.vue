<template>
 <div v-loading="loading" class="level-center" :class="'theme-'+data.appearance?.theme">
  <div class="heading"><div><span class="eyebrow">MEMBER CLUB</span><h1>等级中心</h1><p>用积分解锁更多身份与权益，每一次成长都由你决定。</p></div><el-button @click="$router.push('/points')">赚取积分</el-button></div>
  <template v-if="data.current">
   <section class="hero"><MemberIdentity :user="data"/><div class="metrics"><div><span>可用积分</span><b>{{data.balance}}</b></div><div><span>积分获取倍率</span><b>×{{data.current.pointMultiplier.toFixed(2)}}</b></div><div><span>当前身份</span><b>{{data.current.levelName}}</b></div></div></section>
   <div class="columns"><el-card><h2>{{data.next ? '下一站 · LV'+data.next.level+' '+data.next.levelName : '已达到最高等级'}}</h2>
    <template v-if="data.next"><p>升级消耗 <strong>{{data.next.upgradeCost}}</strong> 积分</p><p v-if="shortfall>0">还差 {{shortfall}} 积分，先去参加积分活动吧。</p><p>{{data.next.description}}</p>
    <el-button type="primary" :disabled="shortfall>0" :loading="busy" @click="upgrade">升级到 LV{{data.next.level}}</el-button></template>
    <p v-else>感谢你的持续参与，荣誉身份与全部等级权益已解锁。</p><p class="hint">升级逐级进行，不可撤销。积分消费不会降低等级。</p>
   </el-card><el-card><h2>当前已解锁权益</h2><p v-for="c in unlocked" :key="c.level"><b>LV{{c.level}}</b> · {{c.description}}</p></el-card></div>
   <h2>成长路线</h2><div class="roadmap"><div v-for="c in data.configs" :key="c.level" class="milestone" :class="{active:c.level<=data.level}"><b>LV{{c.level}} {{c.levelName}}</b><p>×{{c.pointMultiplier.toFixed(2)}} 倍积分</p><small>{{c.level===1 ? '默认等级' : '升级消耗 '+c.upgradeCost+' 积分'}}</small></div></div>
   <el-card><h2>评论装饰 · 效果预览</h2><p class="hint">发表后自动按等级展示。LV4 解锁耀金评论卡，LV5 升级为曜黑尊享评论卡；专属贴纸需在评论编辑区选择。</p><div class="comment-previews"><CommentCard v-for="level in [4,5]" :key="level" :row="{user:{...data,level,appearance:{...data.appearance,frame:level===4?'aurora':'gold'}},content:'每一次认真分享，都值得被看见。',emote:level===4?'heart':'crown',createTime:'装饰效果预览'}" /></div></el-card>
   <el-card><h2>身份外观</h2><p class="hint">头像框按等级解锁；点击预览卡选择，保存后生效。升级后原有装饰仍可使用。</p><div class="frame-picker" role="group" aria-label="头像框选择">
     <button v-for="(required, frame) in data.options.frame" :key="frame" type="button" class="frame-option" :class="{selected:draft.frame===frame}" :disabled="required>data.level" :aria-pressed="draft.frame===frame" @click="draft.frame=frame">
      <MemberAvatar :avatar="data.avatar" :nickname="data.nickname" :frame="frame" />
      <b>{{labels[frame] || frame}}</b><small>{{ required>data.level ? 'LV'+required+' 解锁' : draft.frame===frame ? '已选择 · 保存后生效' : '可使用' }}</small>
     </button>
    </div><div class="appearance-form"><label v-for="(options,key) in data.options" :key="key">{{categoryLabels[key]}}<el-select v-model="draft[key]"><el-option v-for="(required,value) in options" v-show="required<=data.level" :key="value" :label="labels[value] || value" :value="value" :disabled="required>data.level"/></el-select></label></div><el-button type="primary" :loading="saving" @click="save">保存外观</el-button></el-card>
  </template><el-empty v-else-if="!loading" description="等级信息暂时不可用"><el-button @click="load">重试</el-button></el-empty>
 </div>
</template>
<script setup>
import {ref,computed,onMounted} from 'vue'
import {ElMessage,ElMessageBox} from 'element-plus'
import MemberIdentity from '@/components/MemberIdentity.vue'
import MemberAvatar from '@/components/MemberAvatar.vue'
import CommentCard from '@/components/CommentCard.vue'
import {levelCenter,upgradeLevel,saveAppearance} from '@/api/level'
const data=ref({}),draft=ref({}),loading=ref(false),busy=ref(false),saving=ref(false)
const shortfall=computed(()=>Math.max(0,Number(data.value.next?.upgradeCost)-Number(data.value.balance)))
const unlocked=computed(()=>data.value.configs?.filter(c=>c.level<=data.value.level)||[])
const categoryLabels={nicknameStyle:'昵称颜色',frame:'头像框',font:'字体',background:'主页背景',theme:'客户端主题'}
const labels={default:'默认',white:'白色',blue:'蓝色',green:'绿色',purple:'紫色',rose:'玫瑰',amber:'琥珀',gradient:'渐变',glow:'柔光',silver:'冰晶银冠',aurora:'耀金圣冠',gold:'曜黑尊冠',serif:'衬线字体',rounded:'舒展字体',ocean:'海洋',forest:'森林'}
function update(value){data.value=value;draft.value={...value.appearance};window.dispatchEvent(new CustomEvent('member-theme',{detail:value.appearance?.theme || 'default'}))}
async function load(){loading.value=true;try{update((await levelCenter()).data)}catch{}finally{loading.value=false}}
async function upgrade(){if(busy.value)return;busy.value=true;const current=data.value.level,next=data.value.next;try{await ElMessageBox.confirm(`升级 LV${next.level} 将消耗 ${next.upgradeCost} 积分，升级后无法恢复，是否继续？`,'确认升级',{confirmButtonText:'确认升级',cancelButtonText:'取消',type:'warning'});update((await upgradeLevel(current)).data);ElMessage.success('升级成功，新权益已解锁')}catch(e){if(e!=='cancel' && e!=='close')await load()}finally{busy.value=false}}
async function save(){saving.value=true;try{update((await saveAppearance(draft.value)).data);ElMessage.success('外观已保存')}catch{}finally{saving.value=false}}
onMounted(load)
</script>
<style scoped>
.level-center{max-width:1100px;margin:auto;display:grid;gap:24px;padding:12px}.heading{display:flex;justify-content:space-between;align-items:center;gap:15px}.eyebrow{font-size:12px;letter-spacing:3px;color:#8e7542}h1{font-size:30px;margin:8px 0}h2{font-size:18px;margin:0 0 18px}p{line-height:1.8;color:#667085;margin:12px 0}.hero{border-radius:20px;padding:22px;background:linear-gradient(120deg,#f3f6fc,#fcf7e9);border:1px solid #e7e7e4}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:24px;padding:0 14px}.metrics span{display:block;font-size:13px;color:#667085}.metrics b{font-size:26px;display:block;margin-top:8px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}.roadmap{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.milestone{padding:20px 14px;border:1px solid #e4e7ed;border-radius:14px;background:white;color:#768090}.milestone.active{border-color:#b6c9e3;background:#f0f5fb;color:#314f7d}.milestone p{font-size:13px}.appearance-form{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:20px 0}.appearance-form label{display:grid;gap:10px}.hint{font-size:13px}.theme-ocean{background:#f2f8fc}.theme-forest{background:#f3f9f3}@media(max-width:700px){.columns{grid-template-columns:1fr}.roadmap{grid-template-columns:1fr 1fr}.appearance-form{grid-template-columns:1fr 1fr}.metrics b{font-size:20px}.hero{padding:14px}.heading p{font-size:13px}.heading{align-items:flex-start}}
.comment-previews{display:grid;grid-template-columns:1fr 1fr;gap:20px}@media(max-width:700px){.comment-previews{grid-template-columns:1fr}}.frame-picker{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px}.frame-option{min-height:168px;padding:12px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:1px solid #dce3ed;border-radius:14px;background:#f8fafc;cursor:pointer;color:#334155}.frame-option.selected{border:2px solid #409eff;background:#eff6ff}.frame-option:disabled{cursor:not-allowed;background:#f4f5f7;color:#87909e}.frame-option small{font-size:12px}.frame-option:focus-visible{outline:3px solid #80bdff;outline-offset:2px}@media(max-width:700px){.frame-picker{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
