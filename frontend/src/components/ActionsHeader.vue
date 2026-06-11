<script setup lang="ts">
import router from '@/router/routes';
import { authStore } from '@/stores/auth';
import { NotesStore} from "@/stores/notes";
import {computed} from "vue";

const auth = authStore()
const notes = NotesStore()
const isLoggedIn = computed(() => {
  return auth.username !== null
})

const addNote = () => { notes.setSelectedNote(null) }
const logout = () => { 
  auth.logout()

  router.push('/')
}

</script>

<template>
<div class="nav-bar">
  <div class="nav-left">
    <h1>SecureNotes</h1>
  </div>

  <div class="nav-right" v-if="isLoggedIn">

    <button class="nav-button"
        @click="addNote"
    >+</button>

    <h3>hi {{auth.username}}</h3>

    <button class="nav-button"
        @click="logout"
    >log out</button>

  </div>

</div>
</template>

<style scoped>
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  height: 100%;
  background: #2b2b2b;
  color: white;
  
}

.nav-left{
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-right{
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-button{
  background: none;
  color: white;
  border: 2px solid #2b2b2b;
  border-radius: 5px;
  transition: 0.2s;

  font-size: 1.5rem;
  min-width: 2rem;
  min-height:2rem;

}

.nav-button:hover{
  color: #31b1a4;
  border-color: #31b1a4;
}

.nav-button:active{
  background: #31b1a4;
  color:black;
}

.add-note-button{
  background: none;
  border-style: solid;
  border-width: 1px;
  border-color: white;
  border-radius: .5rem;

  color: white;
  font-size: 1.5rem;
  min-width: 2rem;
  min-height:2rem;
}


</style>