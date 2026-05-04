import { defineStore } from "pinia";
import api from '../utils/api';
import { encryptionUtils } from "@/utils/crypto";
import { authStore } from "@/stores/auth";
import { Note } from "@/types/note"
import { NoteDTO } from "@/types/note_dto";
import { GetNoteDTO } from "@/types/getNote_dto";


export const NotesStore = defineStore('notes', {
    state: () => ({
        notes: [] as Note[],
        selectedNote: null as string | null,
    }),
    actions: {
        async fetchNotes() {
            const auth = authStore();
            const response = await api.get('/notes');
            this.notes = response.data.map((n: any) => ({
                ...n,
                title: encryptionUtils.encrypt(n.title_cypher, auth.pwd_hash_x2k!)
            }));
        },

        async getDecryptNote(id: string, key: string) {
            const auth = authStore()
            const salt = auth.username

            const note = this.notes.find((note) => note.id === id);
            if (!note) return

            const key_x10k = encryptionUtils.keyHashing(key, salt, 10000)
            const key_x15k = encryptionUtils.keyHashing(key, salt, 15000)

            const response = await api.get(`/notes/${id}`, {
                headers: {
                    'note-key': key_x15k
                }
            });

            const data = response.data as GetNoteDTO;

            note.title = encryptionUtils.decrypt(data.title, auth.pwd_hash_x2k!)
            note.decryptedMsg = encryptionUtils.decrypt(data.note, key_x10k);
        },

        async saveNote(title: string, text: string, key: string): Promise<Note> {
            const auth = authStore()
            const salt = auth.username

            const key_10k = encryptionUtils.keyHashing(key, salt, 10000)

            const noteDTO: NoteDTO = {
                title_cypher: encryptionUtils.encrypt(title, auth.pwd_hash_x2k!),
                note_cypher: encryptionUtils.encrypt(text, key_10k),
                key_hash: encryptionUtils.keyHashing(key, salt, 15000),
            }

            console.log(noteDTO);

            const response = await api.post(`/notes`, noteDTO)

            const newNote: Note = {
                id: response.data.id,
                title: title,
                decryptedMsg: text,
                encryptedMsg: noteDTO.note_cypher,
            }

            this.notes.push(newNote);
            return newNote;
        },
        setSelectedNote(note: string | null) {
            if (!note) {
                this.selectedNote = null;
                return
            }
            this.selectedNote = note;
        }
    }

})


