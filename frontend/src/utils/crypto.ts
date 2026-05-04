import CryptoJS from 'crypto-js';

export const encryptionUtils = {

    keyHashing(pwd: string, salt: string, hashingIterations: number): string {
        return CryptoJS.PBKDF2(pwd, salt, {
            keySize: 256 / 32,
            iterations: hashingIterations,
            hasher: CryptoJS.algo.SHA256
        }).toString();
    },

    encrypt(text: string, key: string) {
        console.log(`Encryption: ${key} - ${text}`)
        return CryptoJS.AES.encrypt(text, key).toString();
    },

    decrypt(text: string, key: string) {
        console.log(`Decryption: ${key} - ${text}`)
        const decrypt = CryptoJS.AES.decrypt(text, key).toString(CryptoJS.enc.Utf8);
        if (!decrypt) throw new Error(`${text} is not a valid decryption`);
        return decrypt;
    }

}