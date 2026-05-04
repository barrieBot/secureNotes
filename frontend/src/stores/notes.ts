import { defineStore } from "pinia";
import api from '../utils/api';
import { encryptionUtils } from "@/utils/crypto";
import { authStore } from "@/stores/auth";
import { Note } from "@/types/note";
import { NoteDTO } from "@/types/note_dto";
import { GetNoteDTO } from "@/types/getNote_dto";
import { CreateNoteDTO } from "@/types/CreateNoteDTO";

export const NotesStore = defineStore('notes', {
    state: () => ({
        notes: [] as Note[],
        selectedNote: null as string | null,
    }),
    actions: {
        /**
         * Fetch all notes from the server and store them in the local state.
         * The title returned from the API is stored encrypted using the
         * user's password hash. This ensures that titles are never exposed
         * in plain text within the client application.
         */
        async fetchNotes() {
            const auth = authStore();
            const response = await api.get('/notes');
            this.notes = response.data.map((n: any) => ({
                ...n,
                title: encryptionUtils.encrypt(n.title_cypher, auth.pwd_hash_x2k!)
            }));
        },

        /**
         * Retrieve a single note by its ID and decrypt its contents.
         * The method first checks if the note exists locally. If found,
         * it derives two key hashes (10k and 15k iterations) using the
         * provided key and the user's username as salt. These keys are
         * then used to decrypt the note title (with the password hash)
         * and the note body (with the 10k key). The decrypted values
         * are stored back on the local note object.
         */
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

        /**
         * Create a new note on the server and store it locally.
         * The note title is encrypted with the user's password hash
         * while the note body is encrypted with a key derived from
         * the user-provided key and a 10k iteration hash. The key
         * hash for the note (15k iterations) is also sent to the
         * server for later authentication. Upon success, the note is
         * added to the local notes array and returned.
         */
        async saveNote(title: string, text: string, key: string): Promise<Note> {
            const auth = authStore()
            const salt = auth.username

            const key_10k = encryptionUtils.keyHashing(key, salt, 10000)

            const noteDTO: NoteDTO = {
                title_cypher: encryptionUtils.encrypt(title, auth.pwd_hash_x2k!),
                note_cypher: encryptionUtils.encrypt(text, key_10k),
                key_hash: encryptionUtils.keyHashing(key, salt, 15000),
            }

            const response = (await api.post(`/notes`, noteDTO)).data as CreateNoteDTO;

            const newNote: Note = {
                id: response.noteID,
                title: title,
                decryptedMsg: text,
                encryptedMsg: noteDTO.note_cypher,
            }

            this.notes.push(newNote);
            return newNote;
        },

        /**
         * Update the currently selected note identifier.
         * If the provided value is falsy, the selection is cleared.
         */
        setSelectedNote(note: string | null) {
            if (!note) {
                this.selectedNote = null;
                return;
            }
            this.selectedNote = note;
        }
    }
});
