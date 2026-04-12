import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import {generateUserHash, decrypt, encrypt} from "./crypto";
import { EncryptedNote } from "./encryptedNote";
import {addSession, retrieveSession, addNote, getNote, getNotes} from "./persistence"

const server = Fastify({logger: true});

server.register(fastifyJwt, {
    secret: 'env-var for secure JWT encryption', /// add ENV-var here
})

/// sign in
server.post('/api/v1/auth', async (req, res) => {

    const { username, password } = req.body as { username: string; password: string };

    const user_hash = generateUserHash(username, password);
    const user_token = `token_${Math.random().toString(16)}`; /// Better Token? JWT?
    addSession(user_token, user_hash)

    return res.send({token: user_token});
});

/// post note
server.post('/api/v1/notes', async (req, res) => {

    const user_token: string = req.headers.authorization;
    if (!user_token) { return res.status(400).send({error: 'No token provided' }); }

    const user = retrieveSession(user_token);
    if(!user)  { return res.status(400).send({error: 'Missing Auth' }); }

    const submitted_note = req.body as {title: string; content: string; key: string};

    addNote(user || "test", {
        id: Date.now().toString(),
        owner: user,
        title: submitted_note.title,
        content: submitted_note.content,
        sec_hash: encrypt(user, submitted_note.key),
    });

    return res.status(200).send({notesID: "test-id"});
})


/// get notes

server.get('/api/v1/notes', async (req, res) => {

    const user_token = req.headers.authorization;
    const user = retrieveSession(user_token)
    if (!user) { return res.status(400).send({error: 'No token provided'}); }
    const notes = getNotes(user);
    if(notes.length == 0){
        return res.status(404).send({error: 'No notes found'})
    }
    return notes;

})

server.get('api/v1/notes/:id', async (req, res) => {

    const noteId  = req.params as {id: string};
    const user_token = req.headers.authorization;
    const user = retrieveSession(user_token);
    const note_key = req.headers['note-key'] as string;

    if(!user || !note_key) return res.status(400).send({error: 'Invalid Auth' })

    const note = getNote(user, noteId.id);
    if(!note) return res.status(404).send({error: 'Note not found' })

    if(user === decrypt(note.sec_hash, note_key)){
        return res.status(200).send({note: note.content})
    }

    return res.status(400).send({error: 'Invalid Auth' });

})


const serve = async () => {
    try{
        /// add ENV-Variables here
        await server.listen({
            port: 1234,
            host: '127.0.0.1'
        });
    } catch (error) {
        console.error(error);
    }
}


serve();