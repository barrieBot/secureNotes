<script setup lang="ts">
import { Note } from "@/utils/note"

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
      <span class="note-title">{{note.title || 'Untitled'}}</span>
      <span class="note-status">{{note.decryptedMsg ? 'decrypted' : 'encrypted'}}</span>
    </div>
  </li>
</template>

<style scoped>

.note-item {
  padding: 15px;
  border-bottom: 1px solid #a5a5a5;
  transition: 0.2s;
}

.note-item:hover {
  background-color: #a5a5a5;
}

.note-item.active {
  background-color: #8c8c8c;
}

.note-info {
  display: flex;
  justify-content: space-between;
}

</style>