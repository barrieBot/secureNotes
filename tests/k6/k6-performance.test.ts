import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import * as CryptoJS from 'crypto-js';



export const options = {
    stages: [
        { duration: '15s', target: 20},
        { duration: '1m', target: 20},
        { duration: '15s', target: 0},
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<200']
    }
};


interface AuthResponse {
    token?: string;
};

interface GetNoteDTO {
    title: string;
    note: string;
    error: string | null;
}

interface CreateNoteDTO {
    noteID: string | undefined;
    error: string | null;
}

function encrypt(text: string, key: string) {
    return CryptoJS.AES.encrypt(text, key).toString();
}

function generateUserHash(username: string, password: string) {
    return CryptoJS.PBKDF2(password, username, {
        keySize: 256 / 32,
        iterations: 10,
        hasher: CryptoJS.algo.SHA256,
    }).toString();
}


const BASE_URL ='http://localhost:1234/api/v1'

export default function () {

    /// Auth-POST verification 
    const username = `user_${__VU}`;
    const password = `securepassword_${__VU}`;
    const user_hash = generateUserHash(username, password);
    

    const authenticationPaylod = JSON.stringify({username, password});
    const jsonParams = { headers: {'Content-Type': 'application/json'} };
    const authenticationResponse = http.post(`${BASE_URL}/auth`, authenticationPaylod, jsonParams);

    const authData = authenticationResponse.json() as AuthResponse;

    const authenticationSuccess = check(authenticationResponse, {
        'Auth-200': (r) => r.status === 200,
        'auth-token': (r) => typeof authData.token !== undefined 
    });

    if(!authenticationSuccess){
        fail('Authentication failed');
    }

    const token = authData.token;


    /// Note-POST verification 

    const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };


    const noteTitle = `Test-Note-${__VU}`;
    const noteBody = `Test-Note_Body: ${__VU}`;

    const notePayload = JSON.stringify({
        title_cyper: encrypt(noteTitle, password),
        note_cypher: encrypt(noteBody, user_hash),
        key_hash: user_hash
    });

    const createNoteResponse = http.post(`${BASE_URL}/notes`, notePayload, {headers: authHeaders});
    const createdNote = createNoteResponse.json() as unknown as CreateNoteDTO;

    check(createNoteResponse, {
        'CreateNote-200': (r) => r.status === 200,
        'note-id': (r) => typeof createdNote.noteID !== undefined
    });

    const noteID = createdNote.noteID;


    /// Notes-GET verification


    const listNotesResponse = http.get(`${BASE_URL}/notes`, {headers: authHeaders});

    check(listNotesResponse, {
        'ListNotes-200': (r) => r.status === 200,
        'note-list': (r) => Array.isArray(r.json())
    });


    /// NoteByID-GET verification

    if(noteID){
        const retrieveNoteHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'note-key': user_hash
        }

        const retireveNoteResponse = http.get(`${BASE_URL}/notes/${noteID}`, {headers: retrieveNoteHeaders});
        const retievedNote = retireveNoteResponse.json() as unknown as GetNoteDTO;

        check(retireveNoteResponse, {
            'NoteByID-200': (r) => r.status === 200,
            'retrieved note': (r) => typeof retievedNote.error === null
        })

    }

    sleep(1);


}