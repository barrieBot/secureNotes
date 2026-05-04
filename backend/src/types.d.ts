// backend/src/types.d.ts
import 'fastify';

/**
 * Extend the `@fastify/jwt` module to expose the custom shape of the JWT
 * payload and the `user` object that the authentication plugin attaches to
 * the Fastify request.
 *
 * - `payload`:  The decoded JWT payload expected to contain a `user_hash`.
 * - `user`:     A convenience property that mirrors the payload, making it
 *   easier for route handlers and middleware to access the authenticated
 *   user via `request.user`.
 */
declare module '@fastify/jwt' {
    interface FastifyJWT {
        /** Decoded JWT payload. */
        payload: { user_hash: string };

        /** Convenience property exposing the authenticated user. */
        user: { user_hash: string };
    }
}

export { };
