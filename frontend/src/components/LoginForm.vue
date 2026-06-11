<script setup>
import {authStore} from "@/stores/auth.ts";
import {computed, ref} from "vue";
import router from "@/router/routes.ts";

const auth = authStore()
const username = ref('')
const password = ref('')

const isLoading = ref(false)
const isValidLogin = computed(() => {
  return username.value !== '' && password.value !== ''
})

const login = () => {
  if( !isValidLogin.value ){ return }

  isLoading.value = true

  auth.signIn(username.value, password.value)
      .then((data) => {
        if (data) {
          username.value = ''
          password.value = ''
          router.push('/notes')
        }
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {

        isLoading.value = false
      })
}

</script>

<template>
  <div class="login-form">
    <input
        v-model="username"
        type="text"
        placeholder="username"
    />
    <input
        v-model="password"
        type="password"
        placeholder="password"
        @keyup.enter="login"
    />
    <button
        class="login-button"
        :disabled="!isValidLogin"
        @click="login"
    >
      sign in
    </button>
    <div
        v-if="isLoading"
        class="throbber">
      <!--Loading-Animation?-->
    </div>
  </div>

</template>

<style scoped>
.login-form{
  display: flex;
  flex-direction: column;

  width: 100%;
  max-width: 350px;
  background: #222222;
  border: 1px solid #868686;
  border-radius: 1rem;

  padding: 24px;
}

input{
  border: 1px solid #868686;
  background: none;
  padding: 0.5rem 1rem;
  margin-inline: 12px;
  margin-top: 6px;
  color: #31b1a4;
  font-size: 1rem;

  border-radius: .5rem;
}

input:focus{
  background: #1b1b1b;
}

.login-button{
  color: white;
  background: none;
  
  border-style: solid;
  border-width: 1px;
  border-color: white;
  border-radius: .5rem;

  padding: 10px;
  margin-inline: 12px;
  margin-top: 24px;
}

.login-button:disabled {
  color: #cf1919;
  border-color: #cf1919;
}

.login-button:hover:not(:disabled) {
  color: #31b1a4;
  border-color: #31b1a4;
}

</style>