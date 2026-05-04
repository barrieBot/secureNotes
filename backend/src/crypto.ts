import * as CryptoJS from 'crypto-js'

export function generateUserHash(username: string, password: string) {
    return CryptoJS.PBKDF2(password, username, {
        keySize: 256 / 32,
        iterations: 10,
        hasher: CryptoJS.algo.SHA256
    }).toString();
}

export function encrypt(text: string, key: string) {
    return CryptoJS.AES.encrypt(text, key).toString();
}

export function decrypt(text: string, key: string) {
    const decrypt: string = CryptoJS.AES.decrypt(text, key).toString(CryptoJS.enc.Utf8);
    if (!decrypt) return null
    return decrypt;
}