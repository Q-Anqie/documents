<template>
  <div class="home-stats">
    <div v-for="s in stats" :key="s.label" class="stat">
      <div class="stat-value">{{ s.value }}</div>
      <div class="stat-label">{{ s.label }}</div>
    </div>
  </div>
</template>

<script setup>
const stats = [
  { value: '63', label: '篇官方文档译文' },
  { value: '46', label: '篇模组开发教程' },
  { value: '24万', label: '字中文正文' },
  { value: '66', label: '条术语词条' }
]
</script>
