<script setup lang="ts">
import NoteListItem from "@/components/NoteListItem.vue"
import NoteForm from "@/components/NoteForm.vue"
import NoteView from "@/components/NoteView.vue"
import SaveNotePopup from "@/components/SaveNotePopup.vue";
import { NotesStore } from "@/stores/notes";
import {onBeforeUnmount, onMounted, ref} from "vue";
import {INoteFormInterface} from "@/types/NoteFormInterface";
import {ISaveNotePopupInterface} from "@/types/SaveNotePopupInterface";
import {onBeforeRouteLeave} from "vue-router";

const notesStore = NotesStore();
const pendingSelectedNoteId = ref<string | null>(null);
const noteForm = ref<INoteFormInterface | null>(null);

const showSaveNotePopup = ref(false);
const saveNotePopup = ref<ISaveNotePopupInterface | null>(null);

onMounted(() => {
  notesStore.fetchNotes();
  window.addEventListener("beforeunload", handleTabClose);
})

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleTabClose);
})

/// Prompt save when closing tab?
const handleTabClose = (e: BeforeUnloadEvent) => {
  if(noteForm.value?.dirty) {
    /// Do I need to put a prop in the Save-Popup, that the interaction might close the tab?
    /// Maybe 2nd Popup, with a Close-Flag?
    showSaveNotePopup.value = true;

    e.preventDefault();
    e.returnValue = "You have an unsaved Note. Are you sure you want to leave?";
    return e.returnValue;
  }
}

onBeforeRouteLeave((to, from, next) => {
  if(noteForm.value.dirty){
    pendingSelectedNoteId.value = to.path;
    showSaveNotePopup.value = true;
    next(false)
  } else {
    next();
  }
})

/// Save-Note-Dialog
const onSaveNote = async (password: string) => {
  let title: string = "";
  let message: string = "";

  if (noteForm.value) {
    title = noteForm.value.title;
    message = noteForm.value.noteMsg;
  } else {
    throw new Error('Form not filled out')
  }

  showSaveNotePopup.value = false;

  const newNote = await notesStore.saveNote(title, message, password);

  if(noteForm.value)
    noteForm.value.clear();
  
  if(saveNotePopup.value)
  saveNotePopup.value.clear()

if(pendingSelectedNoteId.value){
  onPendingNoteSelection();
} else {
  onNoteSelection(newNote.id);
}
console.log('Saved new Note')

}

const onDiscardNote = () => {
  if(noteForm.value)
    noteForm.value.clear();
  
  if(saveNotePopup.value)
    saveNotePopup.value.clear()

  onPendingNoteSelection();
}

const onCancelSaveNote = () => {
  showSaveNotePopup.value = false;
  
  if(saveNotePopup.value)
    saveNotePopup.value.clear()
}

/// Select Note from List
const onNoteSelection = (noteId: string | null) => {
  if (notesStore.selectedNote === noteId) {return}
  pendingSelectedNoteId.value = noteId;

  if(noteForm.value?.dirty) {
    showSaveNotePopup.value = true;
  } else {
    onPendingNoteSelection();
  }
}

const onPendingNoteSelection = () => {
  notesStore.setSelectedNote(pendingSelectedNoteId.value);
  showSaveNotePopup.value = false;
  pendingSelectedNoteId.value = null;
}



</script>

<template>
<div class="content">
  <aside class="note-list"
         v-if="notesStore.notes.length > 0"
  >
    <div class="list-header">
      <h3>Notes</h3>
      <button
          class="add-note-button"
          @click="notesStore.setSelectedNote(null) "
      >+</button>
    </div>
    <ul>
      <NoteListItem
          v-for="note in notesStore.notes"
          :key="note.id"
          :note="note"
          :isActive="notesStore.selectedNote === note.id"
          @click="onNoteSelection(note.id)"
      />
    </ul>
  </aside>

  <section class="note">
    <NoteView
        v-if="notesStore.selectedNote"
        :noteId="notesStore.selectedNote"
    />
    <NoteForm
        v-else
        ref="noteForm"
        @saveNote="showSaveNotePopup = true"
    />
  </section>

  <SaveNotePopup
      v-if="showSaveNotePopup"
      @cancel="onCancelSaveNote"
      @save="onSaveNote"
      @discard="onDiscardNote"
  />

</div>
</template>

<style scoped>
.content{
  display: flex;
  height: 100%;
  overflow: hidden;
}

.note-list {
  width: 100%;
  max-width: 350px;
  flex-direction: column;
  display: flex;
  border-right: 1px solid #4c4c4c;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #4c4c4c;
  padding: 1rem;
}

.list-header h3{
  color: white;
}

.note-list ul{
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex-grow: 1;
}

.note{
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

}

.add-note-button{
  background: none;
  border: none;
  outline: none;

  color: white;
  font-size: 1.5rem;
}

</style>