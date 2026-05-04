export interface Note {
    id: string | undefined;
    title: string;
    encryptedMsg?: string;
    decryptedMsg?: string;
}
