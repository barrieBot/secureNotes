import { EncryptedNote } from "./models/encryptedNote";
import { nanoid } from "nanoid";
import postgres from "./pg-client"
import pool from "./pg-client";

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
export async function addNote(user: string, note: EncryptedNote): Promise<EncryptedNote | null> {
    note.id = nanoid();

    const pps = `
        INSERT INTO notes (id, owner, title, content, sec_hash) 
        VALUES($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const values = [note.id, user, note.title, note.content, note.sec_hash || null];

    try{
        await pool.query(pps, values)
        return note;
    } catch (error){
        /// Console? 
        return null
    }
}

/**
 * Retrieves all encrypted notes for a given user.
 *
 * @param user - The identifier of the user whose notes should be fetched.
 * @returns An array of {@link EncryptedNote} objects. If the user has no
 *   notes, an empty array is returned.
 */
export async function getNotes(user: string) {
    const pps = `
        SELECT id, owner, title, content, sec_hash
        FROM encrypted_notes
        WHERE owner = $1;
    `;

    try {
        const found_notes = await pool.query(pps, [user]);
        return found_notes.rows as EncryptedNote[];
    } catch (Error) {
        /// console?
        return [];
    }

}

/**
 * Retrieves a single encrypted note by its ID for a specific user.
 *
 * @param user - The identifier of the user who owns the note.
 * @param noteId - The unique ID of the note to retrieve.
 * @returns The matching {@link EncryptedNote} object, or `null` if no
 *   note with the provided ID exists for the user.
 */
export async function getNote(user: string, noteId: string): Promise<EncryptedNote | null> {
    const pps = `
        SELECT id, owner, title, content, sec_hash
        FROM encrypted_notes
        WHERE owner = $1 AND id = $2;
    `;

    try {
        const found_notes = await pool.query(pps, [user, noteId]);
        return (found_notes.rows[0] as EncryptedNote) || null;
    } catch (Error) {
        /// console?
        return null;
    }


}