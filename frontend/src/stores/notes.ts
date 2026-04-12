import { defineStore} from "pinia";
import api from '../utils/api';
import {encryptionUtils} from "@/utils/crypto";
import {authStore} from "@/stores/auth";
import {Note} from "@/utils/note"


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

            const response = await api.post(`/notes/${id}`, {
                key: key_x15k
            });
            try {
                note.decryptedMsg = encryptionUtils.decrypt(response.data.toString(), key_x10k);
            } catch (e) {
                throw e;
            }
        },

        async saveNote(title: string, text: string, key: string): Promise<Note> {
            const auth = authStore()
            const salt = auth.username

            const key_10k = encryptionUtils.keyHashing(key, salt, 10000)
            const key_15k = encryptionUtils.keyHashing(key, salt, 15000)

            const title_cypher = encryptionUtils.encrypt(title, auth.pwd_hash_x2k!)
            const note_cypher = encryptionUtils.encrypt(text, key_10k);

            const response = await api.post(`/notes`, {
                title_cypher: title_cypher,
                note_cypher: note_cypher,
                key_hash: key_15k,
            })

            const newNote: Note = {
                id: response.data.id,
                title: title,
                encryptedMsg: note_cypher,
                decryptedMsg: text
            }

            this.notes.push(newNote);
            return newNote;
        },
        setSelectedNote(note: string | null) {
            if (!note)  {
                this.selectedNote = null;
                return
            }
            this.selectedNote = note;
        }
    }

})


