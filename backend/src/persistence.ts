import { EncryptedNote } from "./models/encryptedNote";
import { nanoid } from "nanoid";

/// Remove when DB
const encryptedNoteStore = new Map<string, EncryptedNote[]>();

/**
 * Adds a new encrypted note for a specific user.
 *
 * @param user - The identifier of the user to whom the note belongs.
 * @param note - The {@link EncryptedNote} object to store. The `id` field
 *   will be automatically generated using `nanoid` before the note is
 *   persisted.
 * @returns The note object with the newly assigned `id`, or `null` if the
 *   operation fails (currently it always succeeds).
 */
export function addNote(user: string, note: EncryptedNote): EncryptedNote | null {
    note.id = nanoid();
    const notes = encryptedNoteStore.get(user) || [];
    notes.push(note);
    encryptedNoteStore.set(user, notes);
    return note;
}

/**
 * Retrieves all encrypted notes for a given user.
 *
 * @param user - The identifier of the user whose notes should be fetched.
 * @returns An array of {@link EncryptedNote} objects. If the user has no
 *   notes, an empty array is returned.
 */
export function getNotes(user: string) {
    return encryptedNoteStore.get(user) || [];
}

/**
 * Retrieves a single encrypted note by its ID for a specific user.
 *
 * @param user - The identifier of the user who owns the note.
 * @param noteId - The unique ID of the note to retrieve.
 * @returns The matching {@link EncryptedNote} object, or `null` if no
 *   note with the provided ID exists for the user.
 */
export function getNote(user: string, noteId: string) {
    const notes = getNotes(user);
    return notes.find((n) => n.id === noteId) || null;
}
