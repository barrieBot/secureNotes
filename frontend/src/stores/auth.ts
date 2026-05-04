// frontend/src/stores/auth.ts
import { defineStore } from "pinia";
import api from "@/utils/api";
import { encryptionUtils } from "@/utils/crypto";
import { NotesStore } from "@/stores/notes";

export const authStore = defineStore("auth", {
    state: () => ({
        jwt: null as string | null,
        username: null as string | null,
        pwd_hash_x2k: null as string | null,
    }),

    actions: {
        /**
         * Authenticate a user by hashing their password twice before sending it
         * to the backend.
         *
         * - The password is first hashed with 2,000 iterations and stored locally
         *   in `pwd_hash_x2k`. This can be used for additional local checks.
         * - The password is then hashed with 10,000 iterations and sent to the
         *   `/auth` endpoint as the `password` field.
         *
         * On success the returned JWT token is saved in `this.jwt` and the
         * method resolves to `true`. If the request fails, the error propagates
         * to the caller.
         *
         * @param username - The user’s login name.
         * @param password - The user’s plaintext password.
         * @returns Promise<boolean> – resolves to `true` when sign‑in succeeds.
         */
        async signIn(username: string, password: string) {
            this.username = username;
            this.pwd_hash_x2k = encryptionUtils.keyHashing(
                password,
                username.toLowerCase(),
                2000
            );
            const pwd_hash = encryptionUtils.keyHashing(
                password,
                username.toLowerCase(),
                10000
            );
            const response = await api.post("auth", {
                username: username,
                password: pwd_hash,
            });
            this.jwt = response.data.token;
            return true;
        },

        /**
         * Log the user out.
         *
         * This resets the authentication store, clears the notes store
         * (to remove any user‑specific data from memory), and purges all
         * session storage items. The user will effectively be signed out
         * and any JWT token will be discarded.
         */
        logout() {
            this.$reset();

            const notes = NotesStore();
            notes.$reset();

            sessionStorage.clear();
        },
    },
});
