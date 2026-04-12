import { defineStore } from "pinia";
import api from "@/utils/api";
import { encryptionUtils } from "@/utils/crypto";
import {NotesStore} from "@/stores/notes";

export const authStore = defineStore("auth", {
    state: () => ({
        jwt: null as string | null,
        username: null as string | null,
        pwd_hash_x2k: null as string | null
    }),
    actions: {
        async signIn(username: string, password: string) {

            this.username = username;
            this.pwd_hash_x2k = encryptionUtils.keyHashing(password, username.toLowerCase(), 2000)
            const pwd_hash =  encryptionUtils.keyHashing(password, username.toLowerCase(), 10000)
            const token = await  api.put('auth', {
                username: username,
                password: pwd_hash
            })
            this.jwt = token.data.toString()
            return true
        },
        logout() {
            this.$reset();

            const notes = NotesStore();
            notes.$reset()

            sessionStorage.clear()
        }
    }
})