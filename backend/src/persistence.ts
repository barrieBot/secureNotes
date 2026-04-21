import { EncryptedNote } from "./encryptedNote";
import {nanoid} from "nanoid";


/// Remove when DB
const encryptedNoteStore = new Map<string, EncryptedNote[]>();


export function addNote(user: string, note: EncryptedNote): EncryptedNote | null {
    note.id = nanoid();
    const notes = encryptedNoteStore.get(user) || [];
    notes.push(note);
    encryptedNoteStore.set(user, notes);
    return note;
}

export function getNotes(user: string) {
    return encryptedNoteStore.get(user) || [];
}

export function getNote(user: string, noteId: string) {
    const notes = getNotes(user);
    return notes.find((n) => n.id === noteId) || null;
}
