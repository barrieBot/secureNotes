import { EncryptedNote } from "./encryptedNote";


/// Remove when DB
const sessions = new Map<string, string>();
const encryptedNoteStore = new Map<string, EncryptedNote[]>();


export function addSession(token:string, user: string){
    sessions.set(token, user);
}

export function retrieveSession(token: string){
    return sessions.get(token) || null;
}

export function addNote(user: string, note: EncryptedNote) {
    const notes = encryptedNoteStore.get(user) || [];
    notes.push(note);
    encryptedNoteStore.set(user, notes);
}

export function getNotes(user: string) {
    return encryptedNoteStore.get(user) || [];
}

export function getNote(user: string, noteId: string) {
    const notes = getNotes(user);
    return notes.find((n) => n.id === noteId) || null;
}
