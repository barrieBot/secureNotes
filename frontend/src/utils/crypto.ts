import CryptoJS from "crypto-js";

export const encryptionUtils = {
    /**
     * Derive a cryptographic key from a password.
     *
     * @param pwd - The plain‑text password.
     * @param salt - A unique salt value.
     * @param hashingIterations - Number of PBKDF2 iterations (higher = more secure).
     * @returns The derived key as a hex string.
     */
    keyHashing(pwd: string, salt: string, hashingIterations: number): string {
        return CryptoJS.PBKDF2(pwd, salt, {
            keySize: 256 / 32,
            iterations: hashingIterations,
            hasher: CryptoJS.algo.SHA256,
        }).toString();
    },

    /**
     * Encrypt a UTF‑8 string using AES.
     *
     * @param text - The plain‑text to encrypt.
     * @param key  - The encryption key (hex or UTF‑8).
     * @returns Base64‑encoded ciphertext.
     */
    encrypt(text: string, key: string) {
        return CryptoJS.AES.encrypt(text, key).toString();
    },

    /**
     * Decrypt a Base64‑encoded ciphertext that was encrypted with the above `encrypt` method.
     *
     * @param text - The ciphertext to decrypt.
     * @param key  - The key used during encryption.
     * @returns The decrypted plain‑text.
     * @throws Error if decryption fails (e.g., wrong key or corrupted data).
     */
    decrypt(text: string, key: string) {
        const decrypt = CryptoJS.AES.decrypt(text, key).toString(
            CryptoJS.enc.Utf8
        );
        if (!decrypt) throw new Error(`${text} is not a valid decryption`);
        return decrypt;
    },
};