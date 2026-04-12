<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue'

</script>

<template>
  <div class="login-screen">
    <login-form />
  </div>
</template>

<style scoped>
.login-screen {
  width: 100%;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

</style>