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
  box-sizing: border-box;
  
  padding-top: 2rem;
  padding-left: 2rem;
  padding-right: 1rem;
  padding-bottom: 1rem;

}

.title-input{
  font-size: 3rem;
  border: none;
  outline: none;
  margin-bottom: 1.5rem;
  color: white;
  background: none;
}


.note-input{
  font-size: 1.2rem;
  flex-grow: 1;
  background: none;

  border: none;
  outline: none;
  margin-bottom: 24px;
  color: #c0c0c0;
}

.actions{
  display: flex;
  justify-content: flex-end;

}

.save-button{
  border: none;
  outline: none;
  background: none;
  color: white;
  padding: 1rem 4rem;

  border-style: solid;
  border-width: 1px;
  border-color: white;
  border-radius: .5rem;
}

.save-button:disabled{
  color: #cf1919;
  border-color: #cf1919;
}

.save-button:hover:not(:disabled){
  color: #31b1a4;
  border-color: #31b1a4;
}

.save-button:active:not(:disabled){
  background: #31b1a4;
}

</style>