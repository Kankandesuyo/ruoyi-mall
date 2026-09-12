<template>
  <span class="member-avatar" :class="[{ framed: !!frameImage, compact }, 'style-' + frame]">
    <el-avatar class="portrait" :src="avatarUrl(avatar)" fit="cover">{{ nickname?.charAt(0) || 'U' }}</el-avatar>
    <img v-if="frameImage" class="frame-art" :src="frameImage" alt="" aria-hidden="true" draggable="false" @error="failed = true" />
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { avatarUrl } from '@/utils/avatar'
import silver from '@/assets/avatar-frames/lv3.png'
import aurora from '@/assets/avatar-frames/lv4.png'
import gold from '@/assets/avatar-frames/lv5.png'
const props = defineProps({ avatar: String, nickname: String, frame: { type: String, default: 'default' }, compact: Boolean })
const frames = { silver, aurora, gold }
const failed = ref(false)
const frameImage = computed(() => failed.value ? null : frames[props.frame])
watch(() => props.frame, () => { failed.value = false })
</script>

<style scoped>
.member-avatar { position: relative; display: inline-grid; place-items: center; width: 68px; height: 68px; flex: 0 0 auto; isolation: isolate; vertical-align: middle; }
.portrait { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; font-size: 22px; }
.portrait :deep(img) { width: 100%; height: 100%; object-fit: cover; object-position: center; }
.framed { width: 104px; height: 104px; }
.framed .portrait { width: 68%; height: 68%; }
.style-aurora.framed .portrait { width: 66%; height: 66%; }
.style-gold.framed .portrait { width: 66%; height: 66%; }
.frame-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1; pointer-events: none; user-select: none; }
.compact { width: 40px; height: 40px; }
.compact.framed { width: 62px; height: 62px; }
.compact .portrait { font-size: 15px; }
</style>
