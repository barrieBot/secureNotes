import * as CryptoJS from 'crypto-js';

/**
 * Generates a salted password hash for a user.
 *
 * @param username - The username used as the salt.
 * @param password - The plaintext password to hash.
 * @returns A hex string representing the derived key.
 */
export function generateUserHash(username: string, password: string) {
    return CryptoJS.PBKDF2(password, username, {
        keySize: 256 / 32,
        iterations: 10,
        hasher: CryptoJS.algo.SHA256,
    }).toString();
}

/**
 * Encrypts a UTF‑8 string using AES with the provided key.
 *
 * @param text - The plaintext to encrypt.
 * @param key - The secret key (any string). CryptoJS will internally derive the key.
 * @returns The base64‑encoded ciphertext.
 */
export function encrypt(text: string, key: string) {
    return CryptoJS.AES.encrypt(text, key).toString();
}

/**
 * Decrypts a ciphertext produced by {@link encrypt}.
 *
 * @param text - The base64‑encoded ciphertext.
 * @param key - The secret key used during encryption.
 * @returns The original plaintext string, or `null` if decryption fails.
 */
export function decrypt(text: string, key: string) {
    const decrypt: string = CryptoJS.AES.decrypt(text, key).toString(CryptoJS.enc.Utf8);
    if (!decrypt) return null;
    return decrypt;
}