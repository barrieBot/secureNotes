<script setup lang="ts">
import { computed, ref } from "vue";



const title = ref('')
const noteMsg = ref('')
const dirty = computed(() => {
  return (title.value.length > 0 || noteMsg.value.length > 0)
})

const clear = () => {
  title.value = '';
  noteMsg.value = '';
}

defineExpose({dirty, title, noteMsg, clear})
defineEmits(['saveNote'])


</script>

<template>
<div class="note-form">
  <input
      class="title-input"
      type="text"
      placeholder="Title"
      v-model="title"
  />
  <textarea
      class="note-input"
      type="text"
      placeholder="Tell me your secrets...."
      v-model="noteMsg"
  />
  <div class="actions">
    <button
        class="save-button"
        :disabled="!dirty"
        @click="$emit('saveNote')"
    >
      Save Note
    </button>
  </div>
</div>
</template>

<style scoped>
.note-form{
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

.title-input{
  font-size: 3rem;
  border: none;
  outline: none;
  margin-bottom: 1.5rem;
  color: #8a8a8a;
  background: none;
}


.note-input{
  font-size: 1.2rem;
  flex-grow: 1;
  background: none;

  border: none;
  outline: none;
  margin-bottom: 24px;
  color: #8a8a8a;
}

.actions{
  display: flex;
  justify-content: flex-end;

}

.save-button{
  border: none;
  outline: none;
  background: #222222;
  color: #fff;
  padding: 1rem 4rem;
}

.save-button:disabled{
  background: #777777;
}

.save-button:hover:not(:disabled){
  background: #1b1b1b;
}

.save-button:active:not(:disabled){
  background: #31b1a4;
}

</style>