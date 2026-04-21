<script setup lang="ts">
import { NotesStore } from '@/stores/notes'
import { Note } from '@/types/note'
import {computed, ref} from "vue";

const notes = NotesStore();
const notePWD = ref('');
const requestingUnlock = ref(false);
const unlockError = ref(false);

const currentNote = computed(() => {
  return notes.notes.filter((note) => note.id === notes.selectedNote)[0] || null
})

async function unlockNote() {

  if (!notePWD.value || !currentNote.value || requestingUnlock.value) return
  requestingUnlock.value = true;
  unlockError.value = false;

  try{
    await notes.getDecryptNote(currentNote.value.id, notePWD.value);
    notePWD.value = '';
  } catch (e) {
    unlockError.value = true;
    console.error(e)
  } finally {
    requestingUnlock.value = false;
  }
}

</script>

<template>
  <div class="note-content">
    <header class="note-header">
      <h1 class="note-title">
        {{currentNote?.title}}
      </h1>
    </header>

    <div class="note-locked"
         v-if="!currentNote?.decryptedMsg">
      <p>Note locked!</p>
      <div>
        <input
            type="password"
            class="note-password"
            v-model="notePWD"
            @keyup.enter="unlockNote"
        >
        <button
            :disabled="requestingUnlock"
            @click="unlockNote"
        >Unlock</button>
        <!-- maybe a throbber awaiting unlock?--->
      </div>
      <p class="error-label"
          v-if="unlockError"
      >Password incorrect</p>

    </div>
    <div class="note-unlocked"
         v-else>
      <pre class="note-text">{{ currentNote.decryptedMsg }}</pre>
    </div>


  </div>
</template>

<style scoped>
.note-content{
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

.note-header{
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.note-title{
  font-size: 3rem;
  color: #8a8a8a;
}

.note-locked{
  
}

.note-password{

}



</style>