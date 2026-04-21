import 'fastify'

declare module 'fastify' {
    interface FastifyRequest {
        user: {
            user_hash: string;
        }
    }
}