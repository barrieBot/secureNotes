// backend/src/routes.ts
import { FastifyInstance } from 'fastify';
import { generateUserHash, decrypt, encrypt } from "./crypto";
import { EncryptedNote } from "./models/encryptedNote";
import { addNote, getNote, getNotes } from "./persistence";
import { auth } from "./auth";
import { NoteDTO } from './models/NoteDTO';
import { GetNoteDTO } from './models/GetNotDTO';
import { CreateNoteDTO } from './models/CreateNoteDTO';

/**
 * Register all API routes for the application.
 *
 * @param app Fastify instance used to define endpoints.
 */
export async function routes(app: FastifyInstance) {

    /* --------------------------------------------------------------------
     * Sign‑in endpoint
     * --------------------------------------------------------------------
     * POST /auth
     *
     * Payload:
     *   {
     *     username: string,
     *     password: string
     *   }
     *
     * Returns:
     *   { token: string }
     *
     * The token is a JWT signed with the deterministic user hash and is
     * required for all protected routes.
     */
    app.post('/auth', async (req, res) => {
        const { username, password } = req.body as { username: string; password: string };
        const user_hash = generateUserHash(username, password);
        const user_token = app.jwt.sign({ user_hash });
        return res.send({ token: user_token });
    });

    /* --------------------------------------------------------------------
     * Create a new encrypted note
     * --------------------------------------------------------------------
     * POST /notes (requires authentication)
     *
     * Payload (NoteDTO):
     *   {
     *     title_cypher: string,   // encrypted title
     *     note_cypher:  string,   // encrypted content
     *     key_hash:     string    // key used to encrypt sec_hash
     *   }
     *
     * Returns (CreateNoteDTO):
     *   {
     *     noteID: string | undefined,
     *     error: string | null
     *   }
     *
     * The `sec_hash` field stores the encrypted user hash + key hash
     * combination, used later for authentication of individual notes.
     */
    app.post('/notes', { preHandler: auth }, async (req, res) => {
        const user = req.user.user_hash;
        const submitted_note = req.body as NoteDTO;

        if (!submitted_note.title_cypher || !submitted_note.note_cypher || !submitted_note.key_hash) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const savedNote: EncryptedNote | null = addNote(user, {
            owner: user,
            title: submitted_note.title_cypher,
            content: submitted_note.note_cypher,
            sec_hash: encrypt(user, submitted_note.key_hash),
        });

        if (savedNote) {
            const body: CreateNoteDTO = { noteID: savedNote.id, error: null };
            res.status(200).send(body);
            return savedNote;
        } else {
            const body: CreateNoteDTO = { noteID: undefined, error: 'Problem saving note' };
            res.status(500).send(body);
            return savedNote;
        }
    });

    /* --------------------------------------------------------------------
     * Retrieve note summaries
     * --------------------------------------------------------------------
     * GET /notes (requires authentication)
     *
     * Returns:
     *   Array< { id: string, title: string } >
     *
     * Provides a lightweight list of all notes owned by the authenticated user.
     */
    app.get('/notes', { preHandler: auth }, async (req, res) => {
        const user = req.user.user_hash;
        const notes = getNotes(user);

        const noteList = notes.map(note => ({ id: note.id!, title: note.title }));
        return res.status(200).send(noteList);
    });

    /* --------------------------------------------------------------------
     * Retrieve a single note
     * --------------------------------------------------------------------
     * GET /notes/:id (requires authentication)
     *
     * Headers:
     *   note-key: string   // key used to decrypt the note's sec_hash
     *
     * Parameters:
     *   id: string   // note identifier
     *
     * Returns (GetNoteDTO):
     *   {
     *     title: string,
     *     note: string,
     *     error: string | null
     *   }
     *
     * The endpoint verifies that the provided `note-key` matches the stored
     * `sec_hash`.  On success it returns the decrypted title and content.
     */
    app.get('/notes/:id', { preHandler: auth }, async (req, res) => {
        const user = req.user.user_hash;
        const { id } = req.params as { id: string };
        const note_key = req.headers['note-key'] as string;

        if (!user || !note_key) return res.status(400).send({ error: 'Invalid Auth' });

        const note = getNote(user, id);
        if (!note) return res.status(404).send({ error: 'Note not found' });

        if (user === decrypt(note.sec_hash!, note_key)) {
            const body: GetNoteDTO = { title: note.title, note: note.content, error: null };
            res.status(200).send(body);
            return true;
        } else {
            const body: GetNoteDTO = { title: '', note: '', error: 'Invalid Auth' };
            res.status(500).send(body);
            return false;
        }
    });
}