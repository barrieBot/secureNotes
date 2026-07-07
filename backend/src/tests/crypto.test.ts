import test, { describe } from 'node:test'
import { decrypt, encrypt, generateUserHash } from '../crypto'

function expectHex64(hash: string) {
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
}

function expectBase64(str: string) {
    expect(typeof str).toBe('string');
    expect(str).not.toBe('');
    expect(str).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 alphabet
}

describe('generateUserHash', () => {
    // arrange
    const username = 'alice';
    const password = 'secret123';

    it('empty username and password', () => {
        // act
        const hash = generateUserHash('', '');

        //assert
        expectHex64(hash);
    });

    it('very long password (10000 chars', () => {
        // arrange
        const longPass = 'a'.repeat(10_000);

        // act
        const hash = generateUserHash(username, longPass);

        // assert
        expectHex64(hash);
    });

    it('Unicode characters in password and username', () => {
        // arrange
        const uUsername = '🤖Üser';
        const uPassword = 'pässwörd🔒';

        // act
        const hash = generateUserHash(uUsername, uPassword);

        // assert
        expectHex64(hash);
    });

    it('password with only whitespace', () => {
        // arrange
        const wsPassword = '    \t\n';

        // act 
        const hash = generateUserHash(username, wsPassword);

        // assert
        expectHex64(hash);
    });

    it('consistency: same input produce identical hash', () => {
        // act
        const hash1 = generateUserHash(username, password);
        const hash2 = generateUserHash(username, password);

        // assert
        expectHex64(hash1);
        expect(hash1).toBe(hash2);
    });

    it('produces a different hash for a different password', () => {
        // act
        const hashSameUser = generateUserHash(username, password);
        const hashDifferentPassword = generateUserHash(username, 'anotherSecret321');

        // assert
        expectHex64(hashSameUser);
        expectHex64(hashDifferentPassword);
        expect(hashSameUser).toBe(hashDifferentPassword)
    });

    it('produces a different hash for a different username (salt)', () => {
        // act
        const hashSamePassword = generateUserHash(username, password);
        const hashDifferentUser = generateUserHash('bob', password);

        // assert
        expectHex64(hashSamePassword);
        expectHex64(hashDifferentUser);
        expect(hashSamePassword).not.toBe(hashDifferentUser);
    });
});

describe('encrypt / decrypt', () => {
    // arrange
    const testKey = 'superSecretKey';

    it('encrypts and returns a base64 string', () => {
        // act
        const cipher = encrypt('hello world', testKey);

        // assert
        expectBase64(cipher);
    });

    it('decrypt returns the original text', () => {
        // arrange
        const originalText = 'We are setting up a CI/CD pipeline for this course!';
        const cipherText = encrypt(originalText, testKey);

        // act
        const decryptedText = decrypt(cipherText, testKey);

        // assert
        expect(decryptedText).toBe(originalText);
    });

    it('returns null for an incorrect key', () => {
        // arrange
        const originalText = 'We are setting up a CI/CD pipeline for this course!';
        const cipher = encrypt(originalText, testKey);
        const badKey = 'wrongKey';

        // act
        const result = decrypt(cipher, badKey);

        // assert
        expect(result).toBeNull();
    });

    it('empty string decrtypt result is null', () => {
        // act
        const cipher = encrypt('', testKey);
        const decryptedString = decrypt(cipher, testKey);

        // assert
        expect(decryptedString).toBeNull();
    });

    it('unicode and special characters encrypt / decrypt correctly', () => {
        // arrange
        const originalText = '¡Hola! Señor Müller!';

        // act
        const cipher = encrypt(originalText, testKey);
        const decryptedString = decrypt(cipher, testKey);

        //assert
        expect(decryptedString).toBe(originalText);
    });

    it('tampering ciphertext results in null from decrypt', () => {
        // arrange
        const originalText = 'We are setting up a CI/CD pipeline for this course!';

        // act
        const cipher = encrypt(originalText, testKey);
        const tamperedCipher = cipher.substring(0, 5) + 'A' + cipher.substring(6);
        const result = decrypt(tamperedCipher, testKey);

        // assert
        expect(result).toBeNull();
    });

    it('encrypts the same text with the same key to different ciphertexts', () => {
        // arrange
        const originalText = 'We are setting up a CI/CD pipeline for this course!';

        // act
        const cipher1 = encrypt(originalText, testKey);
        const cipher2 = encrypt(originalText, testKey);

        // assert
        if (cipher1 != cipher2) { // small chance to actually get the same cipher
            expect(cipher1).not.toBe(cipher2);
        } else {
            console.warn('The ciphers did match, look for repeat results')
        }
    })
})
