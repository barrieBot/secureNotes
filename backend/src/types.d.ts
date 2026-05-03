import 'fastify'

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { user_hash: string };
        user: { user_hash: string };
    }
}

export { };