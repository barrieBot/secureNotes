import axios from "axios";
import { authStore } from "@/stores/auth";

/**
 * Axios instance used for all API requests.
 *
 * The base URL is currently hard‑coded to a local development server.
 * In a production build this should be replaced by an environment variable.
 */
const api = axios.create({
    /// set via environment-variable
    baseURL: "http://localhost:1234/api/v1",
});

/**
 * Request interceptor that injects the JWT token into every outgoing request.
 *
 * It fetches the token from the Pinia `authStore`. If a JWT is present,
 * the request headers are augmented with `Authorization: Bearer <token>`.
 */
api.interceptors.request.use((config) => {
    const auth = authStore();

    // Attach a bearer token to every request if the user is authenticated.
    if (auth.jwt) {
        config.headers.Authorization = `Bearer ${auth.jwt}`;
    }

    return config;
});

export default api;