import Fastify from 'fastify';

const server = Fastify({logger: true});

interface EncryptedNote {
    id: string;
    title: string;
    content: string;
}


const sessions = new Map<string, string>();
const encryptedNoteStore = new Map<string, EncryptedNote[]>();

/// sign in
server.post('/api/v1/auth', async (req, res) => {

    const { username, password } = req.body as { username: string; password: string };

    const user_hash = username + password;  // add hash-func
    const user_token = `token_${Math.random().toString(16)}`;
    sessions.set(user_token, user_hash)

    return res.send({token: user_token});
});

/// post note
server.post('/api/v1/notes', async (req, res) => {

    const user_token: string = req.headers.authorization;
    if (!user_token) { return res.status(400).send({error: 'No token provided' }); }

    const submitted_note = req.body as {title: string; content: string};

    addNote(sessions.get(user_token) || "test", {
        id: Date.now().toString(), title: submitted_note.title, content: submitted_note.content
    });

    return res.status(200).send({notesID: "test-id"});
})


function addNote(user: string, note: EncryptedNote) {
    const notes = encryptedNoteStore.get(user) || [];
    notes.push(note);
    encryptedNoteStore.set(user, notes);
}

/// get notes

server.get('/api/v1/notes', async (req, res) => {

    const user_token = req.headers.authorization;
    const user = sessions.get(user_token) || null;
    if (!user) { return res.status(400).send({error: 'No token provided'}); }
    return getNotes(user);

})

function getNotes(user: string) {
    return encryptedNoteStore.get(user) || [];
}

const serve = async () => {
    try{
        await server.listen({port: 1234, host: '127.0.0.1'});
    } catch (error) {
        console.error(error);
    }
}


serve();