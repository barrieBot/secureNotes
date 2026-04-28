import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import {generateUserHash, decrypt, encrypt} from "./crypto";
import { EncryptedNote } from "./encryptedNote";
import {addNote, getNote, getNotes} from "./persistence"
import {auth} from "./auth";

const server = Fastify({logger: true});

server.register(fastifyJwt, {
    secret: 'env-var for secure JWT encryption', /// add ENV-var here
})

/// sign in
server.post('/api/v1/auth', async (req, res) => {

    const { username, password } = req.body as { username: string; password: string };
    const user_hash = generateUserHash(username, password);

    const user_token = server.jwt.sign({user_hash})
    return res.send({token: user_token});
});

/// post note
server.post('/api/v1/notes',{preHandler: auth}, async (req, res) => {

    const user = req.user.user_hash;

    const submitted_note = req.body as {title: string; content: string; key: string};

    const savedNote: EncryptedNote | null = addNote(user || "test", {
        owner: user,
        title: submitted_note.title,
        content: submitted_note.content,
        sec_hash: encrypt(user, submitted_note.key),
    });

    if(savedNote != null) {
        return res.status(200).send({notesID: savedNote.id});
    } else {
        return res.status(500).send({error: "Problem saving note"})
    }

})


/// get notes

server.get('/api/v1/notes', {preHandler: auth}, async (req, res) => {

    const user = req.user.user_hash;

    const notes = getNotes(user);
    if(notes.length == 0){
        return res.status(200).send([])
    }
    /// Notes need to be mapped from full encryptedNotes to 'slim' versions -> just ID and Title
    const NoteList: {id: string, title: string}[] = []
    notes.forEach(note => {NoteList.push({id: note.id!, title: note.title});});
    return  res.status(200).send(NoteList);

})

server.get('/api/v1/notes/:id',{ preHandler: auth}, async (req, res) => {

    const user = req.user.user_hash;
    const noteId  = req.params as {id: string};


    const note_key = req.headers['note-key'] as string;

    if(!user || !note_key) return res.status(400).send({error: 'Invalid Auth' })

    const note = getNote(user, noteId.id);
    if(!note) return res.status(404).send({error: 'Note not found' })

    if(user === decrypt(note.sec_hash!, note_key)){
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