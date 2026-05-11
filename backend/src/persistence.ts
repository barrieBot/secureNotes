import { EncryptedNote } from "./models/encryptedNote";
import { nanoid } from "nanoid";
import redis from "./redis-client";

// Key convention: "notes:<user>"
const userKey = (user: string) => `notes:${user}`

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
    await redis.rpush(userKey(user), JSON.stringify(note));

    return note;
}

/**
 * Retrieves all encrypted notes for a given user.
 *
 * @param user - The identifier of the user whose notes should be fetched.
 * @returns An array of {@link EncryptedNote} objects. If the user has no
 *   notes, an empty array is returned.
 */
export async function getNotes(user: string) {
    const raw = await redis.lrange(userKey(user), 0, -1);
    return raw.map((n) => JSON.parse(n) as EncryptedNote)
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
    const notes = await getNotes(user);
    return notes.find((n) => n.id === noteId) || null
}
