<script setup>
import {ref, onMounted} from "vue";
const password = ref('')
const passwordInput = ref<HTMLInputElement | null>(null)

const emit = defineEmits(['save', 'cancel', 'discard'])

const clear = () => {
  password.value = ''
}

onMounted(() => passwordInput.value?.focus())

function handleSave() {
  if (password.value) emit('save', password.value)
}
</script>

<template>
  <div
    class="password-modal"
    @click.self="emit('cancel')" 
    @keydown.escape="emit('cancel')" 
  >
    <div class="password-popup" role="dialog" aria-modal="true" aria-labelledby="modal-label">
      <label id="modal-label" for="password-input">Save Note</label>
      <input
      id="password-input"
      class="password-input"
      type="password"
      v-model="password"
      placeholder="Note password"
      @keyup.enter="handleSave"
      ref="passwordInput"
      />
      <p>Please enter a key to encrypt your note. </p>
      <div class="actions">
        <button class="discard" @click="$emit('discard')">Discard</button>
        <button class="cancel" @click="$emit('cancel')">Cancel</button>
        <button class="save" :disabled="!password" @click="$emit('save', password)">Save</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.password-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.password-popup {
  background: rgb(71, 63, 63);
  padding: 16px;
  border-radius: 1rem;
  border-style: solid;
  border-width: .1rem;
  border-color: whitesmoke;
}

.password-input {
  width: 100%;
  margin-top: 16px;
}

.actions {
  display: flex;
  flex-direction: row;
  justify-content: right;
  margin-left: 20px;
  gap: 8px;
  padding-top: 16px;
}

button {
  padding-block: 8px;
  border: none;
  border-radius: .2rem;
  min-width: 4rem;
}

.save {
  background: green;
  color: white;
}

.save:hover {
  background: rgb(25, 212, 25);
  color: white;
}

.save:disabled{
  cursor: not-allowed;
  background: darkgray;
  color: gray;
}

.cancel {
  background: gray;
}
.cancel:hover {
  background: rgb(167, 167, 167);
}

.discard {
  background: red;
}

.discard:hover {
  background: rgb(255, 60, 60);
}

input {
  border: 1px solid black;
  border-radius: .2rem;
  padding: 0.5rem;
}

</style>