<script setup>
import {ref, onMounted} from "vue";
const password = ref('')
const passwordInput = ref<HTMLInputElement | null>(null)
defineEmits(["save", "discard", "cancel"])

onMounted(() => passwordInput.value?.focus())

</script>

<template>
  <div class="password-modal">
    <div class="password-popup">
      <h3>Save Note</h3>
      <p>Please enter a key to encrypt your note. </p>
      <input
          class="password-input"
          type="password"
          v-model="password"
          placeholder="Note password"
          @keyup.enter="$emit('save', password)"
          ref="passwordInput"
      />
      <div class="actions">
        <button
            class="discard"
            @click="$emit('discard')"
        >discard</button>
        <button
            class="cancel"
            @click="$emit('cancel')"
        >cancel</button>
        <button
            class="save"
            :disabled="!password"
            @click="$emit('save', password)"
        >save</button>
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
  background: white;
  padding: 16px;
  width: 250px;
}

.actions {
  display: flex;
  flex-direction: row;
  justify-content: right;
}

button {
  padding: 16px;
  border-radius: 3px;
}

.save {
  background: green;
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

.discard {
  background: red;
}

</style>