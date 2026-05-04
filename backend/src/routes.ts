import { FastifyInstance } from 'fastify';
import { generateUserHash, decrypt, encrypt } from "./crypto";
import { EncryptedNote } from "./encryptedNote";
import { addNote, getNote, getNotes } from "./persistence";
import { auth } from "./auth";
import './types.d'
import { NoteDTO } from './models/note_dto';
import { GetNoteDTO } from './models/getNote_dto';

export async function routes(app: FastifyInstance) {

    // sign in
    app.post('/auth', async (req, res) => {
        const { username, password } = req.body as { username: string; password: string };
        const user_hash = generateUserHash(username, password);
        const user_token = app.jwt.sign({ user_hash });
        return res.send({ token: user_token });
    });

    // post note
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

        return savedNote
            ? res.status(200).send({ notesID: savedNote.id })
            : res.status(500).send({ error: 'Problem saving note' });
    });

    // get note list
    app.get('/notes', { preHandler: auth }, async (req, res) => {
        const user = req.user.user_hash;
        const notes = getNotes(user);

        const noteList = notes.map(note => ({ id: note.id!, title: note.title }));
        return res.status(200).send(noteList);
    });

    // get single note
    app.get('/notes/:id', { preHandler: auth }, async (req, res) => {
        const user = req.user.user_hash;
        const { id } = req.params as { id: string };
        const note_key = req.headers['note-key'] as string;

        if (!user || !note_key) return res.status(400).send({ error: 'Invalid Auth' });

        const note = getNote(user, id);
        if (!note) return res.status(404).send({ error: 'Note not found' });

        if (user === decrypt(note.sec_hash!, note_key)) {
            const body: GetNoteDTO = {
                title: note.title,
                note: note.content,
                error: null,
            };
            res.status(200).send(body);

            return true;
        } else {
            const body: GetNoteDTO = {
                title: '',
                note: '',
                error: 'Invalid Auth'
            };
            res.status(500).send(body);

            return false;
        }
    });
}