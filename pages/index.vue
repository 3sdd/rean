<template>
  <div class="container">
    <div>
      <nuxt-link to="/create-project" class="block p-2 border-2 rounded mb-2">プロジェクト作成</nuxt-link>
      <nuxt-link to="/open-project" class="block p-2 border-2 rounded mb-2">プロジェクトを開く</nuxt-link>
      <!-- <nuxt-link to="/rect-annotator" class="block">debug＿アノテーションページ</nuxt-link> -->
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
})
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

</style>
