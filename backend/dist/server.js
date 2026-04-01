"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const server = (0, fastify_1.default)({ logger: true });
const sessions = new Map();
const encryptedNoteStore = new Map();
/// sign in
server.post('/api/v1/auth', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user_hash = username + password; // add hash-func
    const user_token = `token_${Math.random().toString(16)}`;
    sessions.set(user_token, user_hash);
    return res.send({ token: user_token });
}));
/// post note
server.post('/api/v1/notes', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user_token = req.headers.authorization;
    if (!user_token) {
        return res.status(400).send({ error: 'No token provided' });
    }
    const submitted_note = req.body;
    addNote(sessions.get(user_token) || "test", {
        id: Date.now().toString(), title: submitted_note.title, content: submitted_note.content
    });
    return res.status(200).send({ notesID: "test-id" });
}));
function addNote(user, note) {
    const notes = encryptedNoteStore.get(user) || [];
    notes.push(note);
    encryptedNoteStore.set(user, notes);
}
/// get notes
server.get('/api/v1/notes', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user_token = req.headers.authorization;
    const user = sessions.get(user_token) || null;
    if (!user) {
        return res.status(400).send({ error: 'No token provided' });
    }
    return getNotes(user);
}));
function getNotes(user) {
    return encryptedNoteStore.get(user) || [];
}
const serve = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield server.listen({ port: 1234, host: '127.0.0.1' });
    }
    catch (error) {
        console.error(error);
    }
});
serve();
