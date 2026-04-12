export interface EncryptedNote {
    id: string;
    owner: string;
    title: string;
    content: string;
    sec_hash: string;
}