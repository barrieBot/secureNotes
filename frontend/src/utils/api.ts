import axios from "axios";
import { authStore } from "@/stores/auth";

<<<<<<< Updated upstream
const api = axios.create({
    /// set via environment-variable
    baseURL: 'http://localhost:1234/api/v1',
})

=======
/**
 * Axios instance used for all API requests.
 *
 * The base URL is currently hard‑coded to a local development server.
 * In a production build this should be replaced by an environment variable.
 */
const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:1234/api/v1";

const api = axios.create({
    baseURL: BASE_URL,
});
/**
 * Request interceptor that injects the JWT token into every outgoing request.
 *
 * It fetches the token from the Pinia `authStore`. If a JWT is present,
 * the request headers are augmented with `Authorization: Bearer <token>`.
 */
>>>>>>> Stashed changes
api.interceptors.request.use((config) => {
    const auth = authStore();

    // Attach a bearer token to every request if the user is authenticated.
    if (auth.jwt) {
        config.headers.Authorization = `Bearer ${auth.jwt}`;
    }

    return config;
});

export default api;