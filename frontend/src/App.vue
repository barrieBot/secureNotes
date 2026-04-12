<script setup>
import ActionHeader from './components/ActionsHeader.vue'
import router from './router/routes.ts'


</script>

<template>
  <header>
    <ActionHeader/>
  </header>

  <main>
    <router-view/>
  </main>
</template>

<style scoped>

header {
  line-height: 1.5;
}

@media (min-width: 1024px) {
  header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 48px;
    justify-content: center;
  }

  main {
    position: absolute;
    top: 48px;
    left: 0;
    right: 0;
    bottom: 0;
    background: #323232;
  }
}
</style>
