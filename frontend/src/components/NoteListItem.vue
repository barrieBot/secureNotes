<script setup lang="ts">
import { Note } from "@/types/note"

defineProps<{
  note: Note,
  isActive: boolean,
}>()

</script>

<template>
  <li class="note-item"
    :class="{'active': isActive}"
  >
    <div class="note-info">
      <span class="note-item-title">{{note.title || 'Untitled'}}</span>
      <span class="note-status">{{note.decryptedMsg ? 'decrypted' : 'encrypted'}}</span>
    </div>
  </li>
</template>

<style scoped>

.note-item {
  padding: 15px;
  border-bottom: 2px solid #a5a5a5;
  border-radius: .5rem;
  transition: 0.2s;
}

.note-item:hover {
  color: #31b1a4; 
  border-color: #31b1a4;
}

.note-item.active {
  color: #31b1a4; 
  border-color: #31b1a4;
}

.note-info {
  display: flex;
  justify-content: space-between;
}

.note-item-title {
  font-weight: 750;
  font-size: 1rem;
  padding-left: 1rem;
}

</style>