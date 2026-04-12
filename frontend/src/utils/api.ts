import axios from "axios";
import {authStore} from "@/stores/auth";

const api = axios.create({
    /// set via environment-variable
    baseURL: 'http://localhost:3000/api',
})

api.interceptors.request.use((config) => {
    const auth = authStore();
    if(auth.jwt) {
        config.headers.Authorization = `Bearer ${auth.jwt}`
    }
    return config;
})

export default api;